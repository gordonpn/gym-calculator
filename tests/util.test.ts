import { describe, expect, it } from "vitest";
import {
  debounce,
  roundToNearest5,
  roundToNearestAchievableWeight,
  roundToSmallestPlate,
} from "../src/components/util";
import type { Plate } from "../src/components/util";

describe("roundToNearest5", () => {
  it("rounds down when below the midpoint of 5", () => {
    expect(roundToNearest5(0)).toBe(0);
    expect(roundToNearest5(2)).toBe(0);
    expect(roundToNearest5(7)).toBe(5);
    expect(roundToNearest5(12)).toBe(10);
    expect(roundToNearest5(222)).toBe(220);
  });

  it("rounds up when at or above the midpoint of 5", () => {
    expect(roundToNearest5(3)).toBe(5);
    expect(roundToNearest5(8)).toBe(10);
    expect(roundToNearest5(13)).toBe(15);
    expect(roundToNearest5(225)).toBe(225);
    expect(roundToNearest5(228)).toBe(230);
  });

  it("handles fractional values", () => {
    expect(roundToNearest5(2.5)).toBe(5);
    expect(roundToNearest5(12.5)).toBe(15);
    expect(roundToNearest5(7.4)).toBe(5);
    expect(roundToNearest5(7.6)).toBe(10);
  });

  it("handles negative values", () => {
    expect(roundToNearest5(-3)).toBe(-5);
    expect(roundToNearest5(-7)).toBe(-5);
    expect(roundToNearest5(-12)).toBe(-10);
  });
});

describe("roundToSmallestPlate", () => {
  it("rounds to the nearest multiple of the smallest available plate", () => {
    const plates: Plate[] = [
      { weight: 45, available: true, count: 2 },
      { weight: 5, available: true, count: 2 },
    ];
    expect(roundToSmallestPlate(10, plates)).toBe(10);
    expect(roundToSmallestPlate(12, plates)).toBe(10);
    expect(roundToSmallestPlate(13, plates)).toBe(15);
  });

  it("uses 2.5 as the step when smallest available plate is 2.5", () => {
    const plates: Plate[] = [
      { weight: 45, available: true, count: 2 },
      { weight: 2.5, available: true, count: 2 },
    ];
    expect(roundToSmallestPlate(10, plates)).toBe(10);
    expect(roundToSmallestPlate(11.24, plates)).toBe(10);
    expect(roundToSmallestPlate(11.25, plates)).toBe(12.5);
  });

  it("falls back to roundToNearest5 when plates have zero count", () => {
    const noPlates: Plate[] = [{ weight: 45, available: true, count: 0 }];
    expect(roundToSmallestPlate(12, noPlates)).toBe(10);
    expect(roundToSmallestPlate(13, noPlates)).toBe(15);
  });

  it("handles empty plates array", () => {
    expect(roundToSmallestPlate(12, [])).toBe(10);
  });

  it("filters out unavailable plates", () => {
    const plates: Plate[] = [
      { weight: 45, available: false, count: 2 },
      { weight: 5, available: true, count: 2 },
    ];
    expect(roundToSmallestPlate(10, plates)).toBe(10);
  });
});

