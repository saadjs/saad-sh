import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { themeInitScript, themeStorageKey, toggleTheme } from "#/lib/theme";

function setSystemTheme(dark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: dark, addEventListener: vi.fn() })),
  );
}

// jsdom's localStorage is unavailable under this Node version, so use a plain store.
function stubStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  });
}

function runInitScript() {
  new Function(themeInitScript)();
}

describe("theme", () => {
  beforeEach(() => {
    stubStorage();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens with the system theme when nothing is saved", () => {
    setSystemTheme(true);
    runInitScript();
    expect(document.documentElement.dataset.theme).toBe("dark");

    setSystemTheme(false);
    runInitScript();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("opens with the saved theme over the system theme", () => {
    setSystemTheme(true);
    localStorage.setItem(themeStorageKey, "light");
    runInitScript();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("ignores a saved value that is not a theme", () => {
    setSystemTheme(true);
    localStorage.setItem(themeStorageKey, "sepia");
    runInitScript();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("saves a choice that differs from the system theme", () => {
    setSystemTheme(false);
    runInitScript();

    expect(toggleTheme()).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(themeStorageKey)).toBe("dark");
  });

  it("drops the saved choice when toggling back to the system theme", () => {
    setSystemTheme(false);
    runInitScript();
    toggleTheme();

    expect(toggleTheme()).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(themeStorageKey)).toBeNull();
  });
});
