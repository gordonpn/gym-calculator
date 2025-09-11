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
