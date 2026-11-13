import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("bootstrap/js/dist/modal", () => ({ default: {} }));

import calculator from "../src/components/calculator";
import repMaxCalculator from "../src/components/repMaxCalculator";
import strengthLevelCalculator from "../src/components/strengthLevelCalculator";

const init = <T extends { init(): void }>(component: T): T => {
  Object.assign(component, { $watch() {}, $el: new EventTarget() });
  component.init();
  return component;
};
beforeEach(() => {
  vi.stubGlobal("document", { getElementById: () => null });
  vi.stubGlobal("window", new EventTarget());
});
afterEach(() => vi.unstubAllGlobals());
describe("browser storage resilience", () => {
  it("keeps calculators usable when storage is blocked", () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("quota");
      },
    });
    expect(() => init(repMaxCalculator())).not.toThrow();
    expect(() => init(strengthLevelCalculator())).not.toThrow();
    expect(() => init(calculator())).not.toThrow();
    expect(() => strengthLevelCalculator().saveSettings()).not.toThrow();
    expect(() => calculator().saveSettings()).not.toThrow();
  });
  it.each([
    "null",
    "[]",
    '"text"',
    '{"calculationMethod":"bad","selectedLift":"bad","bodyweight":{},"sessionTiming":"bad","equipmentType":"bad","numWarmupSets":-1,"enableBackoff":"yes"}',
  ])("rejects invalid settings %s", (saved) => {
    vi.stubGlobal("localStorage", { getItem: () => saved, setItem() {} });
    expect(init(repMaxCalculator()).calculationMethod).toBe("average");
    const strength = init(strengthLevelCalculator());
    expect(strength.calculationMethod).toBe("average");
    expect(strength.selectedLift).toBe("squat");
    const warmup = init(calculator());
    expect(warmup.sessionTiming).toBe("pre");
    expect(warmup.equipmentType).toBe("barbell");
    expect(warmup.enableBackoff).toBe(false);
  });
});

it("restores valid saved calculator preferences", () => {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) =>
      key === "repMaxCalculationMethod"
        ? "weighted"
        : JSON.stringify({
            bodyweight: "180",
            selectedLift: "squat",
            calculationMethod: "highest",
            sessionTiming: "post",
            equipmentType: "dumbbell",
            enableBackoff: true,
            backoffPercentage: 75,
            barWeight: 35,
          }),
    setItem() {},
  });
  expect(init(repMaxCalculator()).calculationMethod).toBe("weighted");
  const strength = init(strengthLevelCalculator());
  expect(strength.bodyweight).toBe("180");
  expect(strength.calculationMethod).toBe("highest");
  const warmup = init(calculator());
  expect(warmup.sessionTiming).toBe("post");
  expect(warmup.equipmentType).toBe("dumbbell");
  expect(warmup.barWeight).toBe(35);
  expect(warmup.enableBackoff).toBe(true);
  expect(warmup.backoffPercentage).toBe(75);
});
