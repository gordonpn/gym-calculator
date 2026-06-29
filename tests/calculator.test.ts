import { describe, expect, it, vi } from "vitest";

// Bootstrap Modal imports document at module level — mock it out
vi.mock("bootstrap/js/dist/modal", () => ({
  default: {
    getOrCreateInstance() {
      return { show() {}, hide() {} };
    },
  },
}));

import calculator from "../src/components/calculator";
import type { Plate } from "../src/components/util";
import type { WarmupSet } from "../src/components/warmup-formulas";

const standardPlates: Plate[] = [
  { weight: 45, available: true, count: 2 },
  { weight: 25, available: true, count: 2 },
  { weight: 10, available: true, count: 2 },
  { weight: 5, available: true, count: 2 },
  { weight: 2.5, available: true, count: 2 },
];

function makeCalculator(overrides?: Record<string, unknown>) {
  const cmp = calculator();
  cmp.barWeight = 45;
  cmp.isWeightedBodyweight = false;
  cmp.equipmentType = "barbell";
  cmp.availablePlates = standardPlates;
  if (overrides) {
    Object.assign(cmp, overrides);
  }
  return cmp;
}

// ---------------------------------------------------------------------------
// hasJourneySelection
// ---------------------------------------------------------------------------
describe("hasJourneySelection", () => {
  it("returns false when both sessionTiming and equipmentType are empty", () => {
    const cmp = makeCalculator();
    cmp.sessionTiming = "";
    cmp.equipmentType = "";
    expect(cmp.hasJourneySelection()).toBe(false);
  });

  it("returns false when only sessionTiming is set", () => {
    const cmp = makeCalculator();
    cmp.sessionTiming = "pre";
    cmp.equipmentType = "";
    expect(cmp.hasJourneySelection()).toBe(false);
  });

  it("returns false when only equipmentType is set", () => {
    const cmp = makeCalculator();
    cmp.sessionTiming = "";
    cmp.equipmentType = "barbell";
    expect(cmp.hasJourneySelection()).toBe(false);
  });

  it("returns true when both are set", () => {
    const cmp = makeCalculator();
    cmp.sessionTiming = "pre";
    cmp.equipmentType = "barbell";
    expect(cmp.hasJourneySelection()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getAutoFormulaForJourney
// ---------------------------------------------------------------------------
describe("getAutoFormulaForJourney", () => {
  it("returns barbellPreClimbing for pre / barbell", () => {
    const cmp = makeCalculator();
    cmp.sessionTiming = "pre";
    cmp.equipmentType = "barbell";
    expect(cmp.getAutoFormulaForJourney()).toBe("barbellPreClimbing");
  });

  it("returns barbellPostClimbing for post / barbell", () => {
    const cmp = makeCalculator();
    cmp.sessionTiming = "post";
    cmp.equipmentType = "barbell";
    expect(cmp.getAutoFormulaForJourney()).toBe("barbellPostClimbing");
  });

  it("returns dumbbellPreClimbing for pre / dumbbell", () => {
    const cmp = makeCalculator();
    cmp.sessionTiming = "pre";
    cmp.equipmentType = "dumbbell";
    expect(cmp.getAutoFormulaForJourney()).toBe("dumbbellPreClimbing");
  });

  it("returns dumbbellPostClimbing for post / dumbbell", () => {
    const cmp = makeCalculator();
    cmp.sessionTiming = "post";
    cmp.equipmentType = "dumbbell";
    expect(cmp.getAutoFormulaForJourney()).toBe("dumbbellPostClimbing");
  });

  it("returns weightedBodyweightPreClimbing for pre / weightedBodyweight", () => {
    const cmp = makeCalculator();
    cmp.sessionTiming = "pre";
    cmp.equipmentType = "weightedBodyweight";
    expect(cmp.getAutoFormulaForJourney()).toBe(
      "weightedBodyweightPreClimbing",
    );
  });

  it("returns weightedBodyweightPostClimbing for post / weightedBodyweight", () => {
    const cmp = makeCalculator();
    cmp.sessionTiming = "post";
    cmp.equipmentType = "weightedBodyweight";
    expect(cmp.getAutoFormulaForJourney()).toBe(
      "weightedBodyweightPostClimbing",
    );
  });
});

// ---------------------------------------------------------------------------
// hasCalculableWeight
// ---------------------------------------------------------------------------
describe("hasCalculableWeight", () => {
  it("returns true when targetWeight is a valid number string", () => {
    const cmp = makeCalculator();
    cmp.targetWeight = "135";
    expect(cmp.hasCalculableWeight()).toBe(true);
  });

  it("returns true when targetWeight is a number", () => {
    const cmp = makeCalculator();
    cmp.targetWeight = 135;
    expect(cmp.hasCalculableWeight()).toBe(true);
  });

  it("returns true when targetWeight is zero", () => {
    const cmp = makeCalculator();
    cmp.targetWeight = "0";
    expect(cmp.hasCalculableWeight()).toBe(true);
  });

  it("returns false when targetWeight is empty string", () => {
    const cmp = makeCalculator();
    cmp.targetWeight = "";
    expect(cmp.hasCalculableWeight()).toBe(false);
  });

  it("returns false when targetWeight is non-numeric text", () => {
    const cmp = makeCalculator();
    cmp.targetWeight = "abc";
    expect(cmp.hasCalculableWeight()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getPlateColor
// ---------------------------------------------------------------------------
describe("getPlateColor", () => {
  it("returns correct color for each standard plate weight", () => {
    const cmp = makeCalculator();
    expect(cmp.getPlateColor(55)).toBe("danger");
    expect(cmp.getPlateColor(45)).toBe("primary");
    expect(cmp.getPlateColor(35)).toBe("warning");
    expect(cmp.getPlateColor(25)).toBe("success");
    expect(cmp.getPlateColor(15)).toBe("info");
    expect(cmp.getPlateColor(10)).toBe("burgundy");
    expect(cmp.getPlateColor(5)).toBe("secondary");
    expect(cmp.getPlateColor(2.5)).toBe("purple");
    expect(cmp.getPlateColor(1)).toBe("dark");
    expect(cmp.getPlateColor(0.75)).toBe("light");
    expect(cmp.getPlateColor(0.5)).toBe("teal");
    expect(cmp.getPlateColor(0.25)).toBe("orange");
  });

  it("returns secondary for unrecognized weights", () => {
    const cmp = makeCalculator();
    expect(cmp.getPlateColor(100)).toBe("secondary");
    expect(cmp.getPlateColor(0)).toBe("secondary");
  });

  it("accepts string input", () => {
    const cmp = makeCalculator();
    expect(cmp.getPlateColor("45")).toBe("primary");
    expect(cmp.getPlateColor("5")).toBe("secondary");
  });
});

// ---------------------------------------------------------------------------
// calculatePlatesNeeded
// ---------------------------------------------------------------------------
describe("calculatePlatesNeeded", () => {
  it("returns empty config for weight at or below bar weight", () => {
    const cmp = makeCalculator();
    const result = cmp.calculatePlatesNeeded(30);
    expect(result.plateConfig).toEqual([]);
    expect(result.remaining).toBe(0);
    expect(result.actualWeight).toBe(45);
  });

  it("distributes plates correctly for exact barbell weight", () => {
    const cmp = makeCalculator();
    const result = cmp.calculatePlatesNeeded(135);
    // (135 - 45) / 2 = 45 per side → one 45 lb plate each side
    expect(result.plateConfig).toContainEqual({ weight: 45, count: 1 });
    expect(result.remaining).toBe(0);
    expect(result.actualWeight).toBe(135);
  });

  it("distributes multiple plate types for heavier weights", () => {
    const cmp = makeCalculator();
    // (185 - 45) / 2 = 70 per side → one 45 + one 25
    const result = cmp.calculatePlatesNeeded(185);
    expect(result.plateConfig).toContainEqual({ weight: 45, count: 1 });
    expect(result.plateConfig).toContainEqual({ weight: 25, count: 1 });
    expect(result.remaining).toBe(0);
    expect(result.actualWeight).toBe(185);
  });

  it("returns remaining when weight is not exactly achievable", () => {
    const cmp = makeCalculator();
    cmp.availablePlates = [{ weight: 45, available: true, count: 2 }];
    // (140 - 45) / 2 = 47.5. 45 fits once, remaining 2.5 → unachievable
    const result = cmp.calculatePlatesNeeded(140);
    expect(result.remaining).toBe(2.5);
    expect(result.actualWeight).toBe(135);
  });

  it("respects minPlateWeight option", () => {
    const cmp = makeCalculator();
    const result = cmp.calculatePlatesNeeded(140, { minPlateWeight: 10 });
    // plates < 10 (5 and 2.5) are filtered out
    // (140-45)/2 = 47.5. 45 fits once, remaining 2.5. 25 and 10 don't fit.
    expect(result.remaining).toBe(2.5);
  });

  it("handles weighted bodyweight mode (no bar, full weight distribution)", () => {
    const cmp = makeCalculator({ isWeightedBodyweight: true });
    cmp.availablePlates = [
      { weight: 10, available: true, count: 2 },
      { weight: 5, available: true, count: 2 },
    ];
    // target 25, no bar. weightToAdd = 25
    // 10 fits twice, remaining 5. 5 fits once → exact
    const result = cmp.calculatePlatesNeeded(25);
    expect(result.plateConfig).toContainEqual({ weight: 10, count: 2 });
    expect(result.plateConfig).toContainEqual({ weight: 5, count: 1 });
    expect(result.remaining).toBe(0);
    expect(result.actualWeight).toBe(25);
  });

  it("respects plate count limits", () => {
    const cmp = makeCalculator();
    cmp.availablePlates = [{ weight: 45, available: true, count: 1 }];
    // (225 - 45) / 2 = 90. Only one 45 available → remaining 45
    const result = cmp.calculatePlatesNeeded(225);
    expect(result.plateConfig[0].count).toBe(1);
    expect(result.remaining).toBe(45);
    expect(result.actualWeight).toBe(135);
  });

  it("filters out unavailable and zero-count plates", () => {
    const cmp = makeCalculator();
    cmp.availablePlates = [
      { weight: 45, available: true, count: 2 },
      { weight: 25, available: false, count: 0 },
    ];
    const result = cmp.calculatePlatesNeeded(135);
    expect(result.plateConfig).toHaveLength(1);
    expect(result.plateConfig[0].weight).toBe(45);
  });

  it("returns skeleton for weighted bodyweight with non-positive target", () => {
    const cmp = makeCalculator({ isWeightedBodyweight: true });
    // targetWeight=0 means isForBodyweightExercise is false (targetWeight must be > 0)
    // Falls through to barbell path with effectiveBarWeight=45, and 0 <= 45 triggers early return
    const result = cmp.calculatePlatesNeeded(0);
    expect(result.plateConfig).toEqual([]);
    expect(result.remaining).toBe(0);
    expect(result.actualWeight).toBe(45);
  });
});

// ---------------------------------------------------------------------------
// applySetRounding
// ---------------------------------------------------------------------------
describe("applySetRounding", () => {
  it("rounds barbell sets to nearest 5 per side", () => {
    const cmp = makeCalculator();
    const set: WarmupSet = { percentage: 50, weight: 137, reps: 6 };
    cmp.applySetRounding(set);
    // perSide = (137-45)/2 = 46. roundedPerSide = round(46/5)*5 = 45
    // weight = 45 + 45*2 = 135
    expect(set.weight).toBe(135);
  });

  it("clamps barbell set weight to bar weight when below", () => {
    const cmp = makeCalculator();
    const set: WarmupSet = { percentage: 40, weight: 30, reps: 10 };
    cmp.applySetRounding(set);
    expect(set.weight).toBe(45);
  });

  it("rounds dumbbell sets to nearest 5", () => {
    const cmp = makeCalculator({ equipmentType: "dumbbell" });
    const set: WarmupSet = { percentage: 50, weight: 102, reps: 8 };
    cmp.applySetRounding(set);
    expect(set.weight).toBe(100);

    const set2: WarmupSet = { percentage: 50, weight: 103, reps: 8 };
    cmp.applySetRounding(set2);
    expect(set2.weight).toBe(105);
  });

  it("rounds weighted bodyweight addedWeight to nearest 5", () => {
    const cmp = makeCalculator({
      isWeightedBodyweight: true,
      equipmentType: "weightedBodyweight",
    });
    const set: WarmupSet = {
      percentage: 50,
      weight: 177,
      reps: 6,
      addedWeight: 27,
    };
    cmp.applySetRounding(set, 150);
    // addedWeight = roundToNearest5(27) = 25. weight = 150 + 25 = 175
    expect(set.addedWeight).toBe(25);
    expect(set.weight).toBe(175);
  });

  it("clamps bodyweight set weight to at least bodyweight", () => {
    const cmp = makeCalculator({
      isWeightedBodyweight: true,
      equipmentType: "weightedBodyweight",
    });
    const set: WarmupSet = { percentage: 40, weight: 140, reps: 8 };
    cmp.applySetRounding(set, 150);
    expect(set.weight).toBe(150);
  });

  it("updates idealWeight when present on the set", () => {
    const cmp = makeCalculator();
    const set: WarmupSet = {
      percentage: 50,
      weight: 137,
      reps: 6,
      idealWeight: 137,
    };
    cmp.applySetRounding(set);
    expect(set.idealWeight).toBe(set.weight);
  });
});

// ---------------------------------------------------------------------------
// isSelectedPlatePresetDefault
// ---------------------------------------------------------------------------
describe("isSelectedPlatePresetDefault", () => {
  it("returns true when selectedPlatePresetId matches defaultPlatePresetId", () => {
    const cmp = makeCalculator();
    cmp.selectedPlatePresetId = "abc-123";
    cmp.defaultPlatePresetId = "abc-123";
    expect(cmp.isSelectedPlatePresetDefault()).toBe(true);
  });

  it("returns false when they differ", () => {
    const cmp = makeCalculator();
    cmp.selectedPlatePresetId = "abc-123";
    cmp.defaultPlatePresetId = "def-456";
    expect(cmp.isSelectedPlatePresetDefault()).toBe(false);
  });

  it("returns false when selectedPlatePresetId is empty", () => {
    const cmp = makeCalculator();
    cmp.selectedPlatePresetId = "";
    cmp.defaultPlatePresetId = "abc-123";
    expect(cmp.isSelectedPlatePresetDefault()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createBackoffSet
// ---------------------------------------------------------------------------
describe("createBackoffSet", () => {
  it("creates a backoff set at the configured percentage of target weight", () => {
    const cmp = makeCalculator();
    cmp.backoffPercentage = 80;
    cmp.availablePlates = [
      { weight: 45, available: true, count: 2 },
      { weight: 25, available: true, count: 2 },
      { weight: 5, available: true, count: 2 },
      { weight: 2.5, available: true, count: 2 },
    ];
    const backoff = cmp.createBackoffSet(200, 0);
    expect(backoff.isBackoff).toBe(true);
    expect(backoff.percentage).toBe(80);
    expect(backoff.reps).toBe(8);
  });

  it("backoff weight is below target weight", () => {
    const cmp = makeCalculator();
    cmp.backoffPercentage = 80;
    const backoff = cmp.createBackoffSet(200, 0);
    expect(backoff.weight).toBeLessThan(200);
  });

  it("handles weighted bodyweight mode", () => {
    const cmp = makeCalculator({
      isWeightedBodyweight: true,
      equipmentType: "weightedBodyweight",
    });
    cmp.backoffPercentage = 80;
    cmp.availablePlates = [
      { weight: 10, available: true, count: 2 },
      { weight: 5, available: true, count: 2 },
    ];
    // targetWeight=200, bodyweight=150, addedWeight=50
    // backoffAdded = 50 * 0.8 = 40, backoffWeight = 150 + 40 = 190
    const backoff = cmp.createBackoffSet(200, 150);
    expect(backoff.isBackoff).toBe(true);
    expect(backoff.percentage).toBe(80);
    expect(backoff.addedWeight).toBeGreaterThan(0);
    expect(backoff.weight).toBeGreaterThan(150);
    expect(backoff.weight).toBeLessThan(200);
  });
});

// ---------------------------------------------------------------------------
// incrementWeight
// ---------------------------------------------------------------------------
describe("incrementWeight", () => {
  it("increments weight to a higher achievable value", () => {
    const cmp = makeCalculator();
    cmp.sessionTiming = "pre";
    cmp.equipmentType = "barbell";
    cmp.targetWeight = "135";
    const original = cmp.targetWeight;
    cmp.incrementWeight(1);
    expect(cmp.targetWeight).not.toBe(original);
    expect(Number.parseFloat(cmp.targetWeight)).toBeGreaterThan(135);
  });

  it("decrements weight to a lower achievable value", () => {
    const cmp = makeCalculator();
    cmp.sessionTiming = "pre";
    cmp.equipmentType = "barbell";
    cmp.targetWeight = "135";
    const original = cmp.targetWeight;
    cmp.incrementWeight(-1);
    expect(cmp.targetWeight).not.toBe(original);
    expect(Number.parseFloat(cmp.targetWeight)).toBeLessThan(135);
  });

  it("does nothing when hasJourneySelection is false", () => {
    const cmp = makeCalculator();
    cmp.sessionTiming = "";
    cmp.equipmentType = "";
    cmp.targetWeight = "135";
    cmp.incrementWeight(1);
    expect(cmp.targetWeight).toBe("135");
  });

  it("does nothing when targetWeight is NaN", () => {
    const cmp = makeCalculator();
    cmp.sessionTiming = "pre";
    cmp.equipmentType = "barbell";
    cmp.targetWeight = "";
    cmp.incrementWeight(1);
    expect(cmp.targetWeight).toBe("");
  });

  it("wraps around when incrementing beyond max achievable", () => {
    const cmp = makeCalculator();
    cmp.sessionTiming = "pre";
    cmp.equipmentType = "barbell";
    // Set a very high weight that exceeds all possible weights
    cmp.targetWeight = "999";
    cmp.incrementWeight(1);
    // Should wrap to the minimum (or at least be a valid number)
    expect(cmp.targetWeight).not.toBe("999");
    expect(Number.isNaN(Number.parseFloat(cmp.targetWeight))).toBe(false);
  });
});
