import Modal from 'bootstrap/js/dist/modal';
import {
  PLATE_PRESETS_STORAGE_KEY,
  type PlatePreset,
  buildPlatePresetSnapshot,
  createPlatePresetPayload,
  normalizePlateCollection,
  parsePlatePresetStore,
  serializePlatePresetStore,
} from './presetStorage';
import {
  type Plate,
  debounce,
  roundToNearest5,
  roundToNearestAchievableWeight,
  roundToSmallestPlate,
} from './util';
import {
  type PlateCalculation,
  type WarmupSet,
  generatePossibleWeights,
  getDefaultSets,
  getFormula,
  isConfigurableFormula,
} from './warmup-formulas';

type SessionTiming = 'pre' | 'post' | '';
type EquipmentType = 'barbell' | 'dumbbell' | 'weightedBodyweight' | '';

const DEFAULT_BAR_WEIGHT = 45;
const PLATE_DEFAULT_COUNT = 10;

const DEFAULT_AVAILABLE_PLATES: Plate[] = [
  { weight: 55, available: false, count: 0 },
  { weight: 45, available: true, count: PLATE_DEFAULT_COUNT },
  { weight: 35, available: true, count: PLATE_DEFAULT_COUNT },
  { weight: 25, available: true, count: PLATE_DEFAULT_COUNT },
  { weight: 15, available: true, count: PLATE_DEFAULT_COUNT },
  { weight: 10, available: true, count: PLATE_DEFAULT_COUNT },
  { weight: 5, available: true, count: PLATE_DEFAULT_COUNT },
  { weight: 2.5, available: true, count: PLATE_DEFAULT_COUNT },
  { weight: 1, available: true, count: PLATE_DEFAULT_COUNT },
  { weight: 0.75, available: true, count: PLATE_DEFAULT_COUNT },
  { weight: 0.5, available: true, count: PLATE_DEFAULT_COUNT },
  { weight: 0.25, available: true, count: PLATE_DEFAULT_COUNT },
];

const makePresetId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
};

/**
 * Interface for the calculator Alpine component state
 */
export interface CalculatorData {
  sessionTiming: SessionTiming;
  equipmentType: EquipmentType;
  numWarmupSets: number;
  targetWeight: string | number;
  roundedTargetWeight: number;
  topSetPlates: PlateCalculation;
  selectedFormula: string;
  warmupSets: WarmupSet[];
  showSetsSelector: boolean;
  isWeightedBodyweight: boolean;
  bodyweight: string | number;
  showBodyweightInput: boolean;
  enableBackoff: boolean;
  backoffPercentage: number;
  barWeight: number;
  barWeightOptions: number[];
  availablePlates: Plate[];
  platePresets: PlatePreset[];
  selectedPlatePresetId: string;
  platePresetNameInput: string;
  platePresetRenameInput: string;
  defaultPlatePresetId: string;
  platePresetError: string;
  platePresetStatus: string;
  presetToastMessage: string;
  presetToastVariant: 'success' | 'danger' | 'warning';
  showPresetToast: boolean;
  isCalculating: boolean;
  calculationRequestId: number;
  pendingCalculationTimeout: ReturnType<typeof setTimeout> | null;
  presetToastTimeoutId?: ReturnType<typeof setTimeout>;
  debouncedCalculate?: () => void;

  hasJourneySelection(): boolean;
  getAutoFormulaForJourney(): string;
  applyJourneySelection(shouldPersist?: boolean): void;
  hasCalculableWeight(): boolean;
  scheduleCalculation(): void;
  runCalculation(): void;
  calculate(): void;
  applySetRounding(set: WarmupSet, bodyweight?: number): WarmupSet;
  calculatePlatesNeeded(
    targetWeight: number,
    options?: { minPlateWeight?: number },
  ): PlateCalculation;
  createBackoffSet(targetWeight: number, bodyweight?: number): WarmupSet;
  saveSettings(): void;
  savePlateSettings(): void;
  savePlatePreset(): void;
  applySelectedPlatePreset(): void;
  renameSelectedPlatePreset(): void;
  deleteSelectedPlatePreset(): void;
  setDefaultSelectedPlatePreset(): void;
  clearDefaultPlatePreset(): void;
  openPlateSettingsModal(): void;
  onPlatePresetSelectionChange(): void;
  clearPresetStatus(): void;
  triggerPresetToast(
    message: string,
    variant?: 'success' | 'danger' | 'warning',
  ): void;
  hydratePlatePresets(): void;
  persistPlatePresetStore(): boolean;
  isSelectedPlatePresetDefault(): boolean;
  getPlateColor(weight: number | string): string;
  incrementWeight(direction: 1 | -1): void;
  init(): void;
}

