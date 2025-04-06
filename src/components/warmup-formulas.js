export function percentageBased(
  targetWeight,
  numSets = 6,
  barWeight = 45,
  availablePlates = [],
  minimizePlateChanges = false
) {
  const sets = [];
  const minPercentage = 40;
  const maxPercentage = 90;
  const percentageRange = maxPercentage - minPercentage;

  const idealWeights = [];
  for (let i = 0; i < numSets; i++) {
    const percentage = Math.round(
      minPercentage + (percentageRange * i) / (numSets - 1)
    );
    const idealWeight = Math.round(targetWeight * (percentage / 100));
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
      });
    }

    return optimizePlateChanges(sets, barWeight, availablePlates);
  } else {
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
      });
    }

    return sets.sort((a, b) => a.weight - b.weight);
  }
}

export function fixedIncrements(
  targetWeight,
  numSets = 5,
  barWeight = 45,
  availablePlates = [],
  minimizePlateChanges = false
) {
  const idealWeights = [];
  const increment = (targetWeight - barWeight) / (numSets + 1);

  for (let i = 0; i < numSets; i++) {
    const weight = Math.round(barWeight + increment * (i + 1));
    if (weight < targetWeight) {
      const percentage = Math.round((weight / targetWeight) * 100);
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
      });
    }

    return optimizePlateChanges(sets, barWeight, availablePlates);
  } else {
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
      });
    }

    return sets.sort((a, b) => a.weight - b.weight);
  }
}

export function fiveThreeOne(
  targetWeight,
  _,
  barWeight = 45,
  availablePlates = [],
  minimizePlateChanges = false
) {
  const idealWeights = [
    { percentage: 40, idealWeight: Math.round(targetWeight * 0.4) },
    { percentage: 50, idealWeight: Math.round(targetWeight * 0.5) },
    { percentage: 60, idealWeight: Math.round(targetWeight * 0.6) },
  ];

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
      });
    }

    return optimizePlateChanges(sets, barWeight, availablePlates);
  } else {
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
      });
    }

    return sets.sort((a, b) => a.weight - b.weight);
  }
}

function generatePossibleWeights(barWeight, targetWeight, availablePlates) {
  const weights = new Set([barWeight]);

  const plates = availablePlates
    .filter((plate) => plate.available)
    .map((plate) => plate.weight)
    .sort((a, b) => a - b);

  let queue = [barWeight];
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

  config1.forEach((plate) => plateMap1.set(plate.weight, plate.count));
  config2.forEach((plate) => plateMap2.set(plate.weight, plate.count));

  let changes = 0;
  const allPlateWeights = new Set([...plateMap1.keys(), ...plateMap2.keys()]);

  allPlateWeights.forEach((weight) => {
    const count1 = plateMap1.get(weight) || 0;
    const count2 = plateMap2.get(weight) || 0;
    changes += Math.abs(count2 - count1);
  });

  return changes;
}

function optimizePlateChanges(sets, barWeight, availablePlates) {
  sets.sort((a, b) => a.weight - b.weight);

  if (sets.length <= 2) return sets;

  for (const set of sets) {
    set.plateConfig = calculatePlateConfig(
      set.weight,
      barWeight,
      availablePlates
    );
  }

  const hasValidPlateConfigs = sets.some((set) => set.plateConfig.length > 0);

  if (!hasValidPlateConfigs) {
    sets.forEach((set) => delete set.plateConfig);
    return sets;
  }

  let totalChanges = 0;
  for (let i = 1; i < sets.length; i++) {
    const prevConfig = sets[i - 1].plateConfig;
    const currConfig = sets[i].plateConfig;
    const changes = countPlateChanges(prevConfig, currConfig);
    sets[i].plateChanges = changes;
    totalChanges += changes;
  }

  return sets;
}

export const formulaOptions = [
  { id: "percentageBased", name: "Percentage Based" },
  { id: "fixedIncrements", name: "Fixed Increments" },
  { id: "fiveThreeOne", name: "5/3/1 Style (3 Sets)" },
];

export const isConfigurableFormula = (formulaId) => {
  return formulaId === "percentageBased" || formulaId === "fixedIncrements";
};

export const getDefaultSets = (formulaId) => {
  switch (formulaId) {
    case "percentageBased":
      return 6;
    case "fixedIncrements":
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
    default:
      return percentageBased;
  }
}
