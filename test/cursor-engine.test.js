import assert from "node:assert/strict";
import test from "node:test";

import { CursorEngine, blinkWakeMs, caretCoords } from "../src/cursor-engine.js";
import { DEFAULTS } from "../src/cursor-smith.js";

function makeEngine(overrides = {}) {
  let rect = null;
  const engine = new CursorEngine({
    settings: { ...DEFAULTS, moveDelayMs: 0, ...overrides },
    doc: {},
    measurer: { latest: () => rect },
  });
  const el = {};
  const set = (x, pos, useEl = el) => {
    rect = { x, y: 10, width: 8, height: 16, glyph: "a", color: "#fff", fontSize: "14px", pos, el: useEl };
  };
  return { engine, set, el };
}

test("caretCoords passes pos and el through", () => {
  const { engine, set, el } = makeEngine();
  set(5, 3);
  const c = caretCoords(engine);
  assert.equal(c.pos, 3);
  assert.equal(c.el, el);
});

test("a move with a changed pos commits a move and pushes the trail", () => {
  const { engine, set } = makeEngine();
  set(5, 3);
  engine.updateActivePoint();
  set(13, 4);
  engine.updateActivePoint();
  assert.equal(engine.lastActive.pos, 4);
  assert.equal(engine.trail.length, 1);
  assert.ok(engine.lastMoveTime > 0);
});

test("an unchanged pos with a moved box translates instead of committing", () => {
  const { engine, set } = makeEngine();
  set(5, 3);
  engine.updateActivePoint();
  engine.animActive = { x: 5, top: 10, w: 8, h: 16 };
  set(25, 3);
  engine.updateActivePoint();
  assert.equal(engine.trail.length, 0);
  assert.equal(engine.lastMoveTime, 0);
  assert.equal(engine.animActive.x, 25);
});

test("the same pos in a different element is a real move", () => {
  const { engine, set } = makeEngine();
  set(5, 0);
  engine.updateActivePoint();
  set(40, 0, {});
  engine.updateActivePoint();
  assert.equal(engine.trail.length, 1);
});

test("blinkWakeMs targets the next plateau edge", () => {
  const period = 2500 / 1.2;
  // Inside the on plateau: wake at the start of the fade-out (p1 = 0.35).
  const inOn = blinkWakeMs(0.1 * period, 1.2, 0.5);
  assert.ok(Math.abs(inOn - (0.25 * period + 4)) < 2);
  // Inside the off plateau: wake at the start of the fade-in (p3 = 0.85).
  const inOff = blinkWakeMs(0.6 * period, 1.2, 0.5);
  assert.ok(Math.abs(inOff - (0.25 * period + 4)) < 2);
  assert.equal(blinkWakeMs(0, 0, 0.5), 0);
});

test("blinking + idle arms a timer instead of parking, and stop clears it", () => {
  const { engine, set } = makeEngine({ blinkingEnabled: true, torchEffect: false });
  const target = { addEventListener() {}, removeEventListener() {} };
  engine._doc = { ...target, defaultView: { ...target, visualViewport: target } };
  engine.canvasWrapper = { isConnected: true, style: {}, remove() {} };
  const timers = [];
  const cleared = [];
  const saved = {};
  const stub = (name, fn) => {
    saved[name] = globalThis[name];
    globalThis[name] = fn;
  };
  let rafFn = null;
  stub("setTimeout", (fn, ms) => (timers.push({ fn, ms }), timers.length));
  stub("clearTimeout", (id) => cleared.push(id));
  stub("requestAnimationFrame", (fn) => ((rafFn = fn), 1));
  stub("cancelAnimationFrame", () => {});
  try {
    engine.frame = () => {
      engine._canvasGear = "idle";
    };
    engine.start();
    set(5, 3);
    engine.updateActivePoint();
    rafFn();
    assert.equal(engine._parked, false);
    assert.equal(timers.length, 1);
    assert.ok(timers[0].ms >= 16);
    assert.equal(engine._canvasIdleT, 1);
    engine.stop();
    assert.deepEqual(cleared, [1]);
    assert.equal(engine._canvasIdleT, 0);
  } finally {
    for (const [name, fn] of Object.entries(saved)) globalThis[name] = fn;
  }
});

test("without blinking or a caret the loop still parks", () => {
  const { engine } = makeEngine({ blinkingEnabled: false, torchEffect: false });
  const target = { addEventListener() {}, removeEventListener() {} };
  engine._doc = { ...target, defaultView: { ...target, visualViewport: target } };
  engine.canvasWrapper = { isConnected: true, style: {}, remove() {} };
  const timers = [];
  const saved = { setTimeout: globalThis.setTimeout, requestAnimationFrame: globalThis.requestAnimationFrame, cancelAnimationFrame: globalThis.cancelAnimationFrame };
  let rafFn = null;
  globalThis.setTimeout = (fn, ms) => (timers.push({ fn, ms }), timers.length);
  globalThis.requestAnimationFrame = (fn) => ((rafFn = fn), 1);
  globalThis.cancelAnimationFrame = () => {};
  try {
    engine.frame = () => {
      engine._canvasGear = "idle";
    };
    engine.start();
    rafFn();
    assert.equal(engine._parked, true);
    assert.equal(timers.length, 0);
    engine.stop();
  } finally {
    Object.assign(globalThis, saved);
  }
});
