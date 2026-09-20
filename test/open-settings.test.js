import assert from "node:assert/strict";
import test from "node:test";

import {
  findRoamCaretSettingsTab,
  openRoamCaretSettings,
  selectRoamCaretSettingsTab,
} from "../src/open-settings.js";

function makeTab(label) {
  return {
    textContent: label,
    click() {
      this.clicked = true;
    },
    clicked: false,
  };
}

function makeDocument({ depot = true, tabs = [] } = {}) {
  const tabNodes = tabs.map(makeTab);
  const depotButton = depot
    ? { click() { this.clicked = true; }, clicked: false }
    : null;
  return {
    depotButton,
    tabNodes,
    querySelector(sel) {
      if (sel === ".rm-left-sidebar__roam-depot") return depotButton;
      return null;
    },
    querySelectorAll(sel) {
      if (sel === '[role="tab"]') return tabNodes;
      return [];
    },
  };
}

test("findRoamCaretSettingsTab prefers dev label, then release, then prefix", () => {
  const doc = makeDocument({
    tabs: ["Other", "Roam Caret", "Roam Caret (dev)", "Roam Caret Beta"],
  });
  assert.equal(findRoamCaretSettingsTab(doc)?.textContent, "Roam Caret (dev)");

  const releaseOnly = makeDocument({ tabs: ["Roam Caret", "Roam Caret Beta"] });
  assert.equal(findRoamCaretSettingsTab(releaseOnly)?.textContent, "Roam Caret");

  const prefixOnly = makeDocument({ tabs: ["Roam Caret Beta"] });
  assert.equal(findRoamCaretSettingsTab(prefixOnly)?.textContent, "Roam Caret Beta");
});

test("selectRoamCaretSettingsTab clicks the resolved tab", () => {
  const doc = makeDocument({ tabs: ["Roam Caret"] });
  assert.equal(selectRoamCaretSettingsTab(doc), true);
  assert.equal(doc.tabNodes[0].clicked, true);
});

test("openRoamCaretSettings opens depot then selects Roam Caret tab", async () => {
  const tab = makeTab("Roam Caret");
  const doc = {
    depotButton: {
      click() {
        doc.tabNodes.push(tab);
      },
      clicked: false,
    },
    tabNodes: [],
    querySelector(sel) {
      if (sel === ".rm-left-sidebar__roam-depot") return doc.depotButton;
      return null;
    },
    querySelectorAll(sel) {
      if (sel === '[role="tab"]') return doc.tabNodes;
      return [];
    },
  };
  const ok = await openRoamCaretSettings({
    documentLike: doc,
    wait: async () => {},
    attempts: 3,
  });
  assert.equal(ok, true);
  assert.equal(tab.clicked, true);
});

test("openRoamCaretSettings returns false when depot button is missing", async () => {
  const doc = makeDocument({ depot: false, tabs: [] });
  const ok = await openRoamCaretSettings({
    documentLike: doc,
    wait: async () => {},
    attempts: 1,
  });
  assert.equal(ok, false);
});
