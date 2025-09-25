import { debounce, roundToNearest5, roundToSmallestPlate } from "./util.js";
import {
  formulaOptions,
  getDefaultSets,
  getFormula,
  isConfigurableFormula,
} from "./warmup-formulas.js";

export default () => ({
  numWarmupSets: 6,
  targetWeight: "",
  selectedFormula: "percentageBased",
  warmupSets: [],
  formulaOptions,
  barOnlyFirstSet: false,
  showSetsSelector: true,
  minimizePlateChanges: false,
  isWeightedBodyweight: false,
  bodyweight: "",
  showBodyweightInput: false,

  barWeight: 45,
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

  calculate() {
    const weight = Number.parseFloat(this.targetWeight);
    const bodyweight = this.isWeightedBodyweight
      ? Number.parseFloat(this.bodyweight)
      : 0;

    // For weighted bodyweight, validate that bodyweight is entered
    if (
      this.isWeightedBodyweight &&
      (!bodyweight || Number.isNaN(bodyweight) || bodyweight <= 0)
    ) {
      this.warmupSets = [];
      return;
    }

    // For weighted bodyweight, we work with added weight, so it can be zero
    // For regular exercises, weight must be positive
    const validWeight = this.isWeightedBodyweight
      ? !Number.isNaN(weight)
      : !Number.isNaN(weight) && weight > 0;

    if (validWeight) {
      const formula = getFormula(this.selectedFormula);
      const actualTargetWeight = this.isWeightedBodyweight
        ? Number(bodyweight) + Number(weight) // For bodyweight exercises, target = bodyweight + added weight
        : weight; // For regular exercises, target = entered weight

      if (isConfigurableFormula(this.selectedFormula)) {
        this.warmupSets = formula(
          actualTargetWeight,
          this.numWarmupSets,
          this.barWeight,
          this.availablePlates,
          this.minimizePlateChanges,
          this.isWeightedBodyweight,
          bodyweight
        );
      } else {
        this.warmupSets = formula(
          actualTargetWeight,
          null,
          this.barWeight,
          this.availablePlates,
          this.minimizePlateChanges,
          this.isWeightedBodyweight,
          bodyweight
        );
      }

      if (this.barOnlyFirstSet && this.warmupSets.length > 0) {
        if (this.isWeightedBodyweight) {
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
        } else if (this.warmupSets[0].weight > this.barWeight) {
          this.warmupSets.unshift({
            percentage: Math.round((this.barWeight / actualTargetWeight) * 100),
            weight: this.barWeight,
            reps: 12,
          });
        }
      }

      for (const set of this.warmupSets) {
        // For bodyweight exercises, we need to handle plate calculations differently
        if (this.isWeightedBodyweight) {
          // Handle plate calculation for the added weight component only
          const addedWeight = Math.max(0, set.addedWeight);
          if (addedWeight > 0) {
            set.plates = this.calculatePlatesNeeded(addedWeight);
          } else {
            set.plates = { plateConfig: [], remaining: 0, actualWeight: 0 };
          }
        } else {
          set.plates = this.calculatePlatesNeeded(set.weight);
        }

        // If not using minimize plate changes and there's an adjusted weight,
        // update the set's weight to the actual achievable weight for cleaner display
        if (!this.minimizePlateChanges && set.plates.adjustedTargetWeight) {
          if (this.isWeightedBodyweight) {
            // For bodyweight exercises, update the added weight component
            set.addedWeight = set.plates.adjustedTargetWeight;
            set.weight = Number(bodyweight) + Number(set.addedWeight);
          } else {
            set.weight = set.plates.adjustedTargetWeight;
          }
        }
      }
    } else {
      this.warmupSets = [];
    }
  },

  onFormulaChange() {
    if (isConfigurableFormula(this.selectedFormula)) {
      this.numWarmupSets = getDefaultSets(this.selectedFormula);
      this.showSetsSelector = true;
    } else {
      this.showSetsSelector = false;
    }

    // Auto-set weighted bodyweight toggle for the weighted bodyweight formula
    if (this.selectedFormula === "weightedBodyweight") {
      this.isWeightedBodyweight = true;
      this.showBodyweightInput = true;
    }

    // Save settings when formula changes
    this.saveSettings();

    this.debouncedCalculate();
  },

  calculatePlatesNeeded(targetWeight) {
    // For weighted bodyweight exercises, treat the whole weight as the weight to calculate plates for
    const isForBodyweightExercise =
      this.isWeightedBodyweight && targetWeight > 0;

    // For standard barbell exercises, we subtract the bar weight
    // For weighted bodyweight, we use the full weight (no bar to subtract)
    const effectiveBarWeight = isForBodyweightExercise ? 0 : this.barWeight;

    if (targetWeight <= effectiveBarWeight) {
      return {
        plateConfig: [],
        remaining: 0,
        actualWeight: effectiveBarWeight,
      };
    }

    // For standard barbell exercises, divide by 2 for each side
    // For weighted bodyweight, use the full weight (no need to divide)
    const weightToAdd = isForBodyweightExercise
      ? targetWeight
      : (targetWeight - this.barWeight) / 2;

    const sortedPlates = [...this.availablePlates]
      .filter((plate) => plate.available)
      .sort((a, b) => b.weight - a.weight);

    let remaining = weightToAdd;
    const plateConfig = [];

    for (const plate of sortedPlates) {
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
      plateConfig.reduce((sum, plate) => sum + plate.weight * plate.count, 0) *
      (isForBodyweightExercise ? 1 : 2);

    const actualWeight = isForBodyweightExercise
      ? actualPlateWeight
      : Number.parseFloat(this.barWeight) + actualPlateWeight;

    // If not using minimize plate changes, we don't want to show "missing" weights
    // and instead just use the actual achievable weight
    if (!this.minimizePlateChanges && remaining > 0) {
      return {
        plateConfig: plateConfig.reverse(),
        remaining: 0, // Set to 0 to hide "missing" weight indication
        actualWeight: actualWeight,
        // Update the set's weight to the actual achievable weight for display
        adjustedTargetWeight: actualWeight,
      };
    }

    return {
      plateConfig: plateConfig.reverse(),
      remaining,
      actualWeight,
    };
  },

  saveSettings() {
    localStorage.setItem(
      "plateSettings",
      JSON.stringify({
        barWeight: Number.parseFloat(this.barWeight),
        availablePlates: this.availablePlates,
        barOnlyFirstSet: this.barOnlyFirstSet,
        minimizePlateChanges: this.minimizePlateChanges,
        bodyweight: this.bodyweight ? Number.parseFloat(this.bodyweight) : 0,
        isWeightedBodyweight: this.isWeightedBodyweight,
        numWarmupSets: this.numWarmupSets,
        selectedFormula: this.selectedFormula,
      })
    );
  },

  savePlateSettings() {
    this.saveSettings();
    this.calculate();
  },

  getPlateColor(weight) {
    switch (Number.parseFloat(weight)) {
      case 55:
        return "danger"; // Red
      case 45:
        return "primary"; // Blue
      case 35:
        return "warning"; // Yellow
      case 25:
        return "success"; // Green
      case 15:
        return "info"; // Light blue
      case 10:
        return "burgundy"; // Dark red (custom)
      case 5:
        return "secondary"; // Gray
      case 2.5:
        return "purple"; // Purple (custom)
      case 1:
        return "dark"; // Dark gray/black
      case 0.75:
        return "light"; // Light gray
      case 0.5:
        return "teal"; // Teal (custom)
      case 0.25:
        return "orange"; // Orange (custom)
      default:
        return "secondary";
    }
  },

  init() {
    this.debouncedCalculate = debounce(this.calculate.bind(this), 300);
    this.selectedFormula = "percentageBased";
    this.numWarmupSets = getDefaultSets(this.selectedFormula);
    this.showSetsSelector = isConfigurableFormula(this.selectedFormula);

    const savedSettings = localStorage.getItem("plateSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      this.barWeight = Number.parseFloat(settings.barWeight);

      if (settings.availablePlates && Array.isArray(settings.availablePlates)) {
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
            : weight !== 55, // Default new plates to available (except 55 which defaults to false)
        }));

        // If we added new plates that weren't in the saved settings, save the updated configuration
        const savedWeights = settings.availablePlates.map((p) => p.weight);
        const newWeights = expectedWeights.filter(
          (w) => !savedWeights.includes(w)
        );
        if (newWeights.length > 0) {
          this.saveSettings();
        }
      }

      if (Object.prototype.hasOwnProperty.call(settings, "barOnlyFirstSet")) {
        this.barOnlyFirstSet = settings.barOnlyFirstSet;
      }

      if (
        Object.prototype.hasOwnProperty.call(settings, "minimizePlateChanges")
      ) {
        this.minimizePlateChanges = settings.minimizePlateChanges;
      }

      // Load bodyweight and related settings if available
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
      }

      // Load last selected number of sets and formula if available
      if (Object.prototype.hasOwnProperty.call(settings, "numWarmupSets")) {
        this.numWarmupSets = settings.numWarmupSets;
      }

      if (Object.prototype.hasOwnProperty.call(settings, "selectedFormula")) {
        this.selectedFormula = settings.selectedFormula;
        this.showSetsSelector = isConfigurableFormula(this.selectedFormula);
      }
    }

    // Watch for changes to the weighted bodyweight toggle
    this.$watch("isWeightedBodyweight", (isWeighted) => {
      this.showBodyweightInput = isWeighted;

      // If toggling to weighted bodyweight and no bodyweight entered, set a default
      if (isWeighted && (!this.bodyweight || this.bodyweight <= 0)) {
        this.bodyweight = "150"; // Default value
      }

      // Save settings when toggle changes
      this.saveSettings();

      this.debouncedCalculate();
    });

    // Watch for changes to bodyweight and save it
    this.$watch("bodyweight", (newValue) => {
      if (newValue && Number.parseFloat(newValue) > 0) {
        this.saveSettings();
      }
    });

    // Watch for changes to the number of warm-up sets
    this.$watch("numWarmupSets", () => {
      this.saveSettings();
    });

    // Listen for event from Rep Max Calculator to use the calculated max
    this.$el.addEventListener("use-calculated-max", (e) => {
      if (e.detail?.weight) {
        const roundedWeight = roundToSmallestPlate(
          e.detail.weight,
          this.availablePlates
        );
        this.targetWeight = roundedWeight.toString();
        this.calculate();
      }
    });

    document
      .getElementById("plateSettingsModal")
      .addEventListener("hidden.bs.modal", () => {
        this.calculate();
      });

    // Save settings before user leaves the page
    window.addEventListener("beforeunload", () => {
      this.saveSettings();
    });
  },
});
