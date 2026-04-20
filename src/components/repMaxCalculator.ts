import {
  aggregateOneRepMax,
  estimateOneRepMax,
  isReliableOneRepMaxReps,
  isValidOneRepMaxSet,
  parseSetReps,
  parseSetWeight,
} from './oneRepMax';

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
  parentIsWeightedBodyweight: boolean;
  parentBodyweight: string | number;

  addSet(): void;
  removeSet(index: number): void;
  calculateSetMax(set: RepMaxSet): number;
  calculateAverageMax(): void;
  handleSetInput(): void;
  getBodyweightValue(): number;
  getEnteredWeight(set: RepMaxSet): number;
  getEffectiveSetWeight(set: RepMaxSet): number;
  isValidSet(set: RepMaxSet): boolean;
  syncBodyweightContext(
    isWeightedBodyweight: boolean,
    bodyweight: string | number,
  ): void;
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
    parentIsWeightedBodyweight: false,
    parentBodyweight: '',

    syncBodyweightContext(isWeightedBodyweight, bodyweight) {
      this.parentIsWeightedBodyweight = isWeightedBodyweight;
      this.parentBodyweight = bodyweight;

      this.calculateAverageMax();
    },

    getBodyweightValue(): number {
      const bodyweight = Number.parseFloat(String(this.parentBodyweight));
      return Number.isFinite(bodyweight) && bodyweight > 0 ? bodyweight : 0;
    },

    getEnteredWeight(set: RepMaxSet): number {
      return parseSetWeight(set.weight);
    },

    getEffectiveSetWeight(set: RepMaxSet): number {
      const enteredWeight = this.getEnteredWeight(set);
      const bodyweight = this.getBodyweightValue();

      if (this.parentIsWeightedBodyweight) {
        return enteredWeight + bodyweight;
      }

      return enteredWeight;
    },

    isValidSet(set: RepMaxSet): boolean {
      const enteredWeight = this.getEnteredWeight(set);
      const reps = parseSetReps(set.reps);

      if (this.parentIsWeightedBodyweight) {
        return (
          this.getBodyweightValue() > 0 &&
          isValidOneRepMaxSet(enteredWeight, reps, { allowZeroWeight: true })
        );
      }

      return isValidOneRepMaxSet(enteredWeight, reps);
    },

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
      const w = this.getEffectiveSetWeight(set);
      const r = parseSetReps(set.reps);

      set.estimatedMax = estimateOneRepMax(w, r);

      return set.estimatedMax;
    },

    calculateAverageMax() {
      this.errorMessage = '';

      const validSets = this.sets.filter((set) => {
        const r = parseSetReps(set.reps);

        if (!this.isValidSet(set)) {
          return false;
        }

        if (!isReliableOneRepMaxReps(r)) {
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

      const setMaxes = validSets.map((set) => set.estimatedMax);
      const weightedFactors = validSets.map((set) => {
        const weight = this.getEffectiveSetWeight(set);
        const reps = parseSetReps(set.reps);
        return weight * reps;
      });

      this.estimatedMax = aggregateOneRepMax(
        setMaxes,
        this.calculationMethod,
        weightedFactors
      );

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

      this.calculateAverageMax();
    },
  };
}
