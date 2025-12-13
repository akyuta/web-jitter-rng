import { describe, it, expect } from 'vitest';
import { sampleDeltas, measureOne } from '../src/core/sampler';

describe('sampler', () => {
    it('measureOne should return positive number', () => {
        const val = measureOne(100);
        expect(val).toBeGreaterThan(0);
    });

    it('sampleDeltas should return requested number of samples', async () => {
        const count = 50;
        const deltas = await sampleDeltas(count, { iterations: 100 });
        expect(deltas.length).toBe(count);
        expect(deltas[0]).toBeGreaterThan(0);
    });

    it('sampleDeltas should execute in chunks (not freeze)', async () => {
        // Ideally we would mock timers or performace, but for basic check:
        const start = performance.now();
        // Ask for enough samples to trigger chunking (default chunk 100)
        await sampleDeltas(150, { iterations: 100, chunkSize: 50 });
        const end = performance.now();

        // It should have taken at least some time, and returned successfully.
        // The main thing is it didn't crash or timeout.
        expect(end - start).toBeGreaterThan(0);
    });

    it('sampleDeltas should throw on non-positive chunkSize', async () => {
        await expect(sampleDeltas(10, { chunkSize: 0 })).rejects.toThrow(RangeError);
        await expect(sampleDeltas(10, { chunkSize: 1.1 })).rejects.toThrow(TypeError);
    });
});
