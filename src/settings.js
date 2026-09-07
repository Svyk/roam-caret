export const OPTIONS_KEY = "options";

export function loadOptions(extensionAPI) {
  const raw = extensionAPI.settings.get(OPTIONS_KEY);
  return raw == null ? null : raw;
}

export async function persistOptions(extensionAPI, value) {
  await extensionAPI.settings.set(OPTIONS_KEY, value);
}
