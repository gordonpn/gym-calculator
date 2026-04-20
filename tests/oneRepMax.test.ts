import { describe, expect, it } from 'vitest';

import {
    aggregateOneRepMax,
    estimateOneRepMax,
    isReliableOneRepMaxReps,
    isValidOneRepMaxSet,
    parseSetReps,
    parseSetWeight,
} from '../src/components/oneRepMax';

describe('oneRepMax parsing', () => {
    it('parses numeric set inputs from string or number values', () => {
        expect(parseSetWeight('225.5')).toBe(225.5);
        expect(parseSetWeight(185)).toBe(185);
        expect(parseSetReps('10')).toBe(10);
        expect(parseSetReps(8)).toBe(8);
    });
});

describe('oneRepMax set validation', () => {
    it('requires positive weight by default', () => {
        expect(isValidOneRepMaxSet(100, 5)).toBe(true);
        expect(isValidOneRepMaxSet(0, 5)).toBe(false);
        expect(isValidOneRepMaxSet(-5, 5)).toBe(false);
        expect(isValidOneRepMaxSet(100, 0)).toBe(false);
    });

    it('allows zero weight when configured', () => {
        expect(isValidOneRepMaxSet(0, 8, { allowZeroWeight: true })).toBe(true);
    });
});

describe('oneRepMax reps reliability', () => {
    it('accepts reps in the default reliability range', () => {
        expect(isReliableOneRepMaxReps(1)).toBe(true);
        expect(isReliableOneRepMaxReps(30)).toBe(true);
    });

    it('rejects reps outside the default reliability range', () => {
        expect(isReliableOneRepMaxReps(0)).toBe(false);
        expect(isReliableOneRepMaxReps(31)).toBe(false);
    });

    it('supports a custom max reliability threshold', () => {
        expect(isReliableOneRepMaxReps(20, 20)).toBe(true);
        expect(isReliableOneRepMaxReps(21, 20)).toBe(false);
    });
});

describe('oneRepMax estimation', () => {
    it('uses Epley for reps <= 10 and Brzycki for reps > 10', () => {
        expect(estimateOneRepMax(100, 10)).toBe(133);
        expect(estimateOneRepMax(100, 12)).toBe(144);
    });

    it('supports configurable rounding for single-rep sets', () => {
        expect(estimateOneRepMax(99.5, 1)).toBe(99.5);
        expect(estimateOneRepMax(99.5, 1, { roundSingleRep: true })).toBe(100);
    });

    it('returns 0 for unsupported or invalid sets', () => {
        expect(estimateOneRepMax(100, 31)).toBe(0);
        expect(estimateOneRepMax(-1, 5)).toBe(0);
    });
});

describe('oneRepMax aggregation', () => {
    it('aggregates by average, highest, and lowest', () => {
        const estimates = [120, 130, 140];

        expect(aggregateOneRepMax(estimates, 'average')).toBe(130);
        expect(aggregateOneRepMax(estimates, 'highest')).toBe(140);
        expect(aggregateOneRepMax(estimates, 'lowest')).toBe(120);
    });

    it('aggregates weighted mode using factors', () => {
        const estimates = [120, 140];
        const factors = [300, 700];

        expect(aggregateOneRepMax(estimates, 'weighted', factors)).toBe(134);
    });
});
