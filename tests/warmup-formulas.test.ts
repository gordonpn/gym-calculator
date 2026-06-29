import { describe, expect, it } from "vitest";

import type { Plate } from "../src/components/util";
import {
  barbellPostClimbing,
  barbellPreClimbing,
  dumbbellPostClimbing,
  dumbbellPreClimbing,
  fixedIncrements,
  generatePossibleWeights,
  getDefaultSets,
  getFormula,
  isConfigurableFormula,
  percentageBased,
  standardPyramid,
  weightedBodyweight,
  weightedBodyweightPostClimbing,
  weightedBodyweightPreClimbing,
} from "../src/components/warmup-formulas";

function countWeightTransitions(weights: number[]): number {
  if (weights.length < 2) {
    return 0;
  }

  let transitions = 0;
  for (let i = 1; i < weights.length; i++) {
    if (weights[i] !== weights[i - 1]) {
      transitions += 1;
    }
  }

  return transitions;
}

// ---------------------------------------------------------------------------
// generatePossibleWeights
// ---------------------------------------------------------------------------
describe("generatePossibleWeights", () => {
  it("generates achievable weights starting from bar weight", () => {
    const plates: Plate[] = [
      { weight: 45, available: true, count: 2 },
      { weight: 5, available: true, count: 2 },
    ];
    const weights = generatePossibleWeights(45, 135, plates);
    expect(weights).toContain(45);
    // 135 = bar(45) + 45*2 (one 45 per side), smallest plate is 5
    expect(weights).toContain(135);
  });

  it("returns only bar weight when no plates available", () => {
    expect(generatePossibleWeights(45, 135, [])).toEqual([45]);
  });

  it("handles weighted bodyweight mode (bar weight = 0)", () => {
    const plates: Plate[] = [
      { weight: 10, available: true, count: 2 },
      { weight: 5, available: true, count: 2 },
    ];
    const weights = generatePossibleWeights(0, 20, plates, true);
    expect(weights[0]).toBe(0);
    expect(weights).toContain(10);
    expect(weights).toContain(20);
  });

  it("returns sorted unique values", () => {
    const plates: Plate[] = [{ weight: 5, available: true, count: 4 }];
    const weights = generatePossibleWeights(45, 75, plates);
    for (let i = 1; i < weights.length; i++) {
      expect(weights[i]).toBeGreaterThan(weights[i - 1]);
    }
  });

  it("respects plate count limits", () => {
    const plates: Plate[] = [{ weight: 10, available: true, count: 1 }];
    const weights = generatePossibleWeights(45, 85, plates);
    // With one 10lb plate per side, max added = 20 (10*2).
    // Possible: 45, 45+20=65. 85 is unreachable, but weights go up to
    // maxPerSide = (85-45)/2 = 20. At increment=10 (smallestPlate):
    // i=10: 10 per side -> 1*10 fits -> weight=45+20=65
    // i=20: 20 per side -> 1*10 fits -> weight=45+20=65
    // So only 45 and 65 are in the list.
    expect(weights).toContain(45);
    expect(weights).toContain(65);
    expect(weights.length).toBeLessThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// formula: barbellPreClimbing
// ---------------------------------------------------------------------------
describe("barbellPreClimbing", () => {
  it("returns 4 sets: bar x15, 50%x5, 75%x3, 100%x0", () => {
    const sets = barbellPreClimbing(200, 4, 45);
    expect(sets).toHaveLength(4);
    expect(sets[0].weight).toBe(45);
    expect(sets[0].reps).toBe(15);
    expect(sets[1].weight).toBe(100);
    expect(sets[1].percentage).toBe(50);
    expect(sets[1].reps).toBe(5);
    expect(sets[2].weight).toBe(150);
    expect(sets[2].percentage).toBe(75);
    expect(sets[2].reps).toBe(3);
    expect(sets[3].weight).toBe(200);
    expect(sets[3].percentage).toBe(100);
    expect(sets[3].reps).toBe(0);
  });

  it("handles non-standard bar weight", () => {
    const sets = barbellPreClimbing(200, 4, 55);
    expect(sets[0].weight).toBe(55);
  });

  it("rounds target weight", () => {
    const sets = barbellPreClimbing(199.6);
    expect(sets[3].weight).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// formula: barbellPostClimbing
// ---------------------------------------------------------------------------
describe("barbellPostClimbing", () => {
  it("returns 3 sets: bar x10, 60%x4, 100%x0", () => {
    const sets = barbellPostClimbing(200, 3, 45);
    expect(sets).toHaveLength(3);
    expect(sets[0].weight).toBe(45);
    expect(sets[0].reps).toBe(10);
    expect(sets[1].weight).toBe(120);
    expect(sets[1].percentage).toBe(60);
    expect(sets[1].reps).toBe(4);
    expect(sets[2].weight).toBe(200);
    expect(sets[2].percentage).toBe(100);
    expect(sets[2].reps).toBe(0);
  });

  it("handles non-standard bar weight", () => {
    const sets = barbellPostClimbing(200, 3, 55);
    expect(sets[0].weight).toBe(55);
  });
});

// ---------------------------------------------------------------------------
// formula: dumbbellPreClimbing
// ---------------------------------------------------------------------------
describe("dumbbellPreClimbing", () => {
  it("returns 3 sets: 50%x12, 75%x6, 100%x0", () => {
    const sets = dumbbellPreClimbing(200);
    expect(sets).toHaveLength(3);
    expect(sets[0].percentage).toBe(50);
    expect(sets[0].weight).toBe(100);
    expect(sets[0].reps).toBe(12);
    expect(sets[1].percentage).toBe(75);
    expect(sets[1].weight).toBe(150);
    expect(sets[1].reps).toBe(6);
    expect(sets[2].percentage).toBe(100);
    expect(sets[2].weight).toBe(200);
    expect(sets[2].reps).toBe(0);
  });

  it("rounds intermediate weights", () => {
    expect(dumbbellPreClimbing(205)[1].weight).toBe(154); // round(205*0.75) = 154
  });
});

// ---------------------------------------------------------------------------
// formula: dumbbellPostClimbing
// ---------------------------------------------------------------------------
describe("dumbbellPostClimbing", () => {
  it("returns 2 sets: 50%x8, 100%x0", () => {
    const sets = dumbbellPostClimbing(200);
    expect(sets).toHaveLength(2);
    expect(sets[0].percentage).toBe(50);
    expect(sets[0].weight).toBe(100);
    expect(sets[0].reps).toBe(8);
    expect(sets[1].percentage).toBe(100);
    expect(sets[1].weight).toBe(200);
    expect(sets[1].reps).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// formula: weightedBodyweightPreClimbing
// ---------------------------------------------------------------------------
describe("weightedBodyweightPreClimbing", () => {
  it("returns 3 sets: bodyweight x8, ~50% added x3, working set", () => {
    const sets = weightedBodyweightPreClimbing(200, 3, 0, [], false, true, 150);
    expect(sets).toHaveLength(3);
    expect(sets[0].weight).toBe(150);
    expect(sets[0].reps).toBe(8);
    expect(sets[0].addedWeight).toBe(0);
    expect(sets[1].weight).toBe(175); // 150 + 50*0.5 = 175
    expect(sets[1].reps).toBe(3);
    expect(sets[1].addedWeight).toBe(25);
    expect(sets[2].weight).toBe(200);
    expect(sets[2].reps).toBe(0);
    expect(sets[2].addedWeight).toBe(50);
  });

  it("handles target equal to bodyweight (no added weight)", () => {
    const sets = weightedBodyweightPreClimbing(150, 3, 0, [], false, true, 150);
    expect(sets).toHaveLength(3);
    expect(sets[2].weight).toBe(150);
    expect(sets[2].addedWeight).toBe(0);
    // halfAddedWeight = round(150 + 0 * 0.5) = 150
    expect(sets[1].weight).toBe(150);
  });
});

// ---------------------------------------------------------------------------
// formula: weightedBodyweightPostClimbing
// ---------------------------------------------------------------------------
describe("weightedBodyweightPostClimbing", () => {
  it("returns 2 sets: bodyweight x5, working set", () => {
    const sets = weightedBodyweightPostClimbing(
      200,
      3,
      0,
      [],
      false,
      true,
      150,
    );
    expect(sets).toHaveLength(2);
    expect(sets[0].weight).toBe(150);
    expect(sets[0].reps).toBe(5);
    expect(sets[0].addedWeight).toBe(0);
    expect(sets[1].weight).toBe(200);
    expect(sets[1].reps).toBe(0);
    expect(sets[1].addedWeight).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// formula: standardPyramid
// ---------------------------------------------------------------------------
describe("standardPyramid", () => {
  it("generates 4 sets at 50%, 60%, 70%, 80% of target", () => {
    const sets = standardPyramid(200, 5, 45, [], false, false, 0);
    expect(sets).toHaveLength(4);
    expect(sets[0].percentage).toBe(50);
    expect(sets[0].weight).toBe(100);
    expect(sets[0].reps).toBe(10);
    expect(sets[1].percentage).toBe(60);
    expect(sets[1].weight).toBe(120);
    expect(sets[1].reps).toBe(8);
    expect(sets[2].percentage).toBe(70);
    expect(sets[2].weight).toBe(140);
    expect(sets[2].reps).toBe(6);
    expect(sets[3].percentage).toBe(80);
    expect(sets[3].weight).toBe(160);
    expect(sets[3].reps).toBe(5);
  });

  it("handles weighted bodyweight where addedWeight is positive", () => {
    const sets = standardPyramid(200, 5, 45, [], false, true, 150);
    // At 80%: weight = 160, addedWeight = 160 - 150 = 10 > 0
    const last = sets[3];
    expect(last.addedWeight).toBe(10);
  });

  it("handles weighted bodyweight where addedWeight is not positive", () => {
    const sets = standardPyramid(200, 5, 45, [], false, true, 150);
    // At 50%: weight = 100, addedWeight = 100 - 150 = -50 <= 0, so undefined
    expect(sets[0].addedWeight).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// formula: fixedIncrements
// ---------------------------------------------------------------------------
describe("fixedIncrements", () => {
  it("generates evenly spaced warmup sets", () => {
    const sets = fixedIncrements(200, 5, 45, [], false, false, 0);
    // 5 sets, topRatio = max(5/6, 0.9) clamped to 0.95 = 0.9
    // topWarmupWeight = 200*0.9 = 180, increment = (180-45)/5 = 27
    expect(sets).toHaveLength(5);
    // First set: 45 + 27 = 72, percentage = round(72/200*100) = 36
    expect(sets[0].weight).toBe(72);
    expect(sets[0].reps).toBe(10); // percentage 36 <= 50
    // Last set: 45 + 27*5 = 180, percentage = round(180/200*100) = 90
    expect(sets[4].weight).toBe(180);
    expect(sets[4].percentage).toBe(90);
    expect(sets[4].reps).toBe(2); // percentage 90 > 85
  });

  it("handles weighted bodyweight mode", () => {
    const sets = fixedIncrements(200, 3, 0, [], false, true, 150);
    expect(sets).toHaveLength(3);
    // Each set should have addedWeight computed
    for (const set of sets) {
      expect(typeof set.addedWeight).toBe("number");
    }
  });

  it("caps top ratio at 0.95", () => {
    // numSets=20, originalTopRatio = 20/21 ≈ 0.952
    // topRatio = min(max(0.952, 0.9), 0.95) = min(0.952, 0.95) = 0.95
    const sets = fixedIncrements(200, 20, 45, [], false, false, 0);
    expect(sets).toHaveLength(20);
  });

  it("prevents adding above effective target weight", () => {
    // Very small target with default bar
    const sets = fixedIncrements(50, 5, 45, [], false, false, 0);
    expect(sets).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// formula: weightedBodyweight
// ---------------------------------------------------------------------------
describe("weightedBodyweight", () => {
  it("delegates to percentageBased with isWeightedBodyweight=true", () => {
    const sets = weightedBodyweight(200, 3, 0, [], false, true, 150);
    expect(sets).toHaveLength(3);
    // All sets should have addedWeight >= 0
    for (const set of sets) {
      expect(set.addedWeight).toBeGreaterThanOrEqual(0);
    }
  });

  it("uses 3 sets by default", () => {
    const sets = weightedBodyweight(200);
    expect(sets).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// formula: percentageBased (non-minimized)
// ---------------------------------------------------------------------------
describe("percentageBased without minimizePlateChanges", () => {
  it("generates warmup sets at evenly spaced percentages from 40% to 90%", () => {
    const sets = percentageBased(200, 6, 45, [], false, false, 0);
    expect(sets).toHaveLength(6);
    expect(sets[0].percentage).toBe(40);
    expect(sets[0].weight).toBe(80);
    expect(sets[0].reps).toBe(10);
    expect(sets[5].percentage).toBe(90);
    expect(sets[5].weight).toBe(180);
    expect(sets[5].reps).toBe(2);
  });

  it("sorts sets by weight ascending", () => {
    const sets = percentageBased(200, 6, 45, [], false, false, 0);
    for (let i = 1; i < sets.length; i++) {
      expect(sets[i].weight).toBeGreaterThanOrEqual(sets[i - 1].weight);
    }
  });

  it("assigns reps based on percentage ranges", () => {
    // 6 sets at 40,50,60,70,80,90 -> reps: 10,10,8,6,5,2
    const sets = percentageBased(200, 6, 45, [], false, false, 0);
    expect(sets[0].reps).toBe(10); // 40%
    expect(sets[1].reps).toBe(10); // 50%
    expect(sets[2].reps).toBe(8); // 60%
    expect(sets[3].reps).toBe(6); // 70%
    expect(sets[4].reps).toBe(5); // 80%
    expect(sets[5].reps).toBe(2); // 90%
  });

  it("handles weighted bodyweight mode", () => {
    // bw=150, targetWeight=200 -> effectiveTargetWeight=50
    const sets = percentageBased(200, 3, 45, [], false, true, 150);
    expect(sets).toHaveLength(3);
    // Sets should have addedWeight = max(0, weight - bodyweight)
    for (const set of sets) {
      expect(set.addedWeight).toBeGreaterThanOrEqual(0);
    }
    // Sorted by weight ascending
    for (let i = 1; i < sets.length; i++) {
      expect(sets[i].weight).toBeGreaterThanOrEqual(sets[i - 1].weight);
    }
  });
});

// ---------------------------------------------------------------------------
// getFormula
// ---------------------------------------------------------------------------
describe("getFormula", () => {
  it("returns the correct formula function for each known ID", () => {
    expect(getFormula("barbellPreClimbing")).toBe(barbellPreClimbing);
    expect(getFormula("barbellPostClimbing")).toBe(barbellPostClimbing);
    expect(getFormula("dumbbellPreClimbing")).toBe(dumbbellPreClimbing);
    expect(getFormula("dumbbellPostClimbing")).toBe(dumbbellPostClimbing);
    expect(getFormula("weightedBodyweightPreClimbing")).toBe(
      weightedBodyweightPreClimbing,
    );
    expect(getFormula("weightedBodyweightPostClimbing")).toBe(
      weightedBodyweightPostClimbing,
    );
    expect(getFormula("weightedBodyweight")).toBe(weightedBodyweight);
    expect(getFormula("standardPyramid")).toBe(standardPyramid);
    expect(getFormula("fixedIncrements")).toBe(fixedIncrements);
    expect(getFormula("percentageBased")).toBe(percentageBased);
  });

  it("returns percentageBased for unknown IDs", () => {
    const formula = getFormula("nonexistent");
    expect(formula).toBe(percentageBased);
    // Verify it actually generates percentage-based sets
    const sets = formula(200, 3);
    expect(sets).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// isConfigurableFormula
// ---------------------------------------------------------------------------
describe("isConfigurableFormula", () => {
  it("returns true for configurable formulas", () => {
    expect(isConfigurableFormula("percentageBased")).toBe(true);
    expect(isConfigurableFormula("fixedIncrements")).toBe(true);
  });

  it("returns false for non-configurable formulas", () => {
    expect(isConfigurableFormula("standardPyramid")).toBe(false);
    expect(isConfigurableFormula("weightedBodyweight")).toBe(false);
    expect(isConfigurableFormula("barbellPreClimbing")).toBe(false);
    expect(isConfigurableFormula("dumbbellPostClimbing")).toBe(false);
    expect(isConfigurableFormula("nonexistent")).toBe(false);
    expect(isConfigurableFormula("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getDefaultSets
// ---------------------------------------------------------------------------
describe("getDefaultSets", () => {
  it("returns correct default set counts for each formula", () => {
    expect(getDefaultSets("weightedBodyweightPreClimbing")).toBe(3);
    expect(getDefaultSets("weightedBodyweightPostClimbing")).toBe(2);
    expect(getDefaultSets("barbellPreClimbing")).toBe(4);
    expect(getDefaultSets("barbellPostClimbing")).toBe(3);
    expect(getDefaultSets("dumbbellPreClimbing")).toBe(3);
    expect(getDefaultSets("dumbbellPostClimbing")).toBe(2);
    expect(getDefaultSets("fixedIncrements")).toBe(5);
    expect(getDefaultSets("standardPyramid")).toBe(4);
    expect(getDefaultSets("weightedBodyweight")).toBe(3);
    expect(getDefaultSets("percentageBased")).toBe(6);
  });

  it("returns 6 for unknown formulas", () => {
    expect(getDefaultSets("nonexistent")).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// percentageBased minimizePlateChanges behavior (existing)
// ---------------------------------------------------------------------------
describe("percentageBased minimizePlateChanges behavior", () => {
  it("maps warmup weights to achievable barbell loads when minimization is enabled", () => {
    const barWeight = 45;
    const targetWeight = 225;
    const availablePlates: Plate[] = [
      { weight: 45, available: true, count: 2 },
      { weight: 25, available: true, count: 2 },
      { weight: 10, available: true, count: 2 },
      { weight: 5, available: true, count: 2 },
    ];

    const possibleWeights = generatePossibleWeights(
      barWeight,
      targetWeight,
      availablePlates,
      false,
    );

    const minimizedSets = percentageBased(
      targetWeight,
      6,
      barWeight,
      availablePlates,
      true,
      false,
      0,
    );

    for (const set of minimizedSets) {
      expect(possibleWeights).toContain(set.weight);
    }
  });

  it("does not keep unreachable set weights in the optimized sequence", () => {
    const barWeight = 45;
    const targetWeight = 160;
    const availablePlates: Plate[] = [
      { weight: 45, available: true, count: 1 },
    ];

    const possibleWeights = generatePossibleWeights(
      barWeight,
      targetWeight,
      availablePlates,
      false,
    );

    const minimizedSets = percentageBased(
      targetWeight,
      2,
      barWeight,
      availablePlates,
      true,
      false,
      0,
    );

    for (const set of minimizedSets) {
      expect(possibleWeights).toContain(set.weight);
    }
  });

  it("reduces set-to-set weight changes under constrained plate availability", () => {
    const barWeight = 45;
    const targetWeight = 215;
    const availablePlates: Plate[] = [
      { weight: 45, available: true, count: 1 },
      { weight: 25, available: true, count: 1 },
    ];

    const minimizedSets = percentageBased(
      targetWeight,
      6,
      barWeight,
      availablePlates,
      true,
      false,
      0,
    );
    const nonMinimizedSets = percentageBased(
      targetWeight,
      6,
      barWeight,
      availablePlates,
      false,
      false,
      0,
    );

    const minimizedWeights = minimizedSets.map((set) => set.weight);
    const nonMinimizedWeights = nonMinimizedSets.map((set) => set.weight);

    const minimizedTransitions = countWeightTransitions(minimizedWeights);
    const nonMinimizedTransitions = countWeightTransitions(nonMinimizedWeights);

    expect(minimizedTransitions).toBeLessThan(nonMinimizedTransitions);
  });

  it("keeps warmups at bar weight when no plates are available", () => {
    const barWeight = 45;
    const targetWeight = 225;
    const unavailablePlates: Plate[] = [
      { weight: 45, available: false, count: 0 },
      { weight: 25, available: false, count: 0 },
    ];

    const minimizedSets = percentageBased(
      targetWeight,
      6,
      barWeight,
      unavailablePlates,
      true,
      false,
      0,
    );

    for (const set of minimizedSets) {
      expect(set.weight).toBe(barWeight);
    }
  });
});
