import type { Plate } from './util';

/**
 * Interface for a single warm-up set
 */
export interface WarmupSet {
  percentage: number;
  weight: number;
  reps: number;
  idealWeight?: number;
  addedWeight?: number;
  isBackoff?: boolean;
  plates?: PlateCalculation;
}

/**
 * Interface for plate calculation results
 */
export interface PlateCalculation {
  plateConfig: Array<{ weight: number; count: number }>;
  remaining: number;
  actualWeight: number;
}

/**
 * Type alias for warmup formula functions
 */
export type FormulaFunction = (
  targetWeight: number,
  numSets?: number,
  barWeight?: number,
  availablePlates?: Plate[],
  minimizePlateChanges?: boolean,
  isWeightedBodyweight?: boolean,
  bodyweight?: number
) => WarmupSet[];

/**
 * Generate all possible weights that can be achieved with available plates
 */
export function generatePossibleWeights(
  barWeight: number,
  targetWeight: number,
  availablePlates: Plate[],
  isWeightedBodyweight: boolean = false
): number[] {
  const availablePlateWeights = availablePlates
    .filter((p) => p.available && Number(p.count ?? 0) > 0)
    .map((p) => ({
      weight: p.weight,
      count: Math.max(0, Math.floor(Number(p.count ?? 0))),
    }))
    .sort((a, b) => b.weight - a.weight);

  if (availablePlateWeights.length === 0) {
    return [barWeight];
  }

  // Find the smallest plate to use as increment step
  const smallestPlate =
    availablePlateWeights[availablePlateWeights.length - 1].weight;

  // Generate all possible combinations up to target weight
  const generateCombinations = (
    weights: Array<{ weight: number; count: number }>,
    maxWeight: number
  ) => {
    const combos: number[] = [];

    if (isWeightedBodyweight) {
      combos.push(barWeight); // Just bodyweight (no bar)
    } else {
      combos.push(barWeight); // Just the bar
    }

    // Loop by smallest plate increment instead of by 1
    const increment = smallestPlate;
    for (let i = increment; i <= maxWeight; i += increment) {
      let remaining = i;
      let totalAdded = 0;

      for (const plate of weights) {
        const desiredCount = Math.floor(remaining / plate.weight);
        const count = Math.min(desiredCount, plate.count);
        totalAdded += count * plate.weight;
        remaining -= count * plate.weight;
      }

      if (remaining < 0.001) {
        // For weighted bodyweight, added weight is not multiplied by 2 (no both sides)
        // For regular exercises, plates are on both sides so multiply by 2
        const totalWeight = isWeightedBodyweight
          ? barWeight + totalAdded
          : barWeight + totalAdded * 2;
        combos.push(totalWeight);
      }
    }

    return combos;
  };

  const maxPerSide = isWeightedBodyweight
    ? targetWeight - barWeight
    : (targetWeight - barWeight) / 2;
  const combinations = generateCombinations(availablePlateWeights, maxPerSide);

  return Array.from(new Set(combinations)).sort((a, b) => a - b);
}

/**
 * Find the closest weight from possible weights
 */
function findClosestWeight(target: number, possibleWeights: number[]): number {
  return possibleWeights.reduce((closest, weight) =>
    Math.abs(weight - target) < Math.abs(closest - target) ? weight : closest
  );
}

/**
 * Optimize plate changes between sets
 */