describe("roundToNearestAchievableWeight", () => {
  const standardPlates: Plate[] = [
    { weight: 45, available: true, count: 2 },
    { weight: 25, available: true, count: 2 },
    { weight: 10, available: true, count: 2 },
    { weight: 5, available: true, count: 2 },
    { weight: 2.5, available: true, count: 2 },
  ];

  it("returns exact weight when achievable with available plates", () => {
    // 135 = bar(45) + 45*2 per side (one 45lb plate each side)
    expect(roundToNearestAchievableWeight(135, 45, standardPlates)).toBe(135);
    // 185 = bar(45) + (45+25)*2 per side
    expect(roundToNearestAchievableWeight(185, 45, standardPlates)).toBe(185);
  });

  it("rounds down when exact weight is not achievable", () => {
    const plates: Plate[] = [{ weight: 45, available: true, count: 2 }];
    // target 140, bar 45. (140-45)/2 = 47.5 per side. 45 fits once, remaining 2.5.
    // weightDown = 45 + 45*2 = 135
    // weightUp = 45 + (45+45)*2 = 225
    // |140-135|=5 < |140-225|=85 -> 135
    expect(roundToNearestAchievableWeight(140, 45, plates)).toBe(135);
  });

  it("rounds up when closer than rounding down", () => {
    const plates: Plate[] = [{ weight: 45, available: true, count: 2 }];
    // target 200, bar 45. (200-45)/2 = 77.5. 45 fits once, remaining 32.5.
    // weightDown = 45 + 45*2 = 135
    // weightUp = 45 + (45+45)*2 = 225
    // |200-135|=65 > |200-225|=25 -> 225
    expect(roundToNearestAchievableWeight(200, 45, plates)).toBe(225);
  });

  it("returns bar weight when target is below bar weight", () => {
    expect(roundToNearestAchievableWeight(30, 45, standardPlates)).toBe(45);
  });

  it("returns NaN inputs unchanged", () => {
    expect(roundToNearestAchievableWeight(Number.NaN, 45, standardPlates)).toBe(
      Number.NaN,
    );
  });

  it("returns original weight when no plates available", () => {
    expect(roundToNearestAchievableWeight(135, 45, [])).toBe(135);
  });

  it("handles weighted bodyweight mode — exact match", () => {
    const plates: Plate[] = [{ weight: 10, available: true, count: 2 }];
    // isWeightedBodyweight=true, effectiveBarWeight=0
    // target 20, weightToDistribute=20. 10 fits twice (max 2) -> remaining 0 -> exact
    expect(roundToNearestAchievableWeight(20, 45, plates, true)).toBe(20);
  });

  it("handles weighted bodyweight mode — rounds down", () => {
    const plates: Plate[] = [{ weight: 10, available: true, count: 2 }];
    // target 25, weightToDistribute=25. 10 fits twice (max 2), remaining 5.
    // weightDown = 20, weightUp = 20+10 = 30
    // |25-20|=5 = |25-30|=5 -> weightDown (<= tiebreaker)
    expect(roundToNearestAchievableWeight(25, 45, plates, true)).toBe(20);
  });

  it("respects plate count limits", () => {
    const plates: Plate[] = [{ weight: 45, available: true, count: 1 }];
    // target 180, bar 45. (180-45)/2 = 67.5. 45 fits once (max 1), remaining 22.5.
    // weightDown = 45 + 45*2 = 135
    // weightUp = 45 + (45+45)*2 = 225
    expect(roundToNearestAchievableWeight(180, 45, plates)).toBe(135);
  });

  it("filters out unavailable plates in distribution", () => {
    const plates: Plate[] = [
      { weight: 45, available: true, count: 2 },
      { weight: 25, available: false, count: 2 },
    ];
    // Same as having only 45s, just like the round-down case
    expect(roundToNearestAchievableWeight(140, 45, plates)).toBe(135);
  });
});

describe("debounce", () => {
  it("returns a function that delays execution", async () => {
    let called = false;
    const fn = debounce(() => {
      called = true;
    }, 50);

    fn();

    // Not called immediately
    expect(called).toBe(false);

    // Called after the wait period
    await new Promise((resolve) => setTimeout(resolve, 70));
    expect(called).toBe(true);
  });

  it("only the last invocation takes effect within the wait window", async () => {
    let count = 0;
    const fn = debounce(() => {
      count++;
    }, 50);

    fn();
    fn();
    fn();

    // Wait for the debounce
    await new Promise((resolve) => setTimeout(resolve, 70));

    // Only the last invocation should trigger execution
    expect(count).toBe(1);
  });

  it("multiple calls spaced apart each trigger execution", async () => {
    let count = 0;
    const fn = debounce(() => {
      count++;
    }, 20);

    fn();
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(count).toBe(1);

    fn();
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(count).toBe(2);

    fn();
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(count).toBe(3);
  });
});