/**
 * Calculator component
 */
export default function (): CalculatorData {
  return {
    sessionTiming: '',
    equipmentType: '',
    numWarmupSets: 6,
    targetWeight: '',
    roundedTargetWeight: 0,
    topSetPlates: {
      plateConfig: [],
      remaining: 0,
      actualWeight: 0,
    },
    selectedFormula: 'barbellPreClimbing',
    warmupSets: [],
    showSetsSelector: true,
    isWeightedBodyweight: false,
    bodyweight: '',
    showBodyweightInput: false,
    enableBackoff: false,
    backoffPercentage: 80,
    barWeight: DEFAULT_BAR_WEIGHT,
    barWeightOptions: Array.from({ length: 9 }, (_value, index) => 45 - index * 5),
    availablePlates: normalizePlateCollection(DEFAULT_AVAILABLE_PLATES),
    platePresets: [],
    selectedPlatePresetId: '',
    platePresetNameInput: '',
    platePresetRenameInput: '',
    defaultPlatePresetId: '',
    platePresetError: '',
    platePresetStatus: '',
    presetToastMessage: '',
    presetToastVariant: 'success',
    showPresetToast: false,
    isCalculating: false,
    calculationRequestId: 0,
    pendingCalculationTimeout: null,
    presetToastTimeoutId: undefined,

    hasJourneySelection() {
      return !!this.sessionTiming && !!this.equipmentType;
    },

    getAutoFormulaForJourney() {
      if (this.equipmentType === "weightedBodyweight") {
        return this.sessionTiming === "post"
          ? "weightedBodyweightPostClimbing"
          : "weightedBodyweightPreClimbing";
      }

      if (this.equipmentType === "dumbbell") {
        return this.sessionTiming === "post"
          ? "dumbbellPostClimbing"
          : "dumbbellPreClimbing";
      }

      return this.sessionTiming === "post"
        ? "barbellPostClimbing"
        : "barbellPreClimbing";
    },

    applyJourneySelection(shouldPersist = true) {
      this.isWeightedBodyweight = this.equipmentType === "weightedBodyweight";
      this.showBodyweightInput = this.isWeightedBodyweight;

      if (
        this.isWeightedBodyweight &&
        (!this.bodyweight || Number(this.bodyweight) <= 0)
      ) {
        this.bodyweight = "150";
      }

      if (this.hasJourneySelection()) {
        this.selectedFormula = this.getAutoFormulaForJourney();

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

    hasCalculableWeight() {
      const weight = Number.parseFloat(String(this.targetWeight));
      return !Number.isNaN(weight);
    },

    scheduleCalculation() {
      const requestId = ++this.calculationRequestId;

      if (this.pendingCalculationTimeout !== null) {
        clearTimeout(this.pendingCalculationTimeout);
        this.pendingCalculationTimeout = null;
      }

      // Yield one macrotask so the loading indicator can paint first.
      this.pendingCalculationTimeout = setTimeout(() => {
        this.pendingCalculationTimeout = null;

        if (requestId !== this.calculationRequestId) {
          return;
        }

        this.isCalculating = true;
        try {
          this.runCalculation();
        } finally {
          if (requestId === this.calculationRequestId) {
            this.isCalculating = false;
          }
        }
      }, 0);
    },

    calculate() {
      if (!this.hasCalculableWeight()) {
        this.calculationRequestId += 1;

        if (this.pendingCalculationTimeout !== null) {
          clearTimeout(this.pendingCalculationTimeout);
          this.pendingCalculationTimeout = null;
        }

        this.isCalculating = false;
        this.runCalculation();
        return;
      }

      this.scheduleCalculation();
    },

    applySetRounding(set: WarmupSet, bodyweight = 0): WarmupSet {
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

      if (typeof set.idealWeight === "number") {
        set.idealWeight = set.weight;
      }

      return set;
    },

    runCalculation() {
      if (!this.hasJourneySelection()) {
        this.warmupSets = [];
        this.roundedTargetWeight = 0;
        this.topSetPlates = {
          plateConfig: [],
          remaining: 0,
          actualWeight: 0,
        };
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
        this.topSetPlates = {
          plateConfig: [],
          remaining: 0,
          actualWeight: 0,
        };
        return;
      }

      // For weighted bodyweight, we work with added weight, so it can be zero
      // For regular exercises, weight must be positive
      const validWeight = this.isWeightedBodyweight
        ? !Number.isNaN(weight)
        : !Number.isNaN(weight) && weight > 0;

      if (validWeight) {
        const useMinimizePlateChanges = this.equipmentType === "barbell";

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
        this.topSetPlates = this.calculatePlatesNeeded(this.roundedTargetWeight);

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

        this.warmupSets = this.warmupSets.map((set) =>
          this.applySetRounding(set, bodyweight),
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
        this.topSetPlates = {
          plateConfig: [],
          remaining: 0,
          actualWeight: 0,
        };
      }
    },

    calculatePlatesNeeded(
      targetWeight: number,
      options: { minPlateWeight?: number } = {},
    ): PlateCalculation {
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
        (plate) =>
          plate.available &&
          plate.weight >= Number(minPlateWeight) &&
          Number(plate.count ?? 0) > 0,
      );

      let remaining = weightToAdd;
      const plateConfig: Array<{ weight: number; count: number }> = [];

      for (const plate of filteredPlates) {
        const maxCount = Math.max(0, Math.floor(Number(plate.count ?? 0)));
        const count = Math.min(Math.floor(remaining / plate.weight), maxCount);

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

      const backoffSet: WarmupSet = {
        percentage: Math.round(this.backoffPercentage),
        weight: backoffWeight,
        reps: 8,
        addedWeight: this.isWeightedBodyweight
          ? Math.max(0, backoffWeight - bodyweight)
          : undefined,
        isBackoff: true,
      };

      const roundedSet = this.applySetRounding(backoffSet, bodyweight);

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

      return roundedSet;
    },

    saveSettings() {
      const normalizedPlates = normalizePlateCollection(this.availablePlates);

      localStorage.setItem(
        "plateSettings",
        JSON.stringify({
          sessionTiming: this.sessionTiming,
          equipmentType: this.equipmentType,
          barWeight: Number.parseFloat(String(this.barWeight)),
          availablePlates: normalizedPlates,
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

    openPlateSettingsModal() {
      const modalElement = document.getElementById('plateSettingsModal');
      if (!modalElement) {
        return;
      }

      const modalInstance = Modal.getOrCreateInstance(modalElement);
      modalInstance.show();
    },

    clearPresetStatus() {
      this.platePresetError = '';
      this.platePresetStatus = '';
    },

    triggerPresetToast(message, variant = 'success') {
      this.presetToastMessage = message;
      this.presetToastVariant = variant;
      this.showPresetToast = true;

      if (this.presetToastTimeoutId) {
        clearTimeout(this.presetToastTimeoutId);
      }

      this.presetToastTimeoutId = setTimeout(() => {
        this.showPresetToast = false;
      }, 2800);
    },

    hydratePlatePresets() {
      const presetStore = parsePlatePresetStore(
        localStorage.getItem(PLATE_PRESETS_STORAGE_KEY),
      );

      this.platePresets = presetStore.presets;
      this.defaultPlatePresetId = presetStore.defaultPresetId || '';

      const hasSelected = this.platePresets.some(
        (preset) => preset.id === this.selectedPlatePresetId,
      );

      if (!hasSelected) {
        this.selectedPlatePresetId = this.platePresets[0]?.id ?? '';
      }

      const selectedPreset = this.platePresets.find(
        (preset) => preset.id === this.selectedPlatePresetId,
      );
      this.platePresetRenameInput = selectedPreset ? selectedPreset.name : '';
    },

    persistPlatePresetStore() {
      try {
        localStorage.setItem(
          PLATE_PRESETS_STORAGE_KEY,
          serializePlatePresetStore({
            defaultPresetId: this.defaultPlatePresetId || null,
            presets: this.platePresets,
          }),
        );
        return true;
      } catch {
        this.platePresetError =
          'Could not save presets in this browser. Please check storage availability.';
        this.triggerPresetToast(this.platePresetError, 'danger');
        return false;
      }
    },

    onPlatePresetSelectionChange() {
      this.clearPresetStatus();

      const selectedPreset = this.platePresets.find(
        (preset) => preset.id === this.selectedPlatePresetId,
      );

      this.platePresetRenameInput = selectedPreset ? selectedPreset.name : '';

      if (selectedPreset) {
        this.applySelectedPlatePreset();
      }
    },

    isSelectedPlatePresetDefault() {
      return (
        !!this.selectedPlatePresetId &&
        this.selectedPlatePresetId === this.defaultPlatePresetId
      );
    },

    savePlatePreset() {
      this.clearPresetStatus();

      try {
        const presetName = String(this.platePresetNameInput).trim();
        if (!presetName) {
          this.platePresetError = 'Preset name is required.';
          return;
        }

        const currentSnapshot = buildPlatePresetSnapshot(
          this.barWeight,
          this.availablePlates,
        );

        const samePresetAlreadyExists = this.platePresets.some(
          (preset) =>
            preset.name === presetName &&
            buildPlatePresetSnapshot(
              preset.barWeight,
              preset.availablePlates,
            ) === currentSnapshot,
        );

        if (samePresetAlreadyExists) {
          this.platePresetStatus = 'No changes detected for this preset name.';
          this.triggerPresetToast(this.platePresetStatus, 'warning');
          return;
        }

        const now = Date.now();
        const newPreset = createPlatePresetPayload(
          makePresetId(),
          presetName,
          this.barWeight,
          this.availablePlates,
          now,
        );

        this.platePresets = [...this.platePresets, newPreset].sort(
          (a, b) => b.updatedAt - a.updatedAt,
        );

        this.selectedPlatePresetId = newPreset.id;
        this.platePresetRenameInput = newPreset.name;
        this.platePresetNameInput = '';

        if (!this.persistPlatePresetStore()) {
          return;
        }

        this.platePresetStatus = 'Preset saved.';
        this.triggerPresetToast(this.platePresetStatus, 'success');
      } catch {
        this.platePresetError =
          'Could not save preset. Please try again with a different name.';
        this.triggerPresetToast(this.platePresetError, 'danger');
      }
    },

    applySelectedPlatePreset() {
      this.clearPresetStatus();

      const selectedPreset = this.platePresets.find(
        (preset) => preset.id === this.selectedPlatePresetId,
      );

      if (!selectedPreset) {
        this.platePresetError = 'Select a preset to apply.';
        return;
      }

      this.barWeight = selectedPreset.barWeight;
      this.availablePlates = normalizePlateCollection(selectedPreset.availablePlates);
      this.saveSettings();
      this.calculate();
      this.platePresetStatus = `Applied preset: ${selectedPreset.name}`;
      this.triggerPresetToast(this.platePresetStatus, 'success');
    },

    renameSelectedPlatePreset() {
      this.clearPresetStatus();

      const selectedPreset = this.platePresets.find(
        (preset) => preset.id === this.selectedPlatePresetId,
      );

      if (!selectedPreset) {
        this.platePresetError = 'Select a preset to rename.';
        return;
      }

      const renamedValue = String(this.platePresetRenameInput).trim();
      if (!renamedValue) {
        this.platePresetError = 'Preset name is required.';
        return;
      }

      selectedPreset.name = renamedValue;
      selectedPreset.updatedAt = Date.now();
      this.platePresets = [...this.platePresets].sort(
        (a, b) => b.updatedAt - a.updatedAt,
      );

      if (!this.persistPlatePresetStore()) {
        return;
      }

      this.platePresetStatus = 'Preset renamed.';
    },

    deleteSelectedPlatePreset() {
      this.clearPresetStatus();

      const selectedPreset = this.platePresets.find(
        (preset) => preset.id === this.selectedPlatePresetId,
      );

      if (!selectedPreset) {
        this.platePresetError = 'Select a preset to delete.';
        return;
      }

      if (!window.confirm(`Delete preset "${selectedPreset.name}"?`)) {
        return;
      }

      this.platePresets = this.platePresets.filter(
        (preset) => preset.id !== this.selectedPlatePresetId,
      );

      if (this.defaultPlatePresetId === selectedPreset.id) {
        this.defaultPlatePresetId = '';
      }

      this.selectedPlatePresetId = this.platePresets[0]?.id ?? '';
      this.platePresetRenameInput = this.platePresets[0]?.name ?? '';

      if (!this.persistPlatePresetStore()) {
        return;
      }

      this.platePresetStatus = 'Preset deleted.';
    },

    setDefaultSelectedPlatePreset() {
      this.clearPresetStatus();

      if (!this.selectedPlatePresetId) {
        this.platePresetError = 'Select a preset to set as default.';
        return;
      }

      this.defaultPlatePresetId = this.selectedPlatePresetId;

      if (!this.persistPlatePresetStore()) {
        return;
      }

      this.platePresetStatus = 'Default preset updated.';
    },

    clearDefaultPlatePreset() {
      this.clearPresetStatus();
      this.defaultPlatePresetId = '';

      if (!this.persistPlatePresetStore()) {
        return;
      }

      this.platePresetStatus = 'Default preset cleared.';
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
      this.selectedFormula = 'barbellPreClimbing';
      this.numWarmupSets = getDefaultSets(this.selectedFormula);
      this.showSetsSelector = isConfigurableFormula(this.selectedFormula);

      const savedSettings = localStorage.getItem("plateSettings");
      if (savedSettings) {
        let settings: Record<string, any> = {};

        try {
          settings = JSON.parse(savedSettings);
        } catch {
          settings = {};
        }

        if (Object.prototype.hasOwnProperty.call(settings, "sessionTiming")) {
          this.sessionTiming = settings.sessionTiming;
        }

        if (Object.prototype.hasOwnProperty.call(settings, "equipmentType")) {
          this.equipmentType = settings.equipmentType;
        }

        if (Object.prototype.hasOwnProperty.call(settings, "barWeight")) {
          const parsedBarWeight = Number.parseFloat(String(settings.barWeight));
          if (Number.isFinite(parsedBarWeight) && parsedBarWeight > 0) {
            const normalizedBarWeight = Math.min(
              45,
              Math.max(5, Math.round(parsedBarWeight / 5) * 5),
            );
            this.barWeight = normalizedBarWeight;
          } else {
            this.barWeight = DEFAULT_BAR_WEIGHT;
          }
        }

        if (
          settings.availablePlates &&
          Array.isArray(settings.availablePlates)
        ) {
          this.availablePlates = normalizePlateCollection(settings.availablePlates);
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

      this.hydratePlatePresets();

      if (this.defaultPlatePresetId) {
        const defaultPreset = this.platePresets.find(
          (preset) => preset.id === this.defaultPlatePresetId,
        );

        if (defaultPreset) {
          this.barWeight = defaultPreset.barWeight;
          this.availablePlates = normalizePlateCollection(defaultPreset.availablePlates);
          this.saveSettings();
        }
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
      this.$watch("barWeight", (newValue: number) => {
        const parsedBarWeight = Number.parseFloat(String(newValue));
        if (!Number.isFinite(parsedBarWeight) || parsedBarWeight <= 0) {
          return;
        }

        const normalizedBarWeight = Math.min(
          45,
          Math.max(5, Math.round(parsedBarWeight / 5) * 5),
        );

        if (this.barWeight !== normalizedBarWeight) {
          this.barWeight = normalizedBarWeight;
          return;
        }

        this.saveSettings();
        this.debouncedCalculate?.();
      });

      // @ts-ignore
      this.$watch("availablePlates", () => {
        this.saveSettings();
        this.debouncedCalculate?.();
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
          const calculatedWeight = Number.parseFloat(String(e.detail.weight));

          if (!Number.isFinite(calculatedWeight)) {
            return;
          }

          if (this.isWeightedBodyweight) {
            const bodyweight = Number.parseFloat(String(this.bodyweight));

            if (!Number.isFinite(bodyweight) || bodyweight <= 0) {
              return;
            }

            const addedWeight = Math.max(0, calculatedWeight - bodyweight);
            this.targetWeight = roundToNearest5(addedWeight).toString();
          } else {
            const roundedWeight = roundToSmallestPlate(
              calculatedWeight,
              this.availablePlates,
            );
            this.targetWeight = roundedWeight.toString();
          }

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
