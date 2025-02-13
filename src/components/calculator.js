import { debounce } from './util.js';
export default () => ({
  numWarmupSets: '',
  targetWeight: '',
  result: '',
  calculate() {
    const numSets = parseInt(this.numWarmupSets, 10);
    const weight = parseFloat(this.targetWeight);
    if (!isNaN(numSets) && !isNaN(weight)) {
      this.result = `You need to lift ${weight / numSets} lbs per set.`;
    } else {
      this.result = 'Please enter valid numbers.';
    }
  },
  init() {
    this.debouncedCalculate = debounce(this.calculate.bind(this), 300);
  }
});
