import { roundToNearest5 } from './util';

/**
 * Interface for strength standard
 */
export interface StrengthStandard {
  level: string;
  multiple: number;
}

/**
 * Interface for lift option
 */
export interface LiftOption {
  id: string;
  name: string;
}

/**
 * Interface for strength set (weight/reps)
 */
export interface StrengthSet {
  weight: string | number;
  reps: string | number;
  estimatedMax: number;
}

/**
 * Interface for strength result
 */
export interface StrengthResult {
  level: string;
  ratio: number;
  ratioDisplay: string;
  nextLevel: string | null;
  nextMultiple: number | null;
  nextWeight: number | null;
}

/**
 * Interface for strength standards object
 */
export interface StrengthStandardsMap {
  [liftId: string]: StrengthStandard[];
}

/**
 * Interface for the strength level calculator Alpine component state
 */
export interface StrengthLevelCalculatorData {
  lifts: LiftOption[];
  standards: StrengthStandardsMap;
  sets: StrengthSet[];
  bodyweight: string | number;
  selectedLift: string;
  calculationMethod: 'average' | 'highest' | 'lowest' | 'weighted';
  estimatedMax: number;
  strengthResult: StrengthResult | null;
  errorMessage: string;

  addSet(): void;
  removeSet(index: number): void;
  calculateSetMax(set: StrengthSet): number;
  calculateStrength(): void;
  evaluateStrengthLevel(): void;
  handleSetInput(): void;
  saveSettings(): void;
  init(): void;
}

/**
 * Strength standards for various lifts
 */
const strengthStandards: StrengthStandardsMap = {
  squat: [
    { level: 'Untrained', multiple: 0.75 },
    { level: 'Novice', multiple: 1.25 },
    { level: 'Intermediate', multiple: 1.75 },
    { level: 'Advanced', multiple: 2.25 },
    { level: 'Elite', multiple: 2.75 },
  ],
  benchPress: [
    { level: 'Untrained', multiple: 0.5 },
    { level: 'Novice', multiple: 0.75 },
    { level: 'Intermediate', multiple: 1.25 },
    { level: 'Advanced', multiple: 1.75 },
    { level: 'Elite', multiple: 2.25 },
  ],
  bentOverRow: [
    { level: 'Untrained', multiple: 0.5 },
    { level: 'Novice', multiple: 0.75 },
    { level: 'Intermediate', multiple: 1.25 },
    { level: 'Advanced', multiple: 1.75 },
    { level: 'Elite', multiple: 2.25 },
  ],
  deadlift: [
    { level: 'Untrained', multiple: 1.0 },
    { level: 'Novice', multiple: 1.5 },
    { level: 'Intermediate', multiple: 2.25 },
    { level: 'Advanced', multiple: 3.0 },
    { level: 'Elite', multiple: 3.75 },
  ],
  overheadPress: [
    { level: 'Untrained', multiple: 0.35 },
    { level: 'Novice', multiple: 0.5 },
    { level: 'Intermediate', multiple: 0.75 },
    { level: 'Advanced', multiple: 1.1 },
    { level: 'Elite', multiple: 1.5 },
  ],
  barbellLunge: [
    { level: 'Untrained', multiple: 0.4 },
    { level: 'Novice', multiple: 0.6 },
    { level: 'Intermediate', multiple: 1.0 },
    { level: 'Advanced', multiple: 1.4 },
    { level: 'Elite', multiple: 1.8 },
  ],
  dip: [
    { level: 'Untrained', multiple: 0.25 },
    { level: 'Novice', multiple: 0.5 },
    { level: 'Intermediate', multiple: 1.0 },
    { level: 'Advanced', multiple: 1.5 },
    { level: 'Elite', multiple: 2.0 },
  ],
  romanianDeadlift: [
    { level: 'Untrained', multiple: 0.75 },
    { level: 'Novice', multiple: 1.25 },
    { level: 'Intermediate', multiple: 1.75 },
    { level: 'Advanced', multiple: 2.25 },
    { level: 'Elite', multiple: 2.75 },
  ],
};

/**
 * Strength Level Calculator component
 */
