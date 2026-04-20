import { describe, expect, it } from 'vitest';

import type { Plate } from '../src/components/util';
import {
    generatePossibleWeights,
    percentageBased,
} from '../src/components/warmup-formulas';

function countWeightTransitions(weights: number[]): number {
    if (weights.length < 2) {
        return 0;
    }

    let transitions = 0;
    for (let i = 1; i < weights.length; i++) {
        if (weights[i] !== weights[i - 1]) {
            transitions += 1;
        }
    }

    return transitions;
}

describe('percentageBased minimizePlateChanges behavior', () => {
    it('maps warmup weights to achievable barbell loads when minimization is enabled', () => {
        const barWeight = 45;
        const targetWeight = 225;
        const availablePlates: Plate[] = [
            { weight: 45, available: true, count: 2 },
            { weight: 25, available: true, count: 2 },
            { weight: 10, available: true, count: 2 },
            { weight: 5, available: true, count: 2 },
        ];

        const possibleWeights = generatePossibleWeights(
            barWeight,
            targetWeight,
            availablePlates,
            false
        );

        const minimizedSets = percentageBased(
            targetWeight,
            6,
            barWeight,
            availablePlates,
            true,
            false,
            0
        );

        for (const set of minimizedSets) {
            expect(possibleWeights).toContain(set.weight);
        }
    });

    it('does not keep unreachable set weights in the optimized sequence', () => {
        const barWeight = 45;
        const targetWeight = 160;
        const availablePlates: Plate[] = [
            { weight: 45, available: true, count: 1 },
        ];

        const possibleWeights = generatePossibleWeights(
            barWeight,
            targetWeight,
            availablePlates,
            false
        );

        const minimizedSets = percentageBased(
            targetWeight,
            2,
            barWeight,
            availablePlates,
            true,
            false,
            0
        );

        for (const set of minimizedSets) {
            expect(possibleWeights).toContain(set.weight);
        }
    });

    it('reduces set-to-set weight changes under constrained plate availability', () => {
        const barWeight = 45;
        const targetWeight = 215;
        const availablePlates: Plate[] = [
            { weight: 45, available: true, count: 1 },
            { weight: 25, available: true, count: 1 },
        ];

        const minimizedSets = percentageBased(
            targetWeight,
            6,
            barWeight,
            availablePlates,
            true,
            false,
            0
        );
        const nonMinimizedSets = percentageBased(
            targetWeight,
            6,
            barWeight,
            availablePlates,
            false,
            false,
            0
        );

        const minimizedWeights = minimizedSets.map((set) => set.weight);
        const nonMinimizedWeights = nonMinimizedSets.map((set) => set.weight);

        const minimizedTransitions = countWeightTransitions(minimizedWeights);
        const nonMinimizedTransitions = countWeightTransitions(nonMinimizedWeights);

        expect(minimizedTransitions).toBeLessThan(nonMinimizedTransitions);
    });

    it('keeps warmups at bar weight when no plates are available', () => {
        const barWeight = 45;
        const targetWeight = 225;
        const unavailablePlates: Plate[] = [
            { weight: 45, available: false, count: 0 },
            { weight: 25, available: false, count: 0 },
        ];

        const minimizedSets = percentageBased(
            targetWeight,
            6,
            barWeight,
            unavailablePlates,
            true,
            false,
            0
        );

        for (const set of minimizedSets) {
            expect(set.weight).toBe(barWeight);
        }
    });
});
