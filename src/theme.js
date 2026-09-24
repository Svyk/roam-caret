// Roam's own theme signals. The OS color-scheme hint is deliberately not
// consulted: a dark-mode Mac can run light-theme Roam.
export function isRoamDark(doc) {
  if (doc?.documentElement?.classList?.contains("bp3-dark")) return true;
  const body = doc?.body?.classList;
  if (!body) return false;
  return body.contains("rm-dark-theme")
    || body.contains("bt-theme-dark")
    || (body.contains("roam-body") && body.contains("dark"));
}