function optimizePlateChanges(
  sets: WarmupSet[],
  barWeight: number,
  availablePlates: Plate[]
): WarmupSet[] {
  if (sets.length <= 1) {
    return sets;
  }

  const plateOptions = availablePlates
    .filter((plate) => plate.available && Number(plate.count ?? 0) > 0)
    .map((plate) => ({
      weight: Number(plate.weight),
      count: Math.max(0, Math.floor(Number(plate.count ?? 0))),
    }))
    .sort((a, b) => b.weight - a.weight);

  if (plateOptions.length === 0) {
    return sets;
  }

  const maxSetWeight = Math.max(...sets.map((set) => set.weight));
  const possibleWeights = generatePossibleWeights(
    barWeight,
    maxSetWeight,
    availablePlates,
    false
  );

  if (possibleWeights.length === 0) {
    return sets;
  }

  const getConfigForWeight = (totalWeight: number): number[] => {
    const counts = Array.from({ length: plateOptions.length }, () => 0);
    const perSide = Math.max(0, (totalWeight - barWeight) / 2);
    let remaining = perSide;

    for (let i = 0; i < plateOptions.length; i++) {
      const plate = plateOptions[i];
      const desiredCount = Math.floor(remaining / plate.weight);
      const count = Math.min(desiredCount, plate.count);
      counts[i] = count;
      remaining -= count * plate.weight;
    }

    return counts;
  };

  const movementCost = (from: number[], to: number[]): number => {
    let moves = 0;
    for (let i = 0; i < to.length; i++) {
      moves += Math.abs((from[i] || 0) - (to[i] || 0));
    }
    return moves;
  };

  const baseConfig = Array.from({ length: plateOptions.length }, () => 0);

  const candidatesBySet = sets.map((set) => {
    const idealWeight =
      typeof set.idealWeight === 'number' ? set.idealWeight : set.weight;

    const nearest = [...possibleWeights]
      .sort((a, b) => Math.abs(a - idealWeight) - Math.abs(b - idealWeight))
      .slice(0, 8);

    nearest.push(set.weight);

    const uniqueWeights = Array.from(new Set(nearest)).sort((a, b) => a - b);

    return uniqueWeights.map((weight) => ({
      weight,
      config: getConfigForWeight(weight),
      deviation: Math.abs(weight - idealWeight),
    }));
  });

  if (candidatesBySet.some((candidates) => candidates.length === 0)) {
    return sets;
  }

  const dpMoves: number[][] = [];
  const dpDeviation: number[][] = [];
  const prevIndex: number[][] = [];

  for (let setIndex = 0; setIndex < candidatesBySet.length; setIndex++) {
    const candidates = candidatesBySet[setIndex];
    dpMoves.push(Array.from({ length: candidates.length }, () => Number.POSITIVE_INFINITY));
    dpDeviation.push(
      Array.from({ length: candidates.length }, () => Number.POSITIVE_INFINITY)
    );
    prevIndex.push(Array.from({ length: candidates.length }, () => -1));
  }

  for (let j = 0; j < candidatesBySet[0].length; j++) {
    const candidate = candidatesBySet[0][j];
    dpMoves[0][j] = movementCost(baseConfig, candidate.config);
    dpDeviation[0][j] = candidate.deviation;
  }

  for (let i = 1; i < candidatesBySet.length; i++) {
    for (let j = 0; j < candidatesBySet[i].length; j++) {
      const current = candidatesBySet[i][j];

      for (let k = 0; k < candidatesBySet[i - 1].length; k++) {
        const previous = candidatesBySet[i - 1][k];
        if (current.weight < previous.weight) {
          continue;
        }

        const nextMoves = dpMoves[i - 1][k] + movementCost(previous.config, current.config);
        const nextDeviation = dpDeviation[i - 1][k] + current.deviation;

        const isBetterMoves = nextMoves < dpMoves[i][j];
        const isTieWithBetterDeviation =
          nextMoves === dpMoves[i][j] && nextDeviation < dpDeviation[i][j];

        if (isBetterMoves || isTieWithBetterDeviation) {
          dpMoves[i][j] = nextMoves;
          dpDeviation[i][j] = nextDeviation;
          prevIndex[i][j] = k;
        }
      }
    }
  }

  let bestLast = 0;
  const lastRow = dpMoves.length - 1;
  for (let j = 1; j < dpMoves[lastRow].length; j++) {
    const hasBetterMoves = dpMoves[lastRow][j] < dpMoves[lastRow][bestLast];
    const hasSameMovesBetterDeviation =
      dpMoves[lastRow][j] === dpMoves[lastRow][bestLast] &&
      dpDeviation[lastRow][j] < dpDeviation[lastRow][bestLast];

    if (hasBetterMoves || hasSameMovesBetterDeviation) {
      bestLast = j;
    }
  }

  const chosenWeights: number[] = Array.from({ length: sets.length }, () => barWeight);
  let cursor = bestLast;
  for (let i = sets.length - 1; i >= 0; i--) {
    chosenWeights[i] = candidatesBySet[i][cursor].weight;
    cursor = prevIndex[i][cursor];
  }

  return sets.map((set, index) => ({
    ...set,
    weight: chosenWeights[index],
    addedWeight:
      typeof set.addedWeight === 'number'
        ? Math.max(0, chosenWeights[index] - barWeight)
        : set.addedWeight,
  }));
}

/**
 * Percentage-based warmup formula
 */
