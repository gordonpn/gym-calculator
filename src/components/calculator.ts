import {
  type Plate,
  debounce,
  roundToNearest5,
  roundToNearestAchievableWeight,
  roundToSmallestPlate,
} from "./util";
import {
  type PlateCalculation,
  type WarmupSet,
  formulaOptions,
  generatePossibleWeights,
  getDefaultSets,
  getFormula,
  isConfigurableFormula,
} from "./warmup-formulas";

type SessionTiming = "pre" | "post" | "";
type EquipmentType = "barbell" | "dumbbell" | "weightedBodyweight" | "";

/**
 * Interface for the calculator Alpine component state
 */
export interface CalculatorData {
  sessionTiming: SessionTiming;
  equipmentType: EquipmentType;
  numWarmupSets: number;
  targetWeight: string | number;
  roundedTargetWeight: number;
  selectedFormula: string;
  warmupSets: WarmupSet[];
  formulaOptions: typeof formulaOptions;
  lastRegularFormula: string;
  showSetsSelector: boolean;
  minimizePlateChanges: boolean;
  isWeightedBodyweight: boolean;
  bodyweight: string | number;
  showBodyweightInput: boolean;
  enableBackoff: boolean;
  backoffPercentage: number;
  barWeight: number;
  barWeightOptions: number[];
  availablePlates: Plate[];
  debouncedCalculate?: () => void;

  hasJourneySelection(): boolean;
  getAutoFormulaForJourney(): string;
  applyJourneySelection(shouldPersist?: boolean): void;
  calculate(): void;
  onFormulaChange(): void;
  calculatePlatesNeeded(
    targetWeight: number,
    options?: { minPlateWeight?: number },
  ): PlateCalculation;
  createBackoffSet(targetWeight: number, bodyweight?: number): WarmupSet;
  saveSettings(): void;
  savePlateSettings(): void;
  getPlateColor(weight: number | string): string;
  getSelectableFormulaOptions(): typeof formulaOptions;
  incrementWeight(direction: 1 | -1): void;
  init(): void;
}

/**
 * Calculator component
 */
