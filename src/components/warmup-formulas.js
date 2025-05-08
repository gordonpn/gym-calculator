export function percentageBased(
  targetWeight,
  numSets = 6,
  barWeight = 45,
  availablePlates = [],
  minimizePlateChanges = false,
  isWeightedBodyweight = false,
  bodyweight = 0
) {
  const effectiveTargetWeight = isWeightedBodyweight
    ? targetWeight - bodyweight
    : targetWeight;

  const sets = [];
  const minPercentage = 40;
  const maxPercentage = 90;
  const percentageRange = maxPercentage - minPercentage;

  const idealWeights = [];
  for (let i = 0; i < numSets; i++) {
    const percentage = Math.round(
      minPercentage + (percentageRange * i) / (numSets - 1)
    );
    let idealWeight;

    if (isWeightedBodyweight) {
      // For bodyweight exercises, lower percentages may mean negative added weight (less than bodyweight)
      idealWeight = Math.round(
        effectiveTargetWeight * (percentage / 100) + bodyweight
      );
      // Ensure we don't go below bodyweight (which would mean assistance rather than added weight)
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

      let reps;
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

    let reps;
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

export function fixedIncrements(
  targetWeight,
  numSets = 5,
  barWeight = 45,
  availablePlates = [],
  minimizePlateChanges = false,
  isWeightedBodyweight = false,
  bodyweight = 0
) {
  // For bodyweight exercises, we work with the added weight
  const effectiveTargetWeight = isWeightedBodyweight
    ? targetWeight - bodyweight
    : targetWeight;
  const effectiveBarWeight = isWeightedBodyweight ? 0 : barWeight;

  const idealWeights = [];
  const increment =
    (effectiveTargetWeight - effectiveBarWeight) / (numSets + 1);

  for (let i = 0; i < numSets; i++) {
    let weight = Math.round(effectiveBarWeight + increment * (i + 1));
    if (weight < effectiveTargetWeight) {
      const percentage = Math.round((weight / effectiveTargetWeight) * 100);

      // For bodyweight exercises, add back the bodyweight
      if (isWeightedBodyweight) {
        weight += bodyweight;
      }

      idealWeights.push({ percentage, idealWeight: weight });
    }
  }

  if (minimizePlateChanges) {
    const possibleWeights = generatePossibleWeights(
      barWeight,
      targetWeight,
      availablePlates
    );

    const sets = [];
    for (let i = 0; i < idealWeights.length; i++) {
      const { percentage, idealWeight } = idealWeights[i];
      const closestWeight = findClosestWeight(idealWeight, possibleWeights);

      let reps;
      if (percentage <= 50) reps = 8;
      else if (percentage <= 70) reps = 5;
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
  const sets = [];
  for (let i = 0; i < idealWeights.length; i++) {
    const { percentage, idealWeight } = idealWeights[i];

    let reps;
    if (percentage <= 50) reps = 8;
    else if (percentage <= 70) reps = 5;
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

export function fiveThreeOne(
  targetWeight,
  _,
  barWeight = 45,
  availablePlates = [],
  minimizePlateChanges = false,
  isWeightedBodyweight = false,
  bodyweight = 0
) {
  // For bodyweight exercises, work with just the added weight component
  const effectiveTargetWeight = isWeightedBodyweight
    ? targetWeight - bodyweight
    : targetWeight;

  const idealWeights = [];
  const percentages = [40, 50, 60];

  for (const percentage of percentages) {
    let idealWeight;
    if (isWeightedBodyweight) {
      // Calculate the added weight based on percentage, then add bodyweight back
      idealWeight = Math.round(
        effectiveTargetWeight * (percentage / 100) + bodyweight
      );
      // Don't go below bodyweight
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

    const sets = [];
    for (let i = 0; i < idealWeights.length; i++) {
      const { percentage, idealWeight } = idealWeights[i];
      const closestWeight = findClosestWeight(idealWeight, possibleWeights);

      let reps;
      if (percentage <= 40) reps = 10;
      else if (percentage <= 50) reps = 5;
      else reps = 3;

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
  const sets = [];
  for (let i = 0; i < idealWeights.length; i++) {
    const { percentage, idealWeight } = idealWeights[i];

    let reps;
    if (percentage <= 40) reps = 10;
    else if (percentage <= 50) reps = 5;
    else reps = 3;

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

export function weightedBodyweight(
  targetWeight,
  numSets = 5,
  barWeight = 45,
  availablePlates = [],
  minimizePlateChanges = false,
  isWeightedBodyweight = true,
  bodyweight = 0
) {
  if (!isWeightedBodyweight || bodyweight <= 0) {
    // Fall back to percentage based if not a bodyweight exercise
    return percentageBased(
      targetWeight,
      numSets,
      barWeight,
      availablePlates,
      minimizePlateChanges
    );
  }

  const addedWeight = targetWeight - bodyweight;
  if (addedWeight <= 0) {
    // If target is just bodyweight or less, use just bodyweight for all warm-ups
    const sets = [];
    for (let i = 0; i < numSets; i++) {
      const percentage =
        i === numSets - 1 ? 100 : Math.round(50 + (50 * i) / (numSets - 1));
      sets.push({
        percentage,
        weight: bodyweight,
        reps: 10 - i,
        addedWeight: 0,
      });
    }
    return sets;
  }

  const sets = [];

  // Add bodyweight-only sets at the beginning
  sets.push({
    percentage: Math.round((bodyweight / targetWeight) * 100),
    weight: bodyweight,
    reps: 10,
    addedWeight: 0,
  });

  // Add sets with increasing added weight
  const remainingSets = numSets - 1;
  for (let i = 0; i < remainingSets; i++) {
    // Calculate as percentage of the added weight component
    const percentage = Math.round(30 + (70 * i) / (remainingSets - 1));
    const setAddedWeight = Math.round((addedWeight * percentage) / 100);
    const totalWeight = bodyweight + setAddedWeight;

    let reps;
    if (percentage <= 40) reps = 8;
    else if (percentage <= 60) reps = 6;
    else if (percentage <= 80) reps = 4;
    else reps = 2;

    sets.push({
      percentage: Math.round((totalWeight / targetWeight) * 100),
      weight: totalWeight,
      reps,
      addedWeight: setAddedWeight,
    });
  }

  return sets.sort((a, b) => a.weight - b.weight);
}

function generatePossibleWeights(barWeight, targetWeight, availablePlates) {
  const weights = new Set([barWeight]);

  const plates = availablePlates
    .filter((plate) => plate.available)
    .map((plate) => plate.weight)
    .sort((a, b) => a - b);

  const queue = [barWeight];
  const seen = new Set([barWeight]);

  while (queue.length > 0) {
    const currentWeight = queue.shift();

    for (const plate of plates) {
      const newWeight = currentWeight + plate * 2;

      if (newWeight <= targetWeight && !seen.has(newWeight)) {
        weights.add(newWeight);
        queue.push(newWeight);
        seen.add(newWeight);
      }
    }
  }

  return Array.from(weights).sort((a, b) => a - b);
}

function findClosestWeight(targetWeight, possibleWeights) {
  return possibleWeights.reduce((prev, curr) =>
    Math.abs(curr - targetWeight) < Math.abs(prev - targetWeight) ? curr : prev
  );
}

function calculatePlateConfig(weight, barWeight, availablePlates) {
  if (weight <= barWeight) {
    return [];
  }

  const weightPerSide = (weight - barWeight) / 2;
  const sortedPlates = [...availablePlates]
    .filter((plate) => plate.available)
    .sort((a, b) => b.weight - a.weight)
    .map((plate) => plate.weight);

  const plateConfig = [];
  let remaining = weightPerSide;

  for (const plateWeight of sortedPlates) {
    const count = Math.floor(remaining / plateWeight);
    if (count > 0) {
      plateConfig.push({ weight: plateWeight, count });
      remaining -= count * plateWeight;
    }
  }

  return plateConfig;
}

function countPlateChanges(config1, config2) {
  const plateMap1 = new Map();
  const plateMap2 = new Map();

  for (const plate of config1) {
    plateMap1.set(plate.weight, plate.count);
  }
  for (const plate of config2) {
    plateMap2.set(plate.weight, plate.count);
  }

  let changes = 0;
  const allPlateWeights = new Set([...plateMap1.keys(), ...plateMap2.keys()]);

  for (const weight of allPlateWeights) {
    const count1 = plateMap1.get(weight) || 0;
    const count2 = plateMap2.get(weight) || 0;
    changes += Math.abs(count2 - count1);
  }

  return changes;
}

/**
 * Optimize plate changes between sets
 * @param {Array} sets - The workout sets
 * @param {number} barWeight - The weight of the bar
 * @param {Array} availablePlates - Available plate weights
 * @returns {Array} Sets with optimized plate configurations
 */
function optimizePlateChanges(sets, barWeight, availablePlates) {
  // Use the new global optimization approach
  return globalOptimizePlateChanges(sets, barWeight, availablePlates);
}

function calculateProgressivePlateConfig(
  currentSetWeight,
  prevSetWeight,
  prevPlateConfig,
  barWeight,
  availablePlates
) {
  // If moving to lower weight, or if no previous plates, calculate from scratch
  if (
    currentSetWeight <= prevSetWeight ||
    !prevPlateConfig ||
    prevPlateConfig.length === 0
  ) {
    return calculatePlateConfig(currentSetWeight, barWeight, availablePlates);
  }

  // Calculate how much weight per side we need to add
  const prevWeightPerSide = (prevSetWeight - barWeight) / 2;
  const currentWeightPerSide = (currentSetWeight - barWeight) / 2;
  const additionalWeightNeeded = currentWeightPerSide - prevWeightPerSide;

  // If no additional weight needed, keep the same config
  if (additionalWeightNeeded <= 0) {
    return [...prevPlateConfig];
  }

  // Convert previous plate config to a map for easy manipulation
  const plateMap = new Map();
  for (const plate of prevPlateConfig) {
    plateMap.set(plate.weight, plate.count);
  }

  // Get available plates sorted by weight (descending)
  const sortedAvailablePlates = [...availablePlates]
    .filter((plate) => plate.available)
    .sort((a, b) => b.weight - a.weight)
    .map((plate) => plate.weight);

  // Try to add plates to reach the additional weight needed
  let remainingWeight = additionalWeightNeeded;

  for (const plateWeight of sortedAvailablePlates) {
    if (plateWeight <= remainingWeight) {
      const count = Math.floor(remainingWeight / plateWeight);
      if (count > 0) {
        // Add to existing plate count or initialize
        const existingCount = plateMap.get(plateWeight) || 0;
        plateMap.set(plateWeight, existingCount + count);
        remainingWeight -= count * plateWeight;
      }
    }
  }

  // If we couldn't add plates efficiently to reach the exact weight,
  // check if a more efficient configuration exists from scratch
  if (remainingWeight > 0) {
    const fromScratchConfig = calculatePlateConfig(
      currentSetWeight,
      barWeight,
      availablePlates
    );
    const progressiveChanges = countPlateChanges(
      prevPlateConfig,
      plateMapToConfig(plateMap)
    );
    const fromScratchChanges = countPlateChanges(
      prevPlateConfig,
      fromScratchConfig
    );

    // Use from-scratch configuration if it requires fewer changes
    if (fromScratchChanges < progressiveChanges) {
      return fromScratchConfig;
    }
  }

  // Convert the plate map back to array format
  return plateMapToConfig(plateMap);
}

function plateMapToConfig(plateMap) {
  const config = [];
  plateMap.forEach((count, weight) => {
    config.push({ weight, count });
  });
  // Sort by weight descending to maintain order
  return config.sort((a, b) => b.weight - a.weight);
}

/**
 * Generate all possible plate configurations for a given weight
 * @param {number} weight - The weight to create configurations for
 * @param {number} barWeight - The weight of the bar
 * @param {Array} availablePlates - Available plate weights
 * @param {number} maxConfigurations - Maximum configurations to generate for each weight
 * @returns {Array} Array of possible plate configurations
 */
function generateAllPossiblePlateConfigs(
  weight,
  barWeight,
  availablePlates,
  maxConfigurations = 15
) {
  if (weight <= barWeight) {
    return [[]]; // If weight is less than or equal to bar weight, no plates needed
  }

  const weightPerSide = (weight - barWeight) / 2;
  const sortedPlates = [...availablePlates]
    .filter((plate) => plate.available)
    .map((plate) => plate.weight)
    .sort((a, b) => b - a); // Sort descending

  // Start with the standard greedy approach as the first configuration
  const standardConfig = generateStandardPlateConfig(
    weightPerSide,
    sortedPlates
  );
  const allConfigs = [standardConfig];

  // Use a recursive approach to find alternative configurations
  findAlternativeConfigs(
    weightPerSide,
    sortedPlates,
    [],
    0,
    allConfigs,
    maxConfigurations
  );

  // Convert to the right format and remove duplicates
  const formattedConfigs = allConfigs.map((config) => {
    const plateMap = new Map();
    for (const plate of config) {
      const count = plateMap.get(plate) || 0;
      plateMap.set(plate, count + 1);
    }

    return Array.from(plateMap.entries())
      .map(([weight, count]) => ({ weight, count }))
      .sort((a, b) => b.weight - a.weight);
  });

  // Filter out duplicates and configurations that don't add up to exactly the weight per side
  // Use a string representation for comparison
  const uniqueConfigs = [];
  const seen = new Set();

  for (const config of formattedConfigs) {
    const configWeight = config.reduce(
      (sum, plate) => sum + plate.weight * plate.count,
      0
    );
    if (Math.abs(configWeight - weightPerSide) < 0.01) {
      // Allow for small floating point differences
      const configStr = JSON.stringify(config);
      if (!seen.has(configStr)) {
        seen.add(configStr);
        uniqueConfigs.push(config);
      }
    }
  }

  return uniqueConfigs;
}

/**
 * Generate the standard greedy plate configuration
 * @param {number} weightPerSide - Weight per side of the bar
 * @param {Array} plates - Available plate weights (sorted descending)
 * @returns {Array} Array of plates used (not consolidated by weight)
 */
function generateStandardPlateConfig(weightPerSide, plates) {
  const result = [];
  let remaining = weightPerSide;

  for (const plateWeight of plates) {
    while (remaining >= plateWeight) {
      result.push(plateWeight);
      remaining -= plateWeight;
    }
  }

  return result;
}

/**
 * Find alternative plate configurations recursively
 * @param {number} targetWeight - Target weight per side
 * @param {Array} plates - Available plates
 * @param {Array} currentConfig - Current configuration being built
 * @param {number} currentWeight - Current weight of the configuration
 * @param {Array} allConfigs - Array to store all configurations
 * @param {number} maxConfigurations - Maximum number of configurations to generate
 * @param {number} maxDepth - Maximum recursion depth to prevent stack overflow
 */
function findAlternativeConfigs(
  targetWeight,
  plates,
  currentConfig,
  currentWeight,
  allConfigs,
  maxConfigurations,
  maxDepth = 10
) {
  // Base case: reached target weight
  if (Math.abs(currentWeight - targetWeight) < 0.01) {
    // Add this configuration if it's unique
    const configCopy = [...currentConfig].sort((a, b) => b - a);
    const configStr = JSON.stringify(configCopy);

    if (
      !allConfigs.some(
        (config) =>
          JSON.stringify([...config].sort((a, b) => b - a)) === configStr
      )
    ) {
      allConfigs.push(configCopy);
    }
    return;
  }

  // Stop if we've generated enough configurations or exceeded max depth
  if (
    allConfigs.length >= maxConfigurations ||
    currentConfig.length >= maxDepth
  ) {
    return;
  }

  // Stop if we've exceeded the target weight
  if (currentWeight > targetWeight) {
    return;
  }

  // Try adding each plate type
  for (let i = 0; i < plates.length; i++) {
    const plate = plates[i];

    // Skip if adding this plate would exceed target weight
    if (currentWeight + plate > targetWeight + 0.01) {
      continue;
    }

    // Add this plate and recurse
    currentConfig.push(plate);
    findAlternativeConfigs(
      targetWeight,
      plates,
      currentConfig,
      currentWeight + plate,
      allConfigs,
      maxConfigurations,
      maxDepth
    );
    currentConfig.pop(); // Backtrack
  }
}

/**
 * Find the globally optimized plate configuration for a sequence of sets
 * @param {Array} sets - The workout sets
 * @param {number} barWeight - The weight of the bar
 * @param {Array} availablePlates - Available plate weights
 * @returns {Array} Sets with optimized plate configurations
 */
function globalOptimizePlateChanges(sets, barWeight, availablePlates) {
  sets.sort((a, b) => a.weight - b.weight);
  if (sets.length <= 1) {
    // For a single set, just use the standard plate configuration
    sets[0].plateConfig = calculatePlateConfig(
      sets[0].weight,
      barWeight,
      availablePlates
    );
    return sets;
  }

  // Generate all possible configurations for each set weight
  const allPossibleConfigs = [];
  for (const set of sets) {
    const configs = generateAllPossiblePlateConfigs(
      set.weight,
      barWeight,
      availablePlates
    );
    allPossibleConfigs.push(configs);
  }

  // For the final set (working set), only use the optimal configuration with minimum plates
  const lastSetIndex = sets.length - 1;
  allPossibleConfigs[lastSetIndex] = [
    calculatePlateConfig(sets[lastSetIndex].weight, barWeight, availablePlates),
  ];

  // Use dynamic programming to find the optimal path
  // dp[i][j] = min cost to reach config j of set i
  // prev[i][j] = config index of set i-1 that leads to min cost
  const dp = [];
  const prev = [];

  // Initialize dp for the first set
  dp[0] = Array(allPossibleConfigs[0].length).fill(0);
  prev[0] = Array(allPossibleConfigs[0].length).fill(-1);

  // Fill dp table
  for (let i = 1; i < sets.length; i++) {
    dp[i] = [];
    prev[i] = [];

    for (let j = 0; j < allPossibleConfigs[i].length; j++) {
      let minCost = Number.POSITIVE_INFINITY;
      let minPrev = -1;

      // Try all configurations from the previous set
      for (let k = 0; k < allPossibleConfigs[i - 1].length; k++) {
        const changes = countPlateChanges(
          allPossibleConfigs[i - 1][k],
          allPossibleConfigs[i][j]
        );
        const totalCost = dp[i - 1][k] + changes;

        if (totalCost < minCost) {
          minCost = totalCost;
          minPrev = k;
        }
      }

      dp[i][j] = minCost;
      prev[i][j] = minPrev;
    }
  }

  // Find the minimum cost configuration for the last set
  let minCost = Number.POSITIVE_INFINITY;
  let minIndex = 0;

  // For the last set, we only have one configuration (the optimal one)
  minIndex = 0; // Since we've limited the last set to only have the optimal configuration
  minCost = dp[lastSetIndex][minIndex];

  // Reconstruct the optimal path
  const optimalConfigIndices = [];
  for (let i = lastSetIndex; i >= 0; i--) {
    optimalConfigIndices.unshift(minIndex);
    if (i > 0) {
      minIndex = prev[i][minIndex];
    }
  }

  // Apply the optimal configurations to the sets
  for (let i = 0; i < sets.length; i++) {
    sets[i].plateConfig = allPossibleConfigs[i][optimalConfigIndices[i]];

    // Calculate and store plate changes for each transition
    if (i > 0) {
      const changes = countPlateChanges(
        sets[i - 1].plateConfig,
        sets[i].plateConfig
      );
      sets[i].plateChanges = changes;
    } else {
      sets[i].plateChanges = 0; // No changes for the first set
    }
  }

  return sets;
}

export const formulaOptions = [
  { id: "percentageBased", name: "Percentage Based" },
  { id: "fixedIncrements", name: "Fixed Increments" },
  { id: "fiveThreeOne", name: "5/3/1 Style (3 Sets)" },
  { id: "weightedBodyweight", name: "Weighted Bodyweight" },
];

export const isConfigurableFormula = (formulaId) => {
  return (
    formulaId === "percentageBased" ||
    formulaId === "fixedIncrements" ||
    formulaId === "weightedBodyweight"
  );
};

export const getDefaultSets = (formulaId) => {
  switch (formulaId) {
    case "percentageBased":
      return 6;
    case "fixedIncrements":
      return 5;
    case "weightedBodyweight":
      return 5;
    default:
      return 0;
  }
};

export function getFormula(formulaId) {
  switch (formulaId) {
    case "percentageBased":
      return percentageBased;
    case "fixedIncrements":
      return fixedIncrements;
    case "fiveThreeOne":
      return fiveThreeOne;
    case "weightedBodyweight":
      return weightedBodyweight;
    default:
      return percentageBased;
  }
}
