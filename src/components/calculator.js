import { debounce } from "./util.js";
import { formulaOptions, getFormula } from "./warmup-formulas.js";

export default () => ({
  numWarmupSets: "",
  targetWeight: "",
  selectedFormula: "percentageBased",
  warmupSets: [],
  formulaOptions,

  calculate() {
    const weight = parseFloat(this.targetWeight);

    if (!isNaN(weight) && weight > 0) {
      const formula = getFormula(this.selectedFormula);
      this.warmupSets = formula(weight);
    } else {
      this.warmupSets = [];
    }
  },

  init() {
    this.debouncedCalculate = debounce(this.calculate.bind(this), 300);
    // Set default formula
    this.selectedFormula = "percentageBased";
  },
});
