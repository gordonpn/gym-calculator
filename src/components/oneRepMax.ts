export type OneRepMaxMethod = 'average' | 'highest' | 'lowest' | 'weighted';

export const MAX_RELIABLE_REPS_FOR_1RM = 30;

export function parseSetWeight(weight: string | number): number {
  return Number.parseFloat(String(weight));
}

export function parseSetReps(reps: string | number): number {
  return Number.parseInt(String(reps), 10);
}

export function isReliableOneRepMaxReps(
  reps: number,
  maxReliableRepsFor1RM: number = MAX_RELIABLE_REPS_FOR_1RM
): boolean {
  return Number.isInteger(reps) && reps > 0 && reps <= maxReliableRepsFor1RM;
}

export function isValidOneRepMaxSet(
  weight: number,
  reps: number,
  options: { allowZeroWeight?: boolean } = {}
): boolean {
  if (Number.isNaN(reps) || reps <= 0 || Number.isNaN(weight)) {
    return false;
  }

  return options.allowZeroWeight ? weight >= 0 : weight > 0;
}

export function estimateOneRepMax(
  weight: number,
  reps: number,
  options: { roundSingleRep?: boolean } = {}
): number {
  if (!isValidOneRepMaxSet(weight, reps)) {
    return 0;
  }

  if (reps === 1) {
    return options.roundSingleRep ? Math.round(weight) : weight;
  }

  if (!isReliableOneRepMaxReps(reps)) {
    return 0;
  }

  if (reps <= 10) {
    return Math.round(weight * (1 + reps / 30));
  }

  return Math.round((weight * 36) / (37 - reps));
}

export function aggregateOneRepMax(
  estimates: number[],
  method: OneRepMaxMethod,
  factors: number[] = []
): number {
  if (estimates.length === 0) {
    return 0;
  }

  switch (method) {
    case 'highest': {
      return Math.max(...estimates);
    }
    case 'lowest': {
      return Math.min(...estimates);
    }
    case 'weighted': {
      let totalFactor = 0;
      let weightedSum = 0;

      for (let i = 0; i < estimates.length; i++) {
        const factor = factors[i] ?? 0;
        weightedSum += estimates[i] * factor;
        totalFactor += factor;
      }

      return totalFactor > 0 ? Math.round(weightedSum / totalFactor) : 0;
    }
    default: {
      const sum = estimates.reduce((acc, estimate) => acc + estimate, 0);
      return Math.round(sum / estimates.length);
    }
  }
}
