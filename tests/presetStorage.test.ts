import { describe, expect, it } from 'vitest';

import {
    buildPlatePresetSnapshot,
    createPlatePresetPayload,
    parsePlatePresetStore,
    serializePlatePresetStore,
} from '../src/components/presetStorage';

describe('plate preset storage serialization', () => {
    it('returns empty store for invalid JSON', () => {
        expect(parsePlatePresetStore('{invalid')).toEqual({
            defaultPresetId: null,
            presets: [],
        });
    });

    it('drops unsupported schema versions', () => {
        const store = parsePlatePresetStore(
            JSON.stringify({
                version: 2,
                defaultPresetId: 'abc',
                presets: [],
            })
        );

        expect(store).toEqual({
            defaultPresetId: null,
            presets: [],
        });
    });

    it('serializes and parses a valid v1 payload', () => {
        const preset = createPlatePresetPayload(
            'preset-1',
            ' Home Gym ',
            45,
            [
                { weight: 45, available: true, count: 2 },
                { weight: 25, available: true, count: 2 },
            ],
            1_700_000_000_000
        );

        const encoded = serializePlatePresetStore({
            defaultPresetId: 'preset-1',
            presets: [preset],
        });

        const decoded = parsePlatePresetStore(encoded);

        expect(decoded.defaultPresetId).toBe('preset-1');
        expect(decoded.presets).toHaveLength(1);
        expect(decoded.presets[0].name).toBe('Home Gym');
        expect(decoded.presets[0].availablePlates.find((p) => p.weight === 45)?.count).toBe(2);
    });

    it('clears default preset when default id is missing', () => {
        const preset = createPlatePresetPayload(
            'preset-1',
            'Gym A',
            45,
            [{ weight: 45, available: true, count: 1 }],
            1_700_000_000_000
        );

        const encoded = serializePlatePresetStore({
            defaultPresetId: 'missing-id',
            presets: [preset],
        });

        const decoded = parsePlatePresetStore(encoded);

        expect(decoded.defaultPresetId).toBeNull();
    });
});

describe('plate preset snapshots', () => {
    it('matches snapshots for equivalent normalized values', () => {
        const snapshotA = buildPlatePresetSnapshot(45, [
            { weight: 45, available: true, count: 2 },
            { weight: 25, available: true, count: 0.9 },
        ]);

        const snapshotB = buildPlatePresetSnapshot(44.9, [
            { weight: 25, available: true, count: 0 },
            { weight: 45, available: true, count: 2 },
        ]);

        expect(snapshotA).toBe(snapshotB);
    });
});