export function percentageBased(
  targetWeight: number,
  numSets: number = 6,
  barWeight: number = 45,
  availablePlates: Plate[] = [],
  minimizePlateChanges: boolean = false,
  isWeightedBodyweight: boolean = false,
  bodyweight: number = 0
): WarmupSet[] {
  const effectiveTargetWeight = isWeightedBodyweight
    ? targetWeight - bodyweight
    : targetWeight;

  const sets: WarmupSet[] = [];
  const minPercentage = 40;
  const maxPercentage = 90;
  const percentageRange = maxPercentage - minPercentage;

  const idealWeights: Array<{ percentage: number; idealWeight: number }> = [];
  for (let i = 0; i < numSets; i++) {
    const percentage = Math.round(
      minPercentage + (percentageRange * i) / (numSets - 1)
    );
    let idealWeight: number;

    if (isWeightedBodyweight) {
      // For bodyweight exercises, lower percentages may mean negative added weight
      idealWeight = Math.round(
        effectiveTargetWeight * (percentage / 100) + bodyweight
      );
      // Ensure we don't go below bodyweight
      if (idealWeight < bodyweight) {
        idealWeight = bodyweight;
      }
    } else {
      idealWeight = Math.round(targetWeight * (percentage / 100));
    }

    idealWeights.push({ percentage, idealWeight });
  }

  if (minimizePlateChanges) {
    const possibleWeights = generatePossibleWeights(
      barWeight,
      targetWeight,
      availablePlates
    );

    for (let i = 0; i < idealWeights.length; i++) {
      const { percentage, idealWeight } = idealWeights[i];
      const closestWeight = findClosestWeight(idealWeight, possibleWeights);

      let reps: number;
      if (percentage <= 50) reps = 10;
      else if (percentage <= 60) reps = 8;
      else if (percentage <= 70) reps = 6;
      else if (percentage <= 80) reps = 5;
      else if (percentage <= 85) reps = 3;
      else reps = 2;

      sets.push({
        percentage,
        weight: closestWeight,
        reps,
        idealWeight,
        addedWeight: isWeightedBodyweight
          ? Math.max(0, closestWeight - bodyweight)
          : closestWeight,
      });
    }

    return optimizePlateChanges(sets, barWeight, availablePlates);
  }

  for (let i = 0; i < numSets; i++) {
    const { percentage, idealWeight } = idealWeights[i];

    let reps: number;
    if (percentage <= 50) reps = 10;
    else if (percentage <= 60) reps = 8;
    else if (percentage <= 70) reps = 6;
    else if (percentage <= 80) reps = 5;
    else if (percentage <= 85) reps = 3;
    else reps = 2;

    sets.push({
      percentage,
      weight: idealWeight,
      reps,
      addedWeight: isWeightedBodyweight
        ? Math.max(0, idealWeight - bodyweight)
        : idealWeight,
    });
  }

  return sets.sort((a, b) => a.weight - b.weight);
}

/**
 * Fixed increments warmup formula
 */
export function fixedIncrements(
  targetWeight: number,
  numSets: number = 5,
  barWeight: number = 45,
  _availablePlates: Plate[] = [],
  _minimizePlateChanges: boolean = false,
  isWeightedBodyweight: boolean = false,
  bodyweight: number = 0
): WarmupSet[] {
  const effectiveTargetWeight = isWeightedBodyweight
    ? targetWeight - bodyweight
    : targetWeight;
  const effectiveBarWeight = isWeightedBodyweight ? 0 : barWeight;

  const desiredTopPercent = 0.9;
  const originalTopRatio = numSets / (numSets + 1);
  const topRatio = Math.min(Math.max(originalTopRatio, desiredTopPercent), 0.95);

  const topWarmupWeight = effectiveTargetWeight * topRatio;
  const increment = (topWarmupWeight - effectiveBarWeight) / numSets;

  const sets: WarmupSet[] = [];

  for (let i = 0; i < numSets; i++) {
    let addedComponent = effectiveBarWeight + increment * (i + 1);

    if (addedComponent >= effectiveTargetWeight) {
      addedComponent = effectiveTargetWeight * 0.99;
    }

    let displayWeight = addedComponent;
    let percentage: number;

    if (isWeightedBodyweight) {
      const totalWeight = bodyweight + addedComponent;
      percentage = Math.round((totalWeight / targetWeight) * 100);
      displayWeight = totalWeight;
    } else {
      percentage = Math.round((addedComponent / effectiveTargetWeight) * 100);
    }

    let reps: number;
    if (percentage <= 50) reps = 10;
    else if (percentage <= 60) reps = 8;
    else if (percentage <= 70) reps = 6;
    else if (percentage <= 80) reps = 5;
    else if (percentage <= 85) reps = 3;
    else reps = 2;

    sets.push({
      percentage,
      weight: Math.round(displayWeight),
      reps,
      addedWeight: isWeightedBodyweight
        ? Math.max(0, Math.round(displayWeight) - bodyweight)
        : undefined,
    });
  }

  return sets;
}