export default function (): CalculatorData {
  return {
    sessionTiming: "",
    equipmentType: "",
    numWarmupSets: 6,
    targetWeight: "",
    roundedTargetWeight: 0,
    selectedFormula: "percentageBased",
    warmupSets: [],
    formulaOptions,
    lastRegularFormula: "percentageBased",
    showSetsSelector: true,
    minimizePlateChanges: false,
    isWeightedBodyweight: false,
    bodyweight: "",
    showBodyweightInput: false,
    enableBackoff: false,
    backoffPercentage: 80,
    barWeight: 45,
    barWeightOptions: Array.from({ length: 10 }, (_value, index) => index * 5),
    availablePlates: [
      { weight: 55, available: false },
      { weight: 45, available: true },
      { weight: 35, available: true },
      { weight: 25, available: true },
      { weight: 15, available: true },
      { weight: 10, available: true },
      { weight: 5, available: true },
      { weight: 2.5, available: true },
      { weight: 1, available: true },
      { weight: 0.75, available: true },
      { weight: 0.5, available: true },
      { weight: 0.25, available: true },
    ],

    hasJourneySelection() {
      return !!this.sessionTiming && !!this.equipmentType;
    },

    getAutoFormulaForJourney() {
      if (this.equipmentType === "weightedBodyweight") {
        return "weightedBodyweight";
      }

      if (this.equipmentType === "dumbbell") {
        return this.sessionTiming === "post"
          ? "dumbbellPostClimbing"
          : "dumbbellPreClimbing";
      }

      if (this.sessionTiming === "post") {
        return "standardPyramid";
      }

      return "percentageBased";
    },

    applyJourneySelection(shouldPersist = true) {
      this.isWeightedBodyweight = this.equipmentType === "weightedBodyweight";
      this.showBodyweightInput = this.isWeightedBodyweight;

      if (this.equipmentType !== "barbell") {
        this.minimizePlateChanges = false;
      }

      if (
        this.isWeightedBodyweight &&
        (!this.bodyweight || Number(this.bodyweight) <= 0)
      ) {
        this.bodyweight = "150";
      }

      if (this.hasJourneySelection()) {
        this.selectedFormula = this.getAutoFormulaForJourney();

        if (this.selectedFormula !== "weightedBodyweight") {
          this.lastRegularFormula = this.selectedFormula;
        }

        this.numWarmupSets = getDefaultSets(this.selectedFormula);
        this.showSetsSelector = isConfigurableFormula(this.selectedFormula);
      } else {
        this.warmupSets = [];
        this.roundedTargetWeight = 0;
      }

      if (shouldPersist) {
        this.saveSettings();
      }

      this.debouncedCalculate?.();
    },

    calculate() {
      if (!this.hasJourneySelection()) {
        this.warmupSets = [];
        this.roundedTargetWeight = 0;
        return;
      }

      const weight = Number.parseFloat(String(this.targetWeight));
      const bodyweight = this.isWeightedBodyweight
        ? Number.parseFloat(String(this.bodyweight))
        : 0;

      // For weighted bodyweight, validate that bodyweight is entered
      if (
        this.isWeightedBodyweight &&
        (!bodyweight || Number.isNaN(bodyweight) || bodyweight <= 0)
      ) {
        this.warmupSets = [];
        this.roundedTargetWeight = 0;
        return;
      }

      // For weighted bodyweight, we work with added weight, so it can be zero
      // For regular exercises, weight must be positive
      const validWeight = this.isWeightedBodyweight
        ? !Number.isNaN(weight)
        : !Number.isNaN(weight) && weight > 0;

      if (validWeight) {
        const useMinimizePlateChanges =
          this.equipmentType === "barbell" && this.minimizePlateChanges;

        // Calculate the rounded weight for display purposes only
        let roundedWeight = Number(weight);
        if (this.equipmentType === "dumbbell") {
          roundedWeight = roundToNearest5(Number(weight));
        } else if (!this.isWeightedBodyweight) {
          try {
            const rounded = roundToNearestAchievableWeight(
              Number(weight),
              Number(this.barWeight),
              this.availablePlates,
              false,
            );
            roundedWeight = Number(rounded);
          } catch (e) {
            console.error("Error rounding weight:", e);
            roundedWeight = Number(weight);
          }
        }
        this.roundedTargetWeight = roundedWeight;

        const formula = getFormula(this.selectedFormula);
        const actualTargetWeight = this.isWeightedBodyweight
          ? Number(bodyweight) + Number(weight)
          : weight;

        if (isConfigurableFormula(this.selectedFormula)) {
          this.warmupSets = formula(
            actualTargetWeight,
            this.numWarmupSets,
            this.barWeight,
            this.availablePlates,
            useMinimizePlateChanges,
            this.isWeightedBodyweight,
            bodyweight,
          );
        } else {
          this.warmupSets = formula(
            actualTargetWeight,
            undefined,
            this.barWeight,
            this.availablePlates,
            useMinimizePlateChanges,
            this.isWeightedBodyweight,
            bodyweight,
          );
        }

        if (this.warmupSets.length > 0) {
          if (this.equipmentType === "weightedBodyweight") {
            const firstSet = this.warmupSets[0];
            const hasBodyweightOnlySet =
              typeof firstSet.addedWeight === "number"
                ? firstSet.addedWeight <= 0
                : firstSet.weight <= bodyweight;

            if (!hasBodyweightOnlySet && bodyweight > 0) {
              this.warmupSets.unshift({
                percentage: Math.round((bodyweight / actualTargetWeight) * 100),
                weight: bodyweight,
                reps: 12,
                addedWeight: 0,
              });
            }
          } else if (
            this.equipmentType === "barbell" &&
            this.warmupSets[0].weight > this.barWeight
          ) {
            this.warmupSets.unshift({
              percentage: Math.round(
                (this.barWeight / actualTargetWeight) * 100,
              ),
              weight: this.barWeight,
              reps: 12,
            });
          }
        }

        const applyWarmupRounding = (set: WarmupSet): WarmupSet => {
          if (this.isWeightedBodyweight) {
            if (typeof set.addedWeight === "number") {
              const roundedAdded = Math.max(
                0,
                roundToNearest5(set.addedWeight),
              );
              set.addedWeight = roundedAdded;
              set.weight = Number(bodyweight) + roundedAdded;
            } else if (typeof set.weight === "number") {
              set.weight = Math.max(Number(bodyweight), set.weight);
            }
          } else if (typeof set.weight === "number") {
            if (this.equipmentType === "dumbbell") {
              set.weight = Math.max(0, roundToNearest5(set.weight));
            } else if (set.weight <= this.barWeight) {
              set.weight = this.barWeight;
            } else {
              const perSideLoad = (set.weight - this.barWeight) / 2;
              const roundedPerSide = Math.round(perSideLoad / 5) * 5;
              const roundedWeight = this.barWeight + roundedPerSide * 2;
              set.weight = Math.max(this.barWeight, roundedWeight);
            }
          }

          if (typeof set.idealWeight === "number") {
            set.idealWeight = set.weight;
          }

          return set;
        };

        this.warmupSets = this.warmupSets.map((set) =>
          applyWarmupRounding(set),
        );

        for (const set of this.warmupSets) {
          if (this.isWeightedBodyweight) {
            const addedWeight = Math.max(0, set.addedWeight || 0);
            if (addedWeight > 0) {
              set.plates = this.calculatePlatesNeeded(addedWeight, {
                minPlateWeight: 5,
              });
            } else {
              set.plates = {
                plateConfig: [],
                remaining: 0,
                actualWeight: 0,
              };
            }
          } else if (this.equipmentType === "dumbbell") {
            set.plates = {
              plateConfig: [],
              remaining: 0,
              actualWeight: set.weight,
            };
          } else {
            set.plates = this.calculatePlatesNeeded(set.weight, {
              minPlateWeight: 5,
            });
          }

          if (!useMinimizePlateChanges && set.plates.adjustedTargetWeight) {
            if (this.isWeightedBodyweight) {
              set.addedWeight = set.plates.adjustedTargetWeight;
              set.weight = Number(bodyweight) + Number(set.addedWeight);
            } else {
              set.weight = set.plates.adjustedTargetWeight;
            }
          }
        }

        // Add backoff sets if enabled
        if (this.enableBackoff && this.warmupSets.length > 0) {
          const backoffSet = this.createBackoffSet(
            actualTargetWeight,
            bodyweight,
          );
          this.warmupSets.push(backoffSet);
        }
      } else {
        this.warmupSets = [];
        this.roundedTargetWeight = 0;
      }
    },

    onFormulaChange() {
      this.applyJourneySelection();
    },

    getSelectableFormulaOptions() {
      if (this.isWeightedBodyweight) {
        return this.formulaOptions.filter(
          (option) => option.id === "weightedBodyweight",
        );
      }

      return this.formulaOptions.filter(
        (option) => option.id !== "weightedBodyweight",
      );
    },

    calculatePlatesNeeded(
      targetWeight: number,
      options: { minPlateWeight?: number } = {},
    ): PlateCalculation {
      const useMinimizePlateChanges =
        this.equipmentType === "barbell" && this.minimizePlateChanges;
      const { minPlateWeight = 0 } = options;
      const isForBodyweightExercise =
        this.isWeightedBodyweight && targetWeight > 0;
      const effectiveBarWeight = isForBodyweightExercise ? 0 : this.barWeight;

      if (targetWeight <= effectiveBarWeight) {
        return {
          plateConfig: [],
          remaining: 0,
          actualWeight: effectiveBarWeight,
        };
      }

      const weightToAdd = isForBodyweightExercise
        ? targetWeight
        : (targetWeight - this.barWeight) / 2;

      const filteredPlates = this.availablePlates.filter(
        (plate) => plate.available && plate.weight >= Number(minPlateWeight),
      );

      let remaining = weightToAdd;
      const plateConfig: Array<{ weight: number; count: number }> = [];

      for (const plate of filteredPlates) {
        const count = Math.floor(remaining / plate.weight);

        if (count > 0) {
          plateConfig.push({
            weight: plate.weight,
            count: count,
          });
          remaining -= count * plate.weight;
        }
      }

      const actualPlateWeight =
        plateConfig.reduce(
          (sum, plate) => sum + plate.weight * plate.count,
          0,
        ) * (isForBodyweightExercise ? 1 : 2);

      const actualWeight = isForBodyweightExercise
        ? actualPlateWeight
        : Number.parseFloat(String(this.barWeight)) + actualPlateWeight;

      if (!useMinimizePlateChanges && remaining > 0) {
        return {
          plateConfig,
          remaining: 0,
          actualWeight: actualWeight,
          adjustedTargetWeight: actualWeight,
        };
      }

      return {
        plateConfig,
        remaining,
        actualWeight,
      };
    },

    createBackoffSet(targetWeight: number, bodyweight = 0): WarmupSet {
      const backoffPercentage = this.backoffPercentage / 100;

      let backoffWeight: number;
      if (this.isWeightedBodyweight) {
        const addedWeight = targetWeight - bodyweight;
        const backoffAdded = addedWeight * backoffPercentage;
        backoffWeight = bodyweight + backoffAdded;
      } else {
        backoffWeight = targetWeight * backoffPercentage;
      }

      const applyRounding = (set: WarmupSet): WarmupSet => {
        if (this.isWeightedBodyweight) {
          if (typeof set.addedWeight === "number") {
            const roundedAdded = Math.max(0, roundToNearest5(set.addedWeight));
            set.addedWeight = roundedAdded;
            set.weight = Number(bodyweight) + roundedAdded;
          } else if (typeof set.weight === "number") {
            set.weight = Math.max(Number(bodyweight), set.weight);
          }
        } else if (typeof set.weight === "number") {
          if (this.equipmentType === "dumbbell") {
            set.weight = Math.max(0, roundToNearest5(set.weight));
          } else if (set.weight <= this.barWeight) {
            set.weight = this.barWeight;
          } else {
            const perSideLoad = (set.weight - this.barWeight) / 2;
            const roundedPerSide = Math.round(perSideLoad / 5) * 5;
            const roundedWeight = this.barWeight + roundedPerSide * 2;
            set.weight = Math.max(this.barWeight, roundedWeight);
          }
        }
        return set;
      };

      const backoffSet: WarmupSet = {
        percentage: Math.round(this.backoffPercentage),
        weight: backoffWeight,
        reps: 8,
        addedWeight: this.isWeightedBodyweight
          ? Math.max(0, backoffWeight - bodyweight)
          : undefined,
        isBackoff: true,
      };

      const roundedSet = applyRounding(backoffSet);

      const useMinimizePlateChanges =
        this.equipmentType === "barbell" && this.minimizePlateChanges;

      if (this.isWeightedBodyweight) {
        const addedWeight = Math.max(0, roundedSet.addedWeight || 0);
        if (addedWeight > 0) {
          roundedSet.plates = this.calculatePlatesNeeded(addedWeight, {
            minPlateWeight: 5,
          });
        } else {
          roundedSet.plates = {
            plateConfig: [],
            remaining: 0,
            actualWeight: 0,
          };
        }
      } else if (this.equipmentType === "dumbbell") {
        roundedSet.plates = {
          plateConfig: [],
          remaining: 0,
          actualWeight: roundedSet.weight,
        };
      } else {
        roundedSet.plates = this.calculatePlatesNeeded(roundedSet.weight, {
          minPlateWeight: 5,
        });
      }

      if (!useMinimizePlateChanges && roundedSet.plates.adjustedTargetWeight) {
        if (this.isWeightedBodyweight) {
          roundedSet.addedWeight = roundedSet.plates.adjustedTargetWeight;
          roundedSet.weight =
            Number(bodyweight) + Number(roundedSet.addedWeight);
        } else {
          roundedSet.weight = roundedSet.plates.adjustedTargetWeight;
        }
      }

      return roundedSet;
    },

    saveSettings() {
      localStorage.setItem(
        "plateSettings",
        JSON.stringify({
          sessionTiming: this.sessionTiming,
          equipmentType: this.equipmentType,
          barWeight: Number.parseFloat(String(this.barWeight)),
          availablePlates: this.availablePlates,
          minimizePlateChanges: this.minimizePlateChanges,
          bodyweight: this.bodyweight
            ? Number.parseFloat(String(this.bodyweight))
            : 0,
          isWeightedBodyweight: this.isWeightedBodyweight,
          numWarmupSets: this.numWarmupSets,
          selectedFormula: this.selectedFormula,
          enableBackoff: this.enableBackoff,
          backoffPercentage: this.backoffPercentage,
        }),
      );
    },

    savePlateSettings() {
      this.saveSettings();
      this.calculate();
    },

    getPlateColor(weight: number | string): string {
      const w = Number.parseFloat(String(weight));
      switch (w) {
        case 55:
          return "danger";
        case 45:
          return "primary";
        case 35:
          return "warning";
        case 25:
          return "success";
        case 15:
          return "info";
        case 10:
          return "burgundy";
        case 5:
          return "secondary";
        case 2.5:
          return "purple";
        case 1:
          return "dark";
        case 0.75:
          return "light";
        case 0.5:
          return "teal";
        case 0.25:
          return "orange";
        default:
          return "secondary";
      }
    },

    incrementWeight(direction: 1 | -1) {
      if (!this.hasJourneySelection()) {
        return;
      }

      const currentWeight = Number.parseFloat(String(this.targetWeight));

      if (Number.isNaN(currentWeight)) {
        return;
      }

      // Generate possible weights based on available plates and bar weight
      // Generate a large range to ensure we capture all possible weights
      const maxWeight = Math.max(currentWeight + 500, this.barWeight + 500);
      const possibleWeights = generatePossibleWeights(
        this.barWeight,
        maxWeight,
        this.availablePlates,
        this.isWeightedBodyweight,
      );

      if (possibleWeights.length === 0) {
        return;
      }

      let nextWeight: number | undefined;

      if (direction > 0) {
        // Find the next weight up (first weight greater than current)
        nextWeight = possibleWeights.find((w) => w > currentWeight);
        if (!nextWeight) {
          nextWeight = possibleWeights[possibleWeights.length - 1];
        }
      } else {
        // Find the next weight down (last weight less than current)
        nextWeight = [...possibleWeights]
          .reverse()
          .find((w) => w < currentWeight);
        if (!nextWeight) {
          nextWeight = possibleWeights[0];
        }
      }

      if (nextWeight !== undefined) {
        this.targetWeight = nextWeight.toString();
        this.calculate();
      }
    },

    init() {
      // @ts-ignore - debounce returns a function, $el will be available in Alpine context
      this.debouncedCalculate = debounce(this.calculate.bind(this), 300);
      this.selectedFormula = "percentageBased";
      this.numWarmupSets = getDefaultSets(this.selectedFormula);
      this.showSetsSelector = isConfigurableFormula(this.selectedFormula);

      const savedSettings = localStorage.getItem("plateSettings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);

        if (Object.prototype.hasOwnProperty.call(settings, "sessionTiming")) {
          this.sessionTiming = settings.sessionTiming;
        }

        if (Object.prototype.hasOwnProperty.call(settings, "equipmentType")) {
          this.equipmentType = settings.equipmentType;
        }

        this.barWeight = Number.parseFloat(settings.barWeight);
        if (Number.isFinite(this.barWeight)) {
          const normalizedBarWeight = Math.min(
            45,
            Math.max(0, Math.round(this.barWeight / 5) * 5),
          );
          this.barWeight = normalizedBarWeight;
        }

        if (
          settings.availablePlates &&
          Array.isArray(settings.availablePlates)
        ) {
          const expectedWeights = [
            55, 45, 35, 25, 15, 10, 5, 2.5, 1, 0.75, 0.5, 0.25,
          ];
          const plateMap = new Map();

          for (const plate of settings.availablePlates) {
            plateMap.set(plate.weight, plate.available);
          }

          this.availablePlates = expectedWeights.map((weight) => ({
            weight: weight,
            available: plateMap.has(weight)
              ? plateMap.get(weight)
              : weight !== 55,
          }));

          const savedWeights = settings.availablePlates.map(
            (p: Plate) => p.weight,
          );
          const newWeights = expectedWeights.filter(
            (w) => !savedWeights.includes(w),
          );
          if (newWeights.length > 0) {
            this.saveSettings();
          }
        }

        if (
          Object.prototype.hasOwnProperty.call(settings, "minimizePlateChanges")
        ) {
          this.minimizePlateChanges = settings.minimizePlateChanges;
        }

        if (
          Object.prototype.hasOwnProperty.call(settings, "bodyweight") &&
          settings.bodyweight > 0
        ) {
          this.bodyweight = settings.bodyweight.toString();
        }

        if (
          Object.prototype.hasOwnProperty.call(settings, "isWeightedBodyweight")
        ) {
          this.isWeightedBodyweight = settings.isWeightedBodyweight;
          this.showBodyweightInput = settings.isWeightedBodyweight;

          if (!this.equipmentType && this.isWeightedBodyweight) {
            this.equipmentType = "weightedBodyweight";
          }
        }

        if (Object.prototype.hasOwnProperty.call(settings, "numWarmupSets")) {
          this.numWarmupSets = settings.numWarmupSets;
        }

        if (Object.prototype.hasOwnProperty.call(settings, "selectedFormula")) {
          this.selectedFormula = settings.selectedFormula;
          if (this.selectedFormula !== "weightedBodyweight") {
            this.lastRegularFormula = this.selectedFormula;
          }
          this.showSetsSelector = isConfigurableFormula(this.selectedFormula);

          if (!this.equipmentType) {
            this.equipmentType =
              this.selectedFormula === "weightedBodyweight"
                ? "weightedBodyweight"
                : "barbell";
          }

          if (!this.sessionTiming) {
            this.sessionTiming = "pre";
          }
        }

        if (Object.prototype.hasOwnProperty.call(settings, "enableBackoff")) {
          this.enableBackoff = settings.enableBackoff;
        }

        if (
          Object.prototype.hasOwnProperty.call(settings, "backoffPercentage")
        ) {
          this.backoffPercentage = settings.backoffPercentage;
        }
      }

      if (!this.sessionTiming) {
        this.sessionTiming = "pre";
      }

      if (!this.equipmentType) {
        this.equipmentType = this.isWeightedBodyweight
          ? "weightedBodyweight"
          : "barbell";
      }

      this.applyJourneySelection(false);

      // @ts-ignore
      this.$watch("bodyweight", (newValue: string | number) => {
        if (newValue && Number.parseFloat(String(newValue)) > 0) {
          this.saveSettings();
        }
      });

      // @ts-ignore
      this.$watch("numWarmupSets", () => {
        this.saveSettings();
      });

      // @ts-ignore
      this.$watch("enableBackoff", () => {
        this.saveSettings();
        this.debouncedCalculate?.();
      });

      // @ts-ignore
      this.$watch("backoffPercentage", () => {
        this.saveSettings();
        this.debouncedCalculate?.();
      });

      // @ts-ignore - $el is available in Alpine context
      this.$el.addEventListener("use-calculated-max", (e: CustomEvent) => {
        if (e.detail?.weight) {
          const roundedWeight = roundToSmallestPlate(
            e.detail.weight,
            this.availablePlates,
          );
          this.targetWeight = roundedWeight.toString();
          this.calculate();
        }
      });

      const plateModal = document.getElementById("plateSettingsModal");
      if (plateModal) {
        plateModal.addEventListener("hidden.bs.modal", () => {
          this.calculate();
        });
      }

      window.addEventListener("beforeunload", () => {
        this.saveSettings();
      });
    },
  };
}