export default function (): StrengthLevelCalculatorData {
  return {
    lifts: [
      { id: 'squat', name: 'Back Squat' },
      { id: 'benchPress', name: 'Bench Press' },
      { id: 'bentOverRow', name: 'Bent Over Barbell Row' },
      { id: 'deadlift', name: 'Deadlift' },
      { id: 'overheadPress', name: 'Overhead Press' },
      { id: 'barbellLunge', name: 'Barbell Lunge' },
      { id: 'dip', name: 'Dip' },
      { id: 'romanianDeadlift', name: 'Romanian Deadlift' },
    ],
    standards: strengthStandards,
    sets: [{ weight: '', reps: '', estimatedMax: 0 }],
    bodyweight: '',
    selectedLift: 'squat',
    calculationMethod: 'average',
    estimatedMax: 0,
    strengthResult: null,
    errorMessage: '',

    addSet() {
      const lastSet = this.sets[this.sets.length - 1];
      const newSet: StrengthSet = { weight: '', reps: '', estimatedMax: 0 };

      if (lastSet && lastSet.weight !== '' && lastSet.reps !== '') {
        newSet.weight = lastSet.weight;
        newSet.reps = lastSet.reps;
      }

      this.sets.push(newSet);
    },

    removeSet(index: number) {
      if (this.sets.length > 1) {
        this.sets.splice(index, 1);
        this.calculateStrength();
      }
    },

    calculateSetMax(set: StrengthSet): number {
      const w = Number.parseFloat(String(set.weight));
      const r = Number.parseInt(String(set.reps));

      if (Number.isNaN(w) || w <= 0 || Number.isNaN(r) || r <= 0) {
        set.estimatedMax = 0;
        return 0;
      }

      if (r === 1) {
        set.estimatedMax = Math.round(w);
      } else if (r > 30) {
        set.estimatedMax = 0;
        return 0;
      } else if (r <= 10) {
        set.estimatedMax = Math.round(w * (1 + r / 30));
      } else {
        set.estimatedMax = Math.round((w * 36) / (37 - r));
      }

      return set.estimatedMax;
    },

    calculateStrength() {
      this.errorMessage = '';

      const validSets = this.sets.filter((set) => {
        const w = Number.parseFloat(String(set.weight));
        const r = Number.parseInt(String(set.reps));

        if (Number.isNaN(w) || w <= 0 || Number.isNaN(r) || r <= 0) {
          return false;
        }

        if (r > 30) {
          if (!this.errorMessage) {
            this.errorMessage = 'Calculation is less reliable for reps > 30.';
          }
          return false;
        }

        return true;
      });

      if (validSets.length === 0) {
        this.estimatedMax = 0;
        this.strengthResult = null;
        if (this.sets.some((set) => set.weight || set.reps)) {
          if (!this.errorMessage) {
            this.errorMessage = 'Enter positive weight and reps to calculate a 1RM.';
          }
        }
        return;
      }

      for (const set of validSets) {
        this.calculateSetMax(set);
      }

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

      this.evaluateStrengthLevel();
    },

    evaluateStrengthLevel() {
      const bw = Number.parseFloat(String(this.bodyweight));

      if (
        Number.isNaN(bw) ||
        bw <= 0 ||
        this.estimatedMax <= 0
      ) {
        this.strengthResult = null;
        if (this.estimatedMax > 0 && !this.errorMessage) {
          this.errorMessage = 'Enter a valid bodyweight to see your strength level.';
        }
        return;
      }

      const standardsForLift = this.standards[this.selectedLift] || [];
      const ratio = this.estimatedMax / bw;

      let currentLevel: StrengthStandard = {
        level: 'Below untrained',
        multiple: 0,
      };

      for (const standard of standardsForLift) {
        if (ratio >= standard.multiple) {
          currentLevel = standard;
        }
      }

      const nextLevel = standardsForLift.find(
        (standard) => standard.multiple > ratio
      );

      this.strengthResult = {
        level: currentLevel.level,
        ratio,
        ratioDisplay: ratio.toFixed(2),
        nextLevel: nextLevel ? nextLevel.level : null,
        nextMultiple: nextLevel ? nextLevel.multiple : null,
        nextWeight: nextLevel ? roundToNearest5(nextLevel.multiple * bw) : null,
      };
    },

    handleSetInput() {
      this.calculateStrength();
    },

    saveSettings() {
      localStorage.setItem(
        'strengthLevelSettings',
        JSON.stringify({
          bodyweight: this.bodyweight,
          selectedLift: this.selectedLift,
          calculationMethod: this.calculationMethod,
        })
      );
    },

    init() {
      const saved = localStorage.getItem('strengthLevelSettings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.bodyweight) {
            this.bodyweight = String(parsed.bodyweight);
          }
          if (parsed.selectedLift) {
            this.selectedLift = parsed.selectedLift;
          }
          if (parsed.calculationMethod) {
            this.calculationMethod = parsed.calculationMethod;
          }
        } catch (err) {
          console.error('Could not parse strength level settings', err);
        }
      }

      // @ts-ignore - Alpine's $watch is added by Alpine.js
      this.$watch('bodyweight', () => this.saveSettings());
      // @ts-ignore
      this.$watch('selectedLift', () => this.saveSettings());
      // @ts-ignore
      this.$watch('calculationMethod', () => this.saveSettings());

      this.calculateStrength();
    },
  };
}
