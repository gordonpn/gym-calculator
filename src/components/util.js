export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export function roundToNearest5(num) {
  return Math.round(num / 5) * 5;
}

export function roundToSmallestPlate(num, availablePlates) {
  // Find the smallest available plate
  const smallestPlate = availablePlates
    .filter((plate) => plate.available)
    .map((plate) => plate.weight)
    .sort((a, b) => a - b)[0];

  // If no plates are available, fall back to rounding to nearest 5
  if (!smallestPlate) {
    return roundToNearest5(num);
  }

  // Round to the nearest multiple of the smallest plate
  return Math.round(num / smallestPlate) * smallestPlate;
}

export function roundToNearestAchievableWeight(
  targetWeight,
  barWeight,
  availablePlates,
  isWeightedBodyweight = false
) {
  // Validate inputs
  const weight = Number(targetWeight);
  const bar = Number(barWeight);

  if (Number.isNaN(weight) || Number.isNaN(bar)) {
    return Number(targetWeight);
  }

  // For bodyweight exercises, we calculate the total weight needed (bodyweight + added weight)
  // The bar is not used in the equation
  const effectiveBarWeight = isWeightedBodyweight ? 0 : bar;

  if (weight <= effectiveBarWeight) {
    return effectiveBarWeight;
  }

  // Get available plates sorted by weight (largest first for greedy algorithm)
  const availablePlateWeights = availablePlates
    .filter((plate) => plate && plate.available)
    .map((plate) => Number(plate.weight))
    .sort((a, b) => b - a);

  if (availablePlateWeights.length === 0) {
    // No plates available, return original weight
    return weight;
  }

  // For standard exercises, calculate weight to add on each side
  // For weighted bodyweight, use the full weight
  const weightToDistribute = isWeightedBodyweight
    ? weight
    : (weight - effectiveBarWeight) / 2;

  // Greedy algorithm: pick largest plates first to build up to the target
  let remaining = weightToDistribute;
  let totalAdded = 0;

  for (const plate of availablePlateWeights) {
    const count = Math.floor(remaining / plate);
    totalAdded += count * plate;
    remaining = remaining - count * plate;
  }

  // Check if exact weight is achievable
  if (remaining < 0.001) {
    // We can achieve this weight exactly
    return weight;
  }

  // Weight cannot be achieved exactly
  // Find closest achievable weight by checking both rounding down and up
  const weightDown = isWeightedBodyweight
    ? totalAdded
    : effectiveBarWeight + totalAdded * 2;

  // Try adding one more of the smallest plate to round up
  const smallestPlate = availablePlateWeights[availablePlateWeights.length - 1];
  const weightUp = isWeightedBodyweight
    ? totalAdded + smallestPlate
    : effectiveBarWeight + (totalAdded + smallestPlate) * 2;

  // Return whichever is closer to target
  const result = Math.abs(weight - weightDown) <= Math.abs(weight - weightUp)
    ? weightDown
    : weightUp;

  return Number(result);
}
