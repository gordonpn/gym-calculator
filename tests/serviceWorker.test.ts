import { readFileSync } from "node:fs";
import { setImmediate } from "node:timers/promises";
import { runInNewContext } from "node:vm";
import { expect, it } from "vitest";

it.each([
  "skipWaiting",
  "caching",
])("keeps installation alive when %s completes first", async (first) => {
  let finishSkipWaiting = () => {};
  const skipWaiting = new Promise<void>((resolve) => {
    finishSkipWaiting = resolve;
  });
  let finishCaching = () => {};
  const caching = new Promise<void>((resolve) => {
    finishCaching = resolve;
  });
  const lifetimes: Promise<unknown>[] = [];
  let install: (event: {
    waitUntil: (task: Promise<unknown>) => void;
  }) => void = () => {
    throw new Error("No install handler registered");
  };
  const precached: string[] = [];
  runInNewContext(
    readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"),
    {
      self: {
        addEventListener(name: string, listener: typeof install) {
          if (name === "install") install = listener;
        },
        skipWaiting: () => skipWaiting,
      },
      caches: {
        open: async () => ({
          add: async (url: string) => {
            precached.push(url);
            await caching;
          },
        }),
      },
    },
  );
  install({ waitUntil: (task) => lifetimes.push(task) });
  let completed = false;
  const installation = Promise.all(lifetimes).then(() => {
    completed = true;
  });
  await setImmediate();
  expect(precached).toEqual(["/", "/manifest.webmanifest", "/favicon.svg"]);
  expect(completed).toBe(false);
  const finishFirst =
    first === "skipWaiting" ? finishSkipWaiting : finishCaching;
  const finishLast =
    first === "skipWaiting" ? finishCaching : finishSkipWaiting;
  finishFirst();
  await setImmediate();
  expect(completed).toBe(false);
  finishLast();
  await installation;
  expect(completed).toBe(true);
});
