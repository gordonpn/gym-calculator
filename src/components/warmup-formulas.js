export function percentageBased(targetWeight, numSets = 6) {
  const sets = [];
  const minPercentage = 40;
  const maxPercentage = 90;
  const percentageRange = maxPercentage - minPercentage;
  
  for (let i = 0; i < numSets; i++) {
    const percentage = Math.round(minPercentage + (percentageRange * i) / (numSets - 1));
    const weight = Math.round(targetWeight * (percentage / 100));
    
    let reps;
    if (percentage <= 50) reps = 10;
    else if (percentage <= 60) reps = 8;
    else if (percentage <= 70) reps = 6;
    else if (percentage <= 80) reps = 5;
    else if (percentage <= 85) reps = 3;
    else reps = 2;
    
    sets.push({ percentage, weight, reps });
  }
  
  return sets;
}

export function fixedIncrements(targetWeight, numSets = 5) {
  const barWeight = 45;
  const result = [];
  const increment = (targetWeight - barWeight) / (numSets + 1);

  for (let i = 0; i < numSets; i++) {
    const weight = Math.round(barWeight + increment * (i + 1));
    if (weight < targetWeight) {
      const percentage = Math.round((weight / targetWeight) * 100);

      let reps;
      if (percentage <= 50) reps = 8;
      else if (percentage <= 70) reps = 5;
      else if (percentage <= 85) reps = 3;
      else reps = 2;

      result.push({
        percentage: percentage,
        weight: weight,
        reps: reps,
      });
    }
  }

  return result;
}

export function fiveThreeOne(targetWeight) {
  return [
    { percentage: 40, weight: Math.round(targetWeight * 0.4), reps: 10 },
    { percentage: 50, weight: Math.round(targetWeight * 0.5), reps: 5 },
    { percentage: 60, weight: Math.round(targetWeight * 0.6), reps: 3 },
  ];
}

export const formulaOptions = [
  { id: "percentageBased", name: "Standard Warm-up" },
  { id: "fixedIncrements", name: "Fixed Increments" },
  { id: "fiveThreeOne", name: "5/3/1 Style (3 Sets)" },
];

export const isConfigurableFormula = (formulaId) => {
  return formulaId === 'percentageBased' || formulaId === 'fixedIncrements';
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
