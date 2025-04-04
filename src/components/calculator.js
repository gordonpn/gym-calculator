import { debounce } from "./util.js";
import {
  formulaOptions,
  getFormula,
  isConfigurableFormula,
  getDefaultSets,
} from "./warmup-formulas.js";

export default () => ({
  numWarmupSets: 6,
  targetWeight: "",
  selectedFormula: "percentageBased",
  warmupSets: [],
  formulaOptions,
  barOnlyFirstSet: false,
  showSetsSelector: true,

  barWeight: 45,
  availablePlates: [
    { weight: 45, available: true },
    { weight: 35, available: true },
    { weight: 25, available: true },
    { weight: 10, available: true },
    { weight: 5, available: true },
    { weight: 2.5, available: true },
  ],

  calculate() {
    const weight = parseFloat(this.targetWeight);

    if (!isNaN(weight) && weight > 0) {
      const formula = getFormula(this.selectedFormula);
      if (isConfigurableFormula(this.selectedFormula)) {
        this.warmupSets = formula(weight, this.numWarmupSets);
      } else {
        this.warmupSets = formula(weight);
      }

      if (
        this.barOnlyFirstSet &&
        this.warmupSets.length > 0 &&
        this.warmupSets[0].weight > this.barWeight
      ) {
        this.warmupSets.unshift({
          percentage: Math.round((this.barWeight / weight) * 100),
          weight: this.barWeight,
          reps: 12,
        });
      }

      this.warmupSets.forEach((set) => {
        set.plates = this.calculatePlatesNeeded(set.weight);
      });
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
    this.debouncedCalculate();
  },

  calculatePlatesNeeded(targetWeight) {
    if (targetWeight <= this.barWeight) {
      return {
        plateConfig: [],
        remaining: 0,
        actualWeight: this.barWeight,
      };
    }

    const weightToAdd = (targetWeight - this.barWeight) / 2;

    const sortedPlates = [...this.availablePlates]
      .filter((plate) => plate.available)
      .sort((a, b) => b.weight - a.weight);

    let remaining = weightToAdd;
    const plateConfig = [];

    sortedPlates.forEach((plate) => {
      const count = Math.floor(remaining / plate.weight);

      if (count > 0) {
        plateConfig.push({
          weight: plate.weight,
          count: count,
        });
        remaining -= count * plate.weight;
      }
    });

    const actualPlateWeight =
      plateConfig.reduce((sum, plate) => sum + plate.weight * plate.count, 0) *
      2;

    const actualWeight = parseFloat(this.barWeight) + actualPlateWeight;

    return {
      plateConfig,
      remaining,
      actualWeight,
    };
  },

  savePlateSettings() {
    localStorage.setItem(
      "plateSettings",
      JSON.stringify({
        barWeight: parseFloat(this.barWeight),
        availablePlates: this.availablePlates,
        barOnlyFirstSet: this.barOnlyFirstSet,
      })
    );

    this.calculate();
  },

  init() {
    this.debouncedCalculate = debounce(this.calculate.bind(this), 300);
    this.selectedFormula = "percentageBased";
    this.numWarmupSets = getDefaultSets(this.selectedFormula);
    this.showSetsSelector = isConfigurableFormula(this.selectedFormula);

    const savedSettings = localStorage.getItem("plateSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      this.barWeight = parseFloat(settings.barWeight);

      if (settings.availablePlates && Array.isArray(settings.availablePlates)) {
        this.availablePlates = settings.availablePlates.map((plate) => ({
          weight: plate.weight,
          available: plate.available,
        }));
      }

      if (settings.hasOwnProperty("barOnlyFirstSet")) {
        this.barOnlyFirstSet = settings.barOnlyFirstSet;
      }
    }

    document
      .getElementById("plateSettingsModal")
      .addEventListener("hidden.bs.modal", () => {
        this.calculate();
      });
  },
});
