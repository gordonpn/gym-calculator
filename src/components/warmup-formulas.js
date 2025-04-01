export function percentageBased(targetWeight) {
  return [
    { percentage: 40, weight: Math.round(targetWeight * 0.4), reps: 10 },
    { percentage: 50, weight: Math.round(targetWeight * 0.5), reps: 8 },
    { percentage: 60, weight: Math.round(targetWeight * 0.6), reps: 6 },
    { percentage: 70, weight: Math.round(targetWeight * 0.7), reps: 5 },
    { percentage: 80, weight: Math.round(targetWeight * 0.8), reps: 3 },
    { percentage: 90, weight: Math.round(targetWeight * 0.9), reps: 2 },
  ];
}

export function fixedIncrements(targetWeight) {
  const barWeight = 45;
  const result = [];
  const steps = 5;
  const increment = (targetWeight - barWeight) / steps;

  for (let i = 0; i <= steps; i++) {
    const weight = Math.round(barWeight + increment * i);
    if (weight <= targetWeight) {
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
  { id: "percentageBased", name: "Standard Warm-up (6 Sets)" },
  { id: "fixedIncrements", name: "Fixed Increments (6 Sets)" },
  { id: "fiveThreeOne", name: "5/3/1 Style (3 Sets)" },
];

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
