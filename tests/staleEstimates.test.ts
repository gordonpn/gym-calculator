import { describe, expect, it } from "vitest";
import repMaxCalculator from "../src/components/repMaxCalculator";
import strengthLevelCalculator from "../src/components/strengthLevelCalculator";

const calculators = [
  {
    name: "rep max",
    create() {
      const calculator = repMaxCalculator();
      return {
        calculator,
        recalculate: () => calculator.calculateAverageMax(),
      };
    },
  },
  {
    name: "strength level",
    create() {
      const calculator = strengthLevelCalculator();
      return {
        calculator,
        recalculate: () => calculator.calculateStrength(),
      };
    },
  },
];

for (const { name, create } of calculators) {
  describe(`${name} stale estimates`, () => {
    it.each([
      { weight: "", reps: "5" },
      { weight: "0", reps: "5" },
      { weight: "-1", reps: "5" },
      { weight: "100", reps: "" },
      { weight: "100", reps: "0" },
      { weight: "100", reps: "31" },
    ])("clears an estimate when a row becomes $weight x $reps", (invalid) => {
      const { calculator, recalculate } = create();
      const edited = { weight: "100", reps: "5", estimatedMax: 0 };
      const valid = { weight: "100", reps: "5", estimatedMax: 0 };
      calculator.sets = [edited, valid];
      recalculate();
      expect(edited.estimatedMax).toBe(117);

      Object.assign(edited, invalid);
      recalculate();

      expect(edited.estimatedMax).toBe(0);
      expect(valid.estimatedMax).toBe(117);
      expect(calculator.estimatedMax).toBe(117);

      Object.assign(edited, { weight: "200", reps: "1" });
      recalculate();
      expect(edited.estimatedMax).toBe(200);
      expect(calculator.estimatedMax).toBe(159);
    });

    it("clears the final row estimate when no valid rows remain", () => {
      const { calculator, recalculate } = create();
      calculator.sets = [{ weight: "100", reps: "5", estimatedMax: 0 }];
      recalculate();
      expect(calculator.sets[0].estimatedMax).toBe(117);

      calculator.sets[0].reps = "";
      recalculate();

      expect(calculator.sets[0].estimatedMax).toBe(0);
      expect(calculator.estimatedMax).toBe(0);
    });
  });
}
