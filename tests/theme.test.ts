import type { Alpine } from "alpinejs";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("bootstrap/js/dist/modal", () => ({ default: {} }));

import setup from "../src/alpine";

afterEach(() => vi.unstubAllGlobals());
it("follows OS changes until an explicit toggle and writes only that choice", () => {
  const media = Object.assign(new EventTarget(), { matches: true });
  const win = Object.assign(new EventTarget(), { matchMedia: () => media });
  let theme = "";
  const doc = Object.assign(new EventTarget(), {
    documentElement: {
      setAttribute: (_key: string, value: string) => {
        theme = value;
      },
      getAttribute: () => theme,
    },
  });
  const values = new Map<string, string>();
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", doc);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
  setup({ data() {} } as unknown as Alpine);
  expect(theme).toBe("dark");
  expect(values.size).toBe(0);
  media.dispatchEvent(Object.assign(new Event("change"), { matches: false }));
  expect(theme).toBe("light");
  expect(values.size).toBe(0);
  doc.dispatchEvent(new Event("toggle-theme"));
  expect(values.get("theme")).toBe("dark");
  media.dispatchEvent(Object.assign(new Event("change"), { matches: false }));
  expect(theme).toBe("dark");

  values.set("theme", "light");
  win.dispatchEvent(Object.assign(new Event("storage"), { key: "unrelated" }));
  expect(theme).toBe("dark");
  win.dispatchEvent(Object.assign(new Event("storage"), { key: "theme" }));
  expect(theme).toBe("light");
  media.dispatchEvent(Object.assign(new Event("change"), { matches: true }));
  expect(theme).toBe("light");

  values.delete("theme");
  media.matches = false;
  win.dispatchEvent(Object.assign(new Event("storage"), { key: "theme" }));
  expect(theme).toBe("light");
  media.dispatchEvent(Object.assign(new Event("change"), { matches: true }));
  expect(theme).toBe("dark");
});

it("keeps a user toggle for the session when storage is blocked", () => {
  const media = Object.assign(new EventTarget(), { matches: false });
  const win = Object.assign(new EventTarget(), { matchMedia: () => media });
  let theme = "";
  const doc = Object.assign(new EventTarget(), {
    documentElement: {
      setAttribute: (_key: string, value: string) => {
        theme = value;
      },
      getAttribute: () => theme,
    },
  });
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", doc);
  vi.stubGlobal("localStorage", {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  });
  expect(() => setup({ data() {} } as unknown as Alpine)).not.toThrow();
  expect(theme).toBe("light");
  doc.dispatchEvent(new Event("toggle-theme"));
  media.dispatchEvent(Object.assign(new Event("change"), { matches: false }));
  expect(theme).toBe("dark");
});
