import type { Plate } from './util';

export const PLATE_PRESETS_STORAGE_KEY = 'gym-calculator:plate-presets:v1';

export interface PlatePreset {
    id: string;
    name: string;
    barWeight: number;
    availablePlates: Plate[];
    createdAt: number;
    updatedAt: number;
}

export interface PlatePresetStoreV1 {
    version: 1;
    defaultPresetId: string | null;
    presets: PlatePreset[];
}

export interface PlatePresetStore {
    defaultPresetId: string | null;
    presets: PlatePreset[];
}

const EXPECTED_PLATE_WEIGHTS = [55, 45, 35, 25, 15, 10, 5, 2.5, 1, 0.75, 0.5, 0.25];

const isFinitePositiveOrZero = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0;

const sanitizePresetName = (value: unknown): string => {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim();
};

const sanitizeBarWeight = (value: unknown): number => {
    const barWeight = Number(value);
    if (!Number.isFinite(barWeight) || barWeight <= 0) {
        return 45;
    }

    return Math.min(45, Math.max(5, Math.round(barWeight / 5) * 5));
};

const sanitizePlateCount = (value: unknown, available: boolean): number => {
    if (!available) {
        return 0;
    }

    const count = Number(value);
    if (!Number.isFinite(count) || count < 0) {
        // Backward-compatible default for older records with no explicit counts.
        return 10;
    }

    return Math.floor(count);
};

export const normalizePlateCollection = (source: unknown): Plate[] => {
    const sourceArray = Array.isArray(source) ? source : [];
    const sourceMap = new Map<number, Plate>();

    for (const maybePlate of sourceArray) {
        if (!maybePlate || typeof maybePlate !== 'object') {
            continue;
        }

        const castPlate = maybePlate as Plate;
        const weight = Number(castPlate.weight);
        if (!isFinitePositiveOrZero(weight)) {
            continue;
        }

        const available = Boolean(castPlate.available);
        sourceMap.set(weight, {
            weight,
            available,
            count: sanitizePlateCount(castPlate.count, available),
        });
    }

    return EXPECTED_PLATE_WEIGHTS.map((weight) => {
        const plate = sourceMap.get(weight);
        if (plate) {
            return {
                weight,
                available: plate.available,
                count: sanitizePlateCount(plate.count, plate.available),
            };
        }

        return {
            weight,
            available: weight !== 55,
            count: weight === 55 ? 0 : 10,
        };
    });
};

const sanitizePreset = (value: unknown): PlatePreset | null => {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const candidate = value as PlatePreset;
    const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';
    const name = sanitizePresetName(candidate.name);

    if (!id || !name) {
        return null;
    }

    const createdAt = Number(candidate.createdAt);
    const updatedAt = Number(candidate.updatedAt);

    return {
        id,
        name,
        barWeight: sanitizeBarWeight(candidate.barWeight),
        availablePlates: normalizePlateCollection(candidate.availablePlates),
        createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
        updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
    };
};

const asV1Store = (value: unknown): PlatePresetStoreV1 | null => {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const candidate = value as PlatePresetStoreV1;
    if (candidate.version !== 1 || !Array.isArray(candidate.presets)) {
        return null;
    }

    const presets = candidate.presets
        .map((preset) => sanitizePreset(preset))
        .filter((preset): preset is PlatePreset => preset !== null)
        .sort((a, b) => b.updatedAt - a.updatedAt);

    const defaultPresetId =
        typeof candidate.defaultPresetId === 'string' ? candidate.defaultPresetId : null;

    return {
        version: 1,
        defaultPresetId,
        presets,
    };
};

export const parsePlatePresetStore = (
    input: string | null | undefined
): PlatePresetStore => {
    if (!input) {
        return { defaultPresetId: null, presets: [] };
    }

    try {
        const parsed = JSON.parse(input);
        const v1Store = asV1Store(parsed);

        if (!v1Store) {
            return { defaultPresetId: null, presets: [] };
        }

        const hasDefault = v1Store.presets.some(
            (preset) => preset.id === v1Store.defaultPresetId
        );

        return {
            defaultPresetId: hasDefault ? v1Store.defaultPresetId : null,
            presets: v1Store.presets,
        };
    } catch {
        return { defaultPresetId: null, presets: [] };
    }
};

export const serializePlatePresetStore = (store: PlatePresetStore): string => {
    const payload: PlatePresetStoreV1 = {
        version: 1,
        defaultPresetId: store.defaultPresetId,
        presets: store.presets.map((preset) => ({
            ...preset,
            name: sanitizePresetName(preset.name),
            barWeight: sanitizeBarWeight(preset.barWeight),
            availablePlates: normalizePlateCollection(preset.availablePlates),
        })),
    };

    return JSON.stringify(payload);
};

export const createPlatePresetPayload = (
    id: string,
    name: string,
    barWeight: number,
    availablePlates: Plate[],
    now: number = Date.now()
): PlatePreset => ({
    id,
    name: sanitizePresetName(name),
    barWeight: sanitizeBarWeight(barWeight),
    availablePlates: normalizePlateCollection(availablePlates),
    createdAt: now,
    updatedAt: now,
});

export const buildPlatePresetSnapshot = (
    barWeight: number,
    availablePlates: Plate[]
): string => {
    return JSON.stringify({
        barWeight: sanitizeBarWeight(barWeight),
        availablePlates: normalizePlateCollection(availablePlates),
    });
};
