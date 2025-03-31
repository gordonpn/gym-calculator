// Simple percentage-based warm-up
export function percentageBased(targetWeight) {
    return [
      { percentage: 40, weight: Math.round(targetWeight * 0.4) },
      { percentage: 50, weight: Math.round(targetWeight * 0.5) },
      { percentage: 60, weight: Math.round(targetWeight * 0.6) },
      { percentage: 70, weight: Math.round(targetWeight * 0.7) },
      { percentage: 80, weight: Math.round(targetWeight * 0.8) },
      { percentage: 90, weight: Math.round(targetWeight * 0.9) },
    ];
  }
  
  // Starting Bar + Fixed increments
  export function fixedIncrements(targetWeight) {
    const barWeight = 45; // Standard Olympic bar
    const result = [];
    const steps = 5;
    const increment = (targetWeight - barWeight) / steps;
    
    for (let i = 0; i <= steps; i++) {
      const weight = Math.round(barWeight + (increment * i));
      if (weight <= targetWeight) {
        result.push({
          percentage: Math.round((weight / targetWeight) * 100),
          weight: weight
        });
      }
    }
    
    return result;
  }
  
  // 5/3/1 style warm-up
  export function fiveThreeOne(targetWeight) {
    return [
      { percentage: 40, weight: Math.round(targetWeight * 0.4) },
      { percentage: 50, weight: Math.round(targetWeight * 0.5) },
      { percentage: 60, weight: Math.round(targetWeight * 0.6) },
    ];
  }
  
  // Available formulas with display names
  export const formulaOptions = [
    { id: 'percentageBased', name: 'Percentage Based (40-90%)' },
    { id: 'fixedIncrements', name: 'Fixed Increments' },
    { id: 'fiveThreeOne', name: '5/3/1 Style' }
  ];
  
  // Formula selector function
  export function getFormula(formulaId) {
    switch(formulaId) {
      case 'percentageBased': return percentageBased;
      case 'fixedIncrements': return fixedIncrements;
      case 'fiveThreeOne': return fiveThreeOne;
      default: return percentageBased;
    }
  }