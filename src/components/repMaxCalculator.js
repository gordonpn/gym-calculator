// Rep Max Calculator component
// Using the Epley formula: 1RM = w * (1 + r / 30)
// And reverse: weight for n reps = 1RM / (1 + n / 30)

export default () => ({
  sets: [{ weight: "", reps: "", estimatedMax: 0 }],
  estimatedMax: 0,
  repRangeData: [],
  errorMessage: "",
  calculationMethod: "average", // Options: "average", "highest", "lowest", "weighted"

  addSet() {
    // Get the last set
    const lastSet = this.sets[this.sets.length - 1];

    // If the last set has both weight and reps filled, copy those values to the new set
    const newSet = { weight: "", reps: "", estimatedMax: 0 };

    if (lastSet && lastSet.weight !== "" && lastSet.reps !== "") {
      newSet.weight = lastSet.weight;
      newSet.reps = lastSet.reps;
    }

    this.sets.push(newSet);
  },

  removeSet(index) {
    // Don't remove if it's the only set
    if (this.sets.length > 1) {
      this.sets.splice(index, 1);
      this.calculateAverageMax();
    }
  },

  calculateSetMax(set) {
    const w = Number.parseFloat(set.weight);
    const r = Number.parseInt(set.reps);

    if (Number.isNaN(w) || w <= 0 || Number.isNaN(r) || r <= 0) {
      set.estimatedMax = 0;
      return 0;
    }

    if (r === 1) {
      set.estimatedMax = w; // If reps is 1, 1RM is the weight itself
    } else if (r > 30) {
      set.estimatedMax = 0;
      return 0;
    } else {
      // Epley formula
      set.estimatedMax = Math.round(w * (1 + r / 30));
    }

    return set.estimatedMax;
  },

  calculateAverageMax() {
    this.errorMessage = ""; // Clear previous errors

    // Calculate 1RM for each set
    const validSets = this.sets.filter((set) => {
      const w = Number.parseFloat(set.weight);
      const r = Number.parseInt(set.reps);

      if (Number.isNaN(w) || w <= 0 || Number.isNaN(r) || r <= 0) {
        return false;
      }

      if (r > 30) {
        this.errorMessage = "Calculation is less reliable for reps > 30.";
        return false;
      }

      return true;
    });

    if (validSets.length === 0) {
      this.estimatedMax = 0;
      this.repRangeData = [];
      if (this.sets.some((set) => set.weight || set.reps)) {
        // Only show error if user started typing
        this.errorMessage =
          "Please enter valid positive numbers for weight and reps.";
      }
      return;
    }

    // Calculate 1RM for each valid set
    for (const set of validSets) {
      this.calculateSetMax(set);
    }

    // Calculate final 1RM based on selected method
    switch (this.calculationMethod) {
      case "highest": {
        this.estimatedMax = Math.max(
          ...validSets.map((set) => set.estimatedMax),
        );
        break;
      }
      case "lowest": {
        this.estimatedMax = Math.min(
          ...validSets.map((set) => set.estimatedMax),
        );
        break;
      }
      case "weighted": {
        // Weighted average - gives more weight to heavier lifts or higher reps
        let totalWeight = 0;
        let weightedSum = 0;
        for (const set of validSets) {
          const weight = Number.parseFloat(set.weight);
          const reps = Number.parseInt(set.reps);
          // Use weight × reps as the weighting factor
          const factor = weight * reps;
          weightedSum += set.estimatedMax * factor;
          totalWeight += factor;
        }
        this.estimatedMax = Math.round(weightedSum / totalWeight);
        break;
      }
      default: {
        // Simple average
        const sumOfMaxes = validSets.reduce(
          (sum, set) => sum + set.estimatedMax,
          0,
        );
        this.estimatedMax = Math.round(sumOfMaxes / validSets.length);
      }
    }

    // Calculate weights for rep ranges 1-15
    this.repRangeData = [];
    for (let reps = 1; reps <= 15; reps++) {
      // Reverse Epley formula to get weight for given reps
      const weightForReps = Math.round(this.estimatedMax / (1 + reps / 30));

      // Calculate percentage of 1RM
      const percentage = Math.round((weightForReps / this.estimatedMax) * 100);

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
    // Initialize the component
    console.log("Rep Max Calculator initialized");
    this.calculationMethod =
      localStorage.getItem("repMaxCalculationMethod") || "average";

    // Watch for changes to the calculation method
    this.$watch("calculationMethod", (method) => {
      localStorage.setItem("repMaxCalculationMethod", method);
      this.calculateAverageMax();
    });
  },
});
