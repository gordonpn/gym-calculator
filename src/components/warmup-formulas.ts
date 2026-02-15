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
  adjustedTargetWeight?: number;
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
 * Interface for formula option
 */
export interface FormulaOption {
  id: string;
  name: string;
}

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
    .filter((p) => p.available)
    .map((p) => p.weight)
    .sort((a, b) => b - a);

  if (availablePlateWeights.length === 0) {
    return [barWeight];
  }

  // Find the smallest plate to use as increment step
  const smallestPlate = availablePlateWeights[availablePlateWeights.length - 1];

  // Generate all possible combinations up to target weight
  const generateCombinations = (weights: number[], maxWeight: number) => {
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
        const count = Math.floor(remaining / plate);
        totalAdded += count * plate;
        remaining -= count * plate;
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
  // Sort sets by weight
  const sorted = [...sets].sort((a, b) => a.weight - b.weight);

  // Track plate configuration for each set
  const optimized: WarmupSet[] = [];

  for (const set of sorted) {
    const effectiveWeight = set.weight - barWeight;
    const perSide = effectiveWeight / 2;

    // Calculate plates needed
    const availablePlateWeights = availablePlates
      .filter((p) => p.available)
      .map((p) => p.weight)
      .sort((a, b) => b - a);

    let remaining = perSide;
    const plateConfig: Array<{ weight: number; count: number }> = [];

    for (const plate of availablePlateWeights) {
      const count = Math.floor(remaining / plate);
      if (count > 0) {
        plateConfig.push({ weight: plate, count });
        remaining -= count * plate;
      }
    }

    optimized.push({
      ...set,
      // Track if plates changed from last set
    });
  }

  return optimized;
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
 * Dumbbell pre-climbing ramp-up formula (Rule of 3)
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
 * Dumbbell post-climbing ramp-up formula (Energy Saver)
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

// Formula registry
const formulas: Record<string, FormulaFunction> = {
  percentageBased,
  fixedIncrements,
  standardPyramid,
  weightedBodyweight,
  dumbbellPreClimbing,
  dumbbellPostClimbing,
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

/**
 * Formula options
 */
export const formulaOptions: FormulaOption[] = [
  { id: 'percentageBased', name: 'Percentage-Based' },
  { id: 'fixedIncrements', name: 'Fixed Increments' },
  { id: 'standardPyramid', name: 'Standard Pyramid' },
  { id: 'weightedBodyweight', name: 'Weighted Bodyweight' },
  { id: 'dumbbellPreClimbing', name: 'Dumbbell Pre-Climbing' },
  { id: 'dumbbellPostClimbing', name: 'Dumbbell Post-Climbing' },
];
