// Basic Rep Max Calculator component
// Using the Epley formula: 1RM = w * (1 + r / 30)

export default () => ({
  weight: "",
  reps: "",
  estimatedMax: 0,
  errorMessage: "",

  calculateRepMax() {
    this.errorMessage = ""; // Clear previous errors
    const w = Number.parseFloat(this.weight);
    const r = Number.parseInt(this.reps);

    if (Number.isNaN(w) || w <= 0 || Number.isNaN(r) || r <= 0) {
      this.estimatedMax = 0;
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
      this.errorMessage = "Calculation is less reliable for reps > 30.";
    } else {
      // Epley formula
      this.estimatedMax = Math.round(w * (1 + r / 30));
    }
  },

  init() {
    // Initialize the component
    console.log("Rep Max Calculator initialized");
  },
});
