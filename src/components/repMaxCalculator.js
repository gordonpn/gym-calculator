// Rep Max Calculator component
// Using the Epley formula: 1RM = w * (1 + r / 30)
// And reverse: weight for n reps = 1RM / (1 + n / 30)

export default () => ({
  weight: "",
  reps: "",
  estimatedMax: 0,
  repRangeData: [],
  errorMessage: "",

  calculateRepMax() {
    this.errorMessage = ""; // Clear previous errors
    const w = Number.parseFloat(this.weight);
    const r = Number.parseInt(this.reps);

    if (Number.isNaN(w) || w <= 0 || Number.isNaN(r) || r <= 0) {
      this.estimatedMax = 0;
      this.repRangeData = [];
      if (this.weight || this.reps) {
        // Only show error if user started typing
        this.errorMessage =
          "Please enter valid positive numbers for weight and reps.";
      }
      return;
    }

    if (r === 1) {
      this.estimatedMax = w; // If reps is 1, 1RM is the weight itself
    } else if (r > 30) {
      this.estimatedMax = 0;
      this.repRangeData = [];
      this.errorMessage = "Calculation is less reliable for reps > 30.";
      return;
    } else {
      // Epley formula
      this.estimatedMax = Math.round(w * (1 + r / 30));
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

  init() {
    // Initialize the component
    console.log("Rep Max Calculator initialized");
  },
});
