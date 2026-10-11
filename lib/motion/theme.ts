export type ThemeSource = "scroll" | "menu";

const darkRequests = new Set<ThemeSource>();

/** Ref-counted page theme. html[data-theme="dark"] is present while ANY source requests dark. */
export function setThemeRequest(source: ThemeSource, dark: boolean): void {
  if (dark) darkRequests.add(source);
  else darkRequests.delete(source);

  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (darkRequests.size > 0) {
    if (root.dataset.theme !== "dark") root.dataset.theme = "dark";
  } else if (root.dataset.theme === "dark") {
    delete root.dataset.theme;
  }
}