/**
 * Standard pyramid formula
 */
export function standardPyramid(
  targetWeight: number,
  _numSets?: number,
  _barWeight?: number,
  _availablePlates?: Plate[],
  _minimizePlateChanges?: boolean,
  isWeightedBodyweight?: boolean,
  bodyweight?: number
): WarmupSet[] {
  const sets: WarmupSet[] = [];
  const percentages = [50, 60, 70, 80];

  for (const percentage of percentages) {
    const weight = Math.round(targetWeight * (percentage / 100));
    const addedWeight = isWeightedBodyweight ? weight - (bodyweight || 0) : weight;

    let reps: number;
    if (percentage <= 50) reps = 10;
    else if (percentage <= 60) reps = 8;
    else if (percentage <= 70) reps = 6;
    else reps = 5;

    sets.push({
      percentage,
      weight,
      reps,
      addedWeight:
        isWeightedBodyweight && addedWeight > 0 ? addedWeight : undefined,
    });
  }

  return sets;
}

/**
 * Weighted bodyweight formula
 */
export function weightedBodyweight(
  targetWeight: number,
  numSets: number = 3,
  _barWeight: number = 0,
  availablePlates: Plate[] = [],
  _minimizePlateChanges: boolean = false,
  _isWeightedBodyweight: boolean = true,
  bodyweight: number = 150
): WarmupSet[] {
  return percentageBased(
    targetWeight,
    numSets,
    0,
    availablePlates,
    false,
    true,
    bodyweight
  );
}

/**
 * Weighted bodyweight formula for Fresh sessions
 * Bodyweight-only x8, 50% added weight x3, working set (+added)
 */
export function weightedBodyweightPreClimbing(
  targetWeight: number,
  _numSets?: number,
  _barWeight: number = 0,
  _availablePlates: Plate[] = [],
  _minimizePlateChanges: boolean = false,
  _isWeightedBodyweight: boolean = true,
  bodyweight: number = 150
): WarmupSet[] {
  const workingWeight = Math.round(targetWeight);
  const addedWeight = Math.max(0, workingWeight - bodyweight);
  const halfAddedWeight = Math.round(bodyweight + addedWeight * 0.5);

  return [
    {
      percentage: Math.round((bodyweight / Math.max(workingWeight, 1)) * 100),
      weight: bodyweight,
      reps: 8,
      addedWeight: 0,
    },
    {
      percentage: Math.round((halfAddedWeight / Math.max(workingWeight, 1)) * 100),
      weight: halfAddedWeight,
      reps: 3,
      addedWeight: Math.max(0, halfAddedWeight - bodyweight),
    },
    {
      percentage: 100,
      weight: workingWeight,
      reps: 0,
      addedWeight,
    },
  ];
}

/**
 * Weighted bodyweight formula for Warmed up sessions
 * Bodyweight-only x5, skip middle set, working set (+added)
 */
export function weightedBodyweightPostClimbing(
  targetWeight: number,
  _numSets?: number,
  _barWeight: number = 0,
  _availablePlates: Plate[] = [],
  _minimizePlateChanges: boolean = false,
  _isWeightedBodyweight: boolean = true,
  bodyweight: number = 150
): WarmupSet[] {
  const workingWeight = Math.round(targetWeight);
  const addedWeight = Math.max(0, workingWeight - bodyweight);

  return [
    {
      percentage: Math.round((bodyweight / Math.max(workingWeight, 1)) * 100),
      weight: bodyweight,
      reps: 5,
      addedWeight: 0,
    },
    {
      percentage: 100,
      weight: workingWeight,
      reps: 0,
      addedWeight,
    },
  ];
}

/**
 * Dumbbell ramp-up formula for Fresh sessions (Rule of 3)
 */
