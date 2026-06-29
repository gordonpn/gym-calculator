import { describe, expect, it } from "vitest";
import type { RepMaxSet } from "../src/components/repMaxCalculator";
import repMaxCalculator from "../src/components/repMaxCalculator";
import type { StrengthSet } from "../src/components/strengthLevelCalculator";
import strengthLevelCalculator from "../src/components/strengthLevelCalculator";

// ---------------------------------------------------------------------------
// repMaxCalculator
// ---------------------------------------------------------------------------

describe("getBodyweightValue", () => {
  it("returns 0 when no parent bodyweight is set", () => {
    const cmp = repMaxCalculator();
    expect(cmp.getBodyweightValue()).toBe(0);
  });

  it("returns parsed bodyweight when valid", () => {
    const cmp = repMaxCalculator();
    cmp.parentBodyweight = "160";
    expect(cmp.getBodyweightValue()).toBe(160);
  });

  it("returns 0 for non-positive bodyweight", () => {
    const cmp = repMaxCalculator();
    cmp.parentBodyweight = "0";
    expect(cmp.getBodyweightValue()).toBe(0);
  });

  it("returns 0 for non-finite bodyweight", () => {
    const cmp = repMaxCalculator();
    cmp.parentBodyweight = "abc";
    expect(cmp.getBodyweightValue()).toBe(0);
  });
});

describe("getEffectiveSetWeight", () => {
  it("returns entered weight for non-bodyweight exercises", () => {
    const cmp = repMaxCalculator();
    cmp.parentIsWeightedBodyweight = false;
    cmp.parentBodyweight = "";
    const set: RepMaxSet = { weight: "100", reps: "5", estimatedMax: 0 };
    expect(cmp.getEffectiveSetWeight(set)).toBe(100);
  });

  it("adds bodyweight for weighted bodyweight exercises", () => {
    const cmp = repMaxCalculator();
    cmp.parentIsWeightedBodyweight = true;
    cmp.parentBodyweight = "150";
    const set: RepMaxSet = { weight: "50", reps: "5", estimatedMax: 0 };
    expect(cmp.getEffectiveSetWeight(set)).toBe(200);
  });
});

describe("isValidSet", () => {
  it("validates normal sets with positive weight and reps", () => {
    const cmp = repMaxCalculator();
    cmp.parentIsWeightedBodyweight = false;
    expect(cmp.isValidSet({ weight: "100", reps: "5", estimatedMax: 0 })).toBe(
      true,
    );
    expect(cmp.isValidSet({ weight: "0", reps: "5", estimatedMax: 0 })).toBe(
      false,
    );
  });

  it("allows zero weight for weighted bodyweight when bodyweight is set", () => {
    const cmp = repMaxCalculator();
    cmp.parentIsWeightedBodyweight = true;
    cmp.parentBodyweight = "150";
    expect(cmp.isValidSet({ weight: "0", reps: "5", estimatedMax: 0 })).toBe(
      true,
    );
  });

  it("rejects weighted bodyweight sets when no bodyweight", () => {
    const cmp = repMaxCalculator();
    cmp.parentIsWeightedBodyweight = true;
    cmp.parentBodyweight = "0";
    expect(cmp.isValidSet({ weight: "0", reps: "5", estimatedMax: 0 })).toBe(
      false,
    );
  });
});

describe("calculateSetMax", () => {
  it("calculates 1RM estimate for a valid set using Epley formula", () => {
    const cmp = repMaxCalculator();
    cmp.parentIsWeightedBodyweight = false;
    // Epley: 100 * (1 + 5/30) = 116.67 → 117
    const set: RepMaxSet = { weight: "100", reps: "5", estimatedMax: 0 };
    const result = cmp.calculateSetMax(set);
    expect(result).toBe(117);
    expect(set.estimatedMax).toBe(117);
  });

  it("includes bodyweight in calculation for weighted bodyweight mode", () => {
    const cmp = repMaxCalculator();
    cmp.parentIsWeightedBodyweight = true;
    cmp.parentBodyweight = "150";
    // Effective weight = 50 + 150 = 200
    // Epley: 200 * (1 + 5/30) = 233.33 → 233
    const set: RepMaxSet = { weight: "50", reps: "5", estimatedMax: 0 };
    const result = cmp.calculateSetMax(set);
    expect(result).toBe(233);
  });
});

