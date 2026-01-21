/**
 * Interface for a weight/reps set in the rep max calculator
 */
export interface RepMaxSet {
  weight: string | number;
  reps: string | number;
  estimatedMax: number;
}

/**
 * Interface for rep range data
 */
export interface RepRangeData {
  reps: number;
  weight: number;
  percentage: number;
}

/**
 * Interface for rep max calculator Alpine component state
 */
export interface RepMaxCalculatorData {
  sets: RepMaxSet[];
  estimatedMax: number;
  repRangeData: RepRangeData[];
  errorMessage: string;
  calculationMethod: 'average' | 'highest' | 'lowest' | 'weighted';

  addSet(): void;
  removeSet(index: number): void;
  calculateSetMax(set: RepMaxSet): number;
  calculateAverageMax(): void;
  handleSetInput(): void;
  init(): void;
}

/**
 * Rep Max Calculator component
 * Using the Epley formula for reps ≤ 10: 1RM = w * (1 + r / 30)
 * Using the Brzycki formula for reps > 10: 1RM = w * (36 / (37 - r))
 */
export default function (): RepMaxCalculatorData {
  return {
    sets: [{ weight: '', reps: '', estimatedMax: 0 }],
    estimatedMax: 0,
    repRangeData: [],
    errorMessage: '',
    calculationMethod: 'average',

    addSet() {
      const lastSet = this.sets[this.sets.length - 1];
      const newSet: RepMaxSet = { weight: '', reps: '', estimatedMax: 0 };

      if (lastSet && lastSet.weight !== '' && lastSet.reps !== '') {
        newSet.weight = lastSet.weight;
        newSet.reps = lastSet.reps;
      }

      this.sets.push(newSet);
    },

    removeSet(index: number) {
      if (this.sets.length > 1) {
        this.sets.splice(index, 1);
        this.calculateAverageMax();
      }
    },

    calculateSetMax(set: RepMaxSet): number {
      const w = Number.parseFloat(String(set.weight));
      const r = Number.parseInt(String(set.reps));

      if (Number.isNaN(w) || w <= 0 || Number.isNaN(r) || r <= 0) {
        set.estimatedMax = 0;
        return 0;
      }

      if (r === 1) {
        set.estimatedMax = w;
      } else if (r > 30) {
        set.estimatedMax = 0;
        return 0;
      } else if (r <= 10) {
        // Epley formula for lower reps
        set.estimatedMax = Math.round(w * (1 + r / 30));
      } else {
        // Brzycki formula for higher reps
        set.estimatedMax = Math.round((w * 36) / (37 - r));
      }

      return set.estimatedMax;
    },

    calculateAverageMax() {
      this.errorMessage = '';

      const validSets = this.sets.filter((set) => {
        const w = Number.parseFloat(String(set.weight));
        const r = Number.parseInt(String(set.reps));

        if (Number.isNaN(w) || w <= 0 || Number.isNaN(r) || r <= 0) {
          return false;
        }

        if (r > 30) {
          this.errorMessage = 'Calculation is less reliable for reps > 30.';
          return false;
        }

        return true;
      });

      if (validSets.length === 0) {
        this.estimatedMax = 0;
        this.repRangeData = [];
        if (this.sets.some((set) => set.weight || set.reps)) {
          this.errorMessage =
            'Please enter valid positive numbers for weight and reps.';
        }
        return;
      }

      // Calculate 1RM for each valid set
      for (const set of validSets) {
        this.calculateSetMax(set);
      }

      // Calculate final 1RM based on selected method
      switch (this.calculationMethod) {
        case 'highest': {
          this.estimatedMax = Math.max(
            ...validSets.map((set) => set.estimatedMax)
          );
          break;
        }
        case 'lowest': {
          this.estimatedMax = Math.min(
            ...validSets.map((set) => set.estimatedMax)
          );
          break;
        }
        case 'weighted': {
          let totalWeight = 0;
          let weightedSum = 0;
          for (const set of validSets) {
            const weight = Number.parseFloat(String(set.weight));
            const reps = Number.parseInt(String(set.reps));
            const factor = weight * reps;
            weightedSum += set.estimatedMax * factor;
            totalWeight += factor;
          }
          this.estimatedMax = Math.round(weightedSum / totalWeight);
          break;
        }
        default: {
          const sumOfMaxes = validSets.reduce(
            (sum, set) => sum + set.estimatedMax,
            0
          );
          this.estimatedMax = Math.round(sumOfMaxes / validSets.length);
        }
      }

      // Calculate weights for rep ranges 1-15
      this.repRangeData = [];
      for (let reps = 1; reps <= 15; reps++) {
        let weightForReps: number;
        if (reps <= 10) {
          // Reverse Epley formula
          weightForReps = Math.round(this.estimatedMax / (1 + reps / 30));
        } else {
          // Reverse Brzycki formula
          weightForReps = Math.round(
            (this.estimatedMax * (37 - reps)) / 36
          );
        }

        const percentage = Math.round(
          (weightForReps / this.estimatedMax) * 100
        );

        this.repRangeData.push({
          reps,
          weight: weightForReps,
          percentage,
        });
      }
    },

    handleSetInput() {
      this.calculateAverageMax();
    },

    init() {
      this.calculationMethod =
        (localStorage.getItem('repMaxCalculationMethod') as any) || 'average';

      // @ts-ignore - Alpine's $watch is added by Alpine.js
      this.$watch('calculationMethod', (method: string) => {
        localStorage.setItem('repMaxCalculationMethod', method);
        this.calculateAverageMax();
      });
    },
  };
}