export function dumbbellPreClimbing(
  targetWeight: number,
  _numSets?: number,
  _barWeight?: number,
  _availablePlates?: Plate[],
  _minimizePlateChanges?: boolean,
  _isWeightedBodyweight?: boolean,
  _bodyweight?: number
): WarmupSet[] {
  return [
    {
      percentage: 50,
      weight: Math.round(targetWeight * 0.5),
      reps: 12,
    },
    {
      percentage: 75,
      weight: Math.round(targetWeight * 0.75),
      reps: 6,
    },
    {
      percentage: 100,
      weight: Math.round(targetWeight),
      reps: 0,
    },
  ];
}

/**
 * Dumbbell ramp-up formula for Warmed up sessions (Energy Saver)
 */
export function dumbbellPostClimbing(
  targetWeight: number,
  _numSets?: number,
  _barWeight?: number,
  _availablePlates?: Plate[],
  _minimizePlateChanges?: boolean,
  _isWeightedBodyweight?: boolean,
  _bodyweight?: number
): WarmupSet[] {
  return [
    {
      percentage: 50,
      weight: Math.round(targetWeight * 0.5),
      reps: 8,
    },
    {
      percentage: 100,
      weight: Math.round(targetWeight),
      reps: 0,
    },
  ];
}

/**
 * Barbell ramp-up formula for Fresh sessions
 * Empty bar x15, 50% x5, 75% x3, working weight
 */
export function barbellPreClimbing(
  targetWeight: number,
  _numSets?: number,
  barWeight: number = 45,
  _availablePlates?: Plate[],
  _minimizePlateChanges?: boolean,
  _isWeightedBodyweight?: boolean,
  _bodyweight?: number
): WarmupSet[] {
  const workingWeight = Math.round(targetWeight);
  const emptyBarWeight = Math.round(barWeight);

  return [
    {
      percentage: Math.round((emptyBarWeight / Math.max(workingWeight, 1)) * 100),
      weight: emptyBarWeight,
      reps: 15,
    },
    {
      percentage: 50,
      weight: Math.round(workingWeight * 0.5),
      reps: 5,
    },
    {
      percentage: 75,
      weight: Math.round(workingWeight * 0.75),
      reps: 3,
    },
    {
      percentage: 100,
      weight: workingWeight,
      reps: 0,
    },
  ];
}

/**
 * Barbell ramp-up formula for Warmed up sessions
 * Empty bar x10, 60% x4, skip, working weight
 */
export function barbellPostClimbing(
  targetWeight: number,
  _numSets?: number,
  barWeight: number = 45,
  _availablePlates?: Plate[],
  _minimizePlateChanges?: boolean,
  _isWeightedBodyweight?: boolean,
  _bodyweight?: number
): WarmupSet[] {
  const workingWeight = Math.round(targetWeight);
  const emptyBarWeight = Math.round(barWeight);

  return [
    {
      percentage: Math.round((emptyBarWeight / Math.max(workingWeight, 1)) * 100),
      weight: emptyBarWeight,
      reps: 10,
    },
    {
      percentage: 60,
      weight: Math.round(workingWeight * 0.6),
      reps: 4,
    },
    {
      percentage: 100,
      weight: workingWeight,
      reps: 0,
    },
  ];
}

// Formula registry
const formulas: Record<string, FormulaFunction> = {
  percentageBased,
  fixedIncrements,
  standardPyramid,
  weightedBodyweight,
  weightedBodyweightPreClimbing,
  weightedBodyweightPostClimbing,
  dumbbellPreClimbing,
  dumbbellPostClimbing,
  barbellPreClimbing,
  barbellPostClimbing,
};

const configurableFormulas = new Set(['percentageBased', 'fixedIncrements']);

/**
 * Get formula by ID
 */
export function getFormula(formulaId: string): FormulaFunction {
  return formulas[formulaId] || percentageBased;
}

/**
 * Check if formula is configurable
 */
export function isConfigurableFormula(formulaId: string): boolean {
  return configurableFormulas.has(formulaId);
}

/**
 * Get default number of sets for a formula
 */
export function getDefaultSets(formulaId: string): number {
  switch (formulaId) {
    case 'weightedBodyweightPreClimbing':
      return 3;
    case 'weightedBodyweightPostClimbing':
      return 2;
    case 'barbellPreClimbing':
      return 4;
    case 'barbellPostClimbing':
      return 3;
    case 'dumbbellPreClimbing':
      return 3;
    case 'dumbbellPostClimbing':
      return 2;
    case 'fixedIncrements':
      return 5;
    case 'standardPyramid':
      return 4;
    case 'weightedBodyweight':
      return 3;
    default:
      return 6;
  }
}