describe("calculateAverageMax", () => {
  it("calculates average 1RM from valid sets", () => {
    const cmp = repMaxCalculator();
    cmp.calculationMethod = "average";
    cmp.parentIsWeightedBodyweight = false;
    cmp.sets = [
      { weight: "100", reps: "5", estimatedMax: 0 },
      { weight: "200", reps: "2", estimatedMax: 0 },
    ];
    cmp.calculateAverageMax();
    // 100x5 → 117, 200x2 → 213. Average = round((117+213)/2) = 165
    expect(cmp.estimatedMax).toBeGreaterThan(0);
    expect(cmp.repRangeData).toHaveLength(15);
  });

  it("generates rep range table from 1 to 15 reps", () => {
    const cmp = repMaxCalculator();
    cmp.calculationMethod = "average";
    cmp.parentIsWeightedBodyweight = false;
    cmp.sets = [{ weight: "135", reps: "5", estimatedMax: 0 }];
    cmp.calculateAverageMax();
    expect(cmp.repRangeData).toHaveLength(15);
    expect(cmp.repRangeData[0].reps).toBe(1);
    expect(cmp.repRangeData[4].reps).toBe(5);
    expect(cmp.repRangeData[14].reps).toBe(15);
    // Rep range weight decreases as reps increase
    expect(cmp.repRangeData[0].weight).toBeGreaterThan(
      cmp.repRangeData[4].weight,
    );
  });

  it("sets errorMessage and clears data for invalid sets", () => {
    const cmp = repMaxCalculator();
    cmp.parentIsWeightedBodyweight = false;
    cmp.sets = [
      { weight: "", reps: "", estimatedMax: 0 },
      { weight: "-5", reps: "5", estimatedMax: 0 },
    ];
    cmp.calculateAverageMax();
    expect(cmp.estimatedMax).toBe(0);
    expect(cmp.repRangeData).toEqual([]);
  });

  it("sets empty result when no valid sets have weight/reps", () => {
    const cmp = repMaxCalculator();
    cmp.parentIsWeightedBodyweight = false;
    cmp.sets = [{ weight: "", reps: "", estimatedMax: 0 }];
    cmp.calculateAverageMax();
    expect(cmp.estimatedMax).toBe(0);
    expect(cmp.repRangeData).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// strengthLevelCalculator
// ---------------------------------------------------------------------------

describe("strengthLevelCalculator calculateSetMax", () => {
  it("calculates 1RM estimate with single-rep rounding enabled", () => {
    const cmp = strengthLevelCalculator();
    const set: StrengthSet = { weight: "200", reps: "1", estimatedMax: 0 };
    const result = cmp.calculateSetMax(set);
    // Single rep with roundSingleRep: true → Math.round(200) = 200
    expect(result).toBe(200);
    expect(set.estimatedMax).toBe(200);
  });

  it("uses Epley formula for multi-rep sets", () => {
    const cmp = strengthLevelCalculator();
    // Epley: 225 * (1 + 5/30) = 262.5 → 263
    const set: StrengthSet = { weight: "225", reps: "5", estimatedMax: 0 };
    const result = cmp.calculateSetMax(set);
    expect(result).toBe(263);
  });
});

describe("evaluateStrengthLevel", () => {
  it("determines strength level based on bodyweight ratio", () => {
    const cmp = strengthLevelCalculator();
    cmp.selectedLift = "benchPress";
    cmp.bodyweight = "200";
    cmp.estimatedMax = 250;
    // ratio = 250/200 = 1.25
    // benchPress: U(0.5), N(0.75), I(1.25), A(1.75), E(2.25)
    // 1.25 >= 1.25 → Intermediate. Next: Advanced at 1.75
    cmp.evaluateStrengthLevel();
    expect(cmp.strengthResult).not.toBeNull();
    expect(cmp.strengthResult?.level).toBe("Intermediate");
    expect(cmp.strengthResult?.nextLevel).toBe("Advanced");
    expect(cmp.strengthResult?.nextMultiple).toBe(1.75);
    expect(cmp.strengthResult?.nextWeight).toBe(350); // roundToNearest5(1.75*200)
  });

  it("handles below-untrained level", () => {
    const cmp = strengthLevelCalculator();
    cmp.selectedLift = "benchPress";
    cmp.bodyweight = "200";
    cmp.estimatedMax = 50;
    // ratio = 50/200 = 0.25. Below 0.5 (Untrained)
    cmp.evaluateStrengthLevel();
    expect(cmp.strengthResult?.level).toBe("Below untrained");
    expect(cmp.strengthResult?.nextLevel).toBe("Untrained");
    expect(cmp.strengthResult?.nextMultiple).toBe(0.5);
  });

  it("handles elite level with no next level", () => {
    const cmp = strengthLevelCalculator();
    cmp.selectedLift = "squat";
    cmp.bodyweight = "200";
    cmp.estimatedMax = 600;
    // ratio = 3.0. squat: Elite at 2.75
    // 3.0 >= 2.75 → Elite. No next level.
    cmp.evaluateStrengthLevel();
    expect(cmp.strengthResult?.level).toBe("Elite");
    expect(cmp.strengthResult?.nextLevel).toBeNull();
    expect(cmp.strengthResult?.nextWeight).toBeNull();
  });

  it("sets null result when bodyweight is invalid", () => {
    const cmp = strengthLevelCalculator();
    cmp.bodyweight = "";
    cmp.estimatedMax = 250;
    cmp.evaluateStrengthLevel();
    expect(cmp.strengthResult).toBeNull();
  });

  it("sets null result when estimatedMax is 0", () => {
    const cmp = strengthLevelCalculator();
    cmp.bodyweight = "200";
    cmp.estimatedMax = 0;
    cmp.evaluateStrengthLevel();
    expect(cmp.strengthResult).toBeNull();
  });
});

describe("calculateStrength", () => {
  it("aggregates 1RM estimates and evaluates strength level", () => {
    const cmp = strengthLevelCalculator();
    cmp.selectedLift = "squat";
    cmp.bodyweight = "200";
    cmp.calculationMethod = "average";
    cmp.sets = [
      { weight: "225", reps: "5", estimatedMax: 0 },
      { weight: "275", reps: "3", estimatedMax: 0 },
    ];
    // 225x5 → 263, 275x3 → 303. Average = 283
    // ratio = 283/200 = 1.415
    // squat: U(0.75), N(1.25), I(1.75)
    // 1.415 >= 1.25 (Novice), < 1.75 → Novice, next: Intermediate
    cmp.calculateStrength();
    expect(cmp.estimatedMax).toBeGreaterThan(0);
    expect(cmp.strengthResult).not.toBeNull();
    expect(cmp.strengthResult?.level).toBe("Novice");
    expect(cmp.strengthResult?.nextLevel).toBe("Intermediate");
  });

  it("handles no valid sets", () => {
    const cmp = strengthLevelCalculator();
    cmp.sets = [{ weight: "-5", reps: "5", estimatedMax: 0 }];
    cmp.calculateStrength();
    expect(cmp.estimatedMax).toBe(0);
    expect(cmp.strengthResult).toBeNull();
  });

  it("handles empty sets", () => {
    const cmp = strengthLevelCalculator();
    cmp.sets = [{ weight: "", reps: "", estimatedMax: 0 }];
    cmp.calculateStrength();
    expect(cmp.estimatedMax).toBe(0);
    expect(cmp.strengthResult).toBeNull();
  });

  it("sets per-set estimatedMax values during calculation", () => {
    const cmp = strengthLevelCalculator();
    cmp.selectedLift = "deadlift";
    cmp.bodyweight = "180";
    cmp.calculationMethod = "highest";
    cmp.sets = [
      { weight: "315", reps: "5", estimatedMax: 0 },
      { weight: "365", reps: "2", estimatedMax: 0 },
    ];
    cmp.calculateStrength();
    // Each set's estimatedMax should be populated
    expect(cmp.sets[0].estimatedMax).toBeGreaterThan(0);
    expect(cmp.sets[1].estimatedMax).toBeGreaterThan(0);
  });
});
