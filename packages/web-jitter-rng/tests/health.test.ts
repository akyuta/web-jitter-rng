import { describe, it, expect } from 'vitest';
import { runHealthTests, JitterHealthError } from '../src/core/health';

describe('health checks', () => {
    it('throws when deltas quantize to constant values', () => {
        const deltas = new Float64Array(100).fill(0.001);
        expect(() => runHealthTests(deltas, {})).toThrow(JitterHealthError);
    });

    it('throws when zero-diff rate is too high despite multiple values', () => {
        const deltas = new Float64Array(20);
        // Quantizes to 1 for the first 15 entries, then 2 for the last 5.
        deltas.fill(0.001, 0, 15);
        deltas.fill(0.002, 15);
        expect(() => runHealthTests(deltas, {})).toThrow(JitterHealthError);
    });

    it('throws when runs check detects only one sign bit value', () => {
        const deltas = new Float64Array(30);
        for (let i = 0; i < deltas.length; i++) {
            deltas[i] = 0.001 * (i + 1); // strictly increasing
        }
        expect(() => runHealthTests(deltas, {})).toThrow(JitterHealthError);
    });

    it('can be disabled via options', () => {
        const deltas = new Float64Array(10).fill(0.002);
        expect(() => runHealthTests(deltas, { healthCheck: false })).not.toThrow();
    });
});
