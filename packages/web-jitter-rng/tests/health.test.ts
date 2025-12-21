import { describe, it, expect } from 'vitest';
import { runHealthTests, JitterHealthError } from '../src/core/health';

describe('duration mode health checks', () => {
    it('throws when deltas quantize to constant values', () => {
        const deltas = new Float64Array(100).fill(0.001);
        expect(() => runHealthTests(deltas, { timingMode: 'duration' })).toThrow(JitterHealthError);
    });

    it('throws when zero-diff rate is too high despite multiple values', () => {
        const deltas = new Float64Array(20);
        // Quantizes to 1 for the first 15 entries, then 2 for the last 5.
        deltas.fill(0.001, 0, 15);
        deltas.fill(0.002, 15);
        expect(() => runHealthTests(deltas, { timingMode: 'duration' })).toThrow(JitterHealthError);
    });

    it('throws when runs check detects only one sign bit value', () => {
        const deltas = new Float64Array(30);
        for (let i = 0; i < deltas.length; i++) {
            deltas[i] = 0.001 * (i + 1); // strictly increasing
        }
        expect(() => runHealthTests(deltas, { timingMode: 'duration' })).toThrow(JitterHealthError);
    });

    it('can be disabled via options', () => {
        const deltas = new Float64Array(10).fill(0.002);
        expect(() => runHealthTests(deltas, { healthCheck: false })).not.toThrow();
    });
});

describe('interpCount mode health checks', () => {
    it('throws when all diffs are zero', () => {
        // All samples are the same integer -> all diffs are 0
        const deltas = new Float64Array(100).fill(10);
        expect(() => runHealthTests(deltas, { timingMode: 'interpCount' })).toThrow(JitterHealthError);
        expect(() => runHealthTests(deltas, { timingMode: 'interpCount' })).toThrow(/nonZeroDiffs/);
    });

    it('throws when sample value diversity is too low', () => {
        // Only two unique sample values: 50 and 51 alternating
        // This should fail uniqueQCount check since we need many unique values
        const deltas = new Float64Array(100);
        for (let i = 0; i < 100; i++) {
            deltas[i] = 50 + (i % 2); // alternates between 50 and 51
        }
        // Only 2 unique q values, far below the min of 8
        expect(() => runHealthTests(deltas, { timingMode: 'interpCount' })).toThrow(/uniqueQCount/);
    });

    it('throws when parity bit is one-sided (all even diffs)', () => {
        // All even diffs -> parity always 0
        const deltas = new Float64Array(100);
        for (let i = 0; i < 100; i++) {
            // Creates diffs of 2 each time
            deltas[i] = 10 + i * 2;
        }
        // Diffs are all 2 -> parity all 0, but also fails uniqueDCount
        // Let's create more varied even diffs
        const deltas2 = new Float64Array(100);
        for (let i = 0; i < 100; i++) {
            deltas2[i] = 10 + i * 2 + (i % 10) * 2;
        }
        // Check still fails on parity or other checks
        expect(() => runHealthTests(deltas2, { timingMode: 'interpCount' })).toThrow(JitterHealthError);
    });

    it('throws when sign bit is one-sided (all positive diffs)', () => {
        // All diffs > 0 with varied step sizes -> passes uniqueDCount but fails sign minority
        const deltas = new Float64Array(300);
        let val = 100;
        for (let i = 0; i < 300; i++) {
            // Always positive steps but with varied sizes (1 to 17)
            const step = 1 + (i % 17);
            val += step;
            deltas[i] = val;
        }
        expect(() => runHealthTests(deltas, { timingMode: 'interpCount' })).toThrow(/sign minority/);
    });

    it('passes with well-distributed samples', () => {
        // Create samples that vary in a way that produces both positive and negative diffs,
        // both even and odd absolute diffs, and reasonable diversity
        const deltas = new Float64Array(300);
        // Use multiple coprime periods to create diverse step sizes
        let val = 500;
        for (let i = 0; i < 300; i++) {
            const a = ((i * 7) % 17) - 8;   // -8 to +8
            const b = ((i * 11) % 13) - 6;  // -6 to +6
            const step = a + b;              // -14 to +14
            val += step;
            deltas[i] = val;
        }
        expect(() => runHealthTests(deltas, { timingMode: 'interpCount' })).not.toThrow();
    });

    it('uses interpCount mode by default when timingMode is not specified', () => {
        // Constant samples should fail interpCount check (nonZeroDiffs)
        const deltas = new Float64Array(100).fill(42);
        expect(() => runHealthTests(deltas, {})).toThrow(/nonZeroDiffs/);
    });

    it('can be disabled via options', () => {
        const deltas = new Float64Array(100).fill(42);
        expect(() => runHealthTests(deltas, { healthCheck: false })).not.toThrow();
    });
});

