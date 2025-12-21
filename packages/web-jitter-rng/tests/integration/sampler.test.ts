import { describe, it, expect } from 'vitest';
import { sampleDeltas, measureOne, measureOneInterpolatedCount } from '../../src/core/sampler';

describe('sampler', () => {
    it('measureOne should return positive number', () => {
        const val = measureOne(100);
        expect(val).toBeGreaterThan(0);
    });

    it('measureOneInterpolatedCount should return positive block count', () => {
        const count = measureOneInterpolatedCount({});
        expect(count).toBeGreaterThan(0);
    });

    it('measureOneInterpolatedCount should throw when interpMaxBlocks is exceeded', () => {
        // Use very small maxBlocks and large pollEvery to force timeout
        expect(() =>
            measureOneInterpolatedCount({
                interpMaxBlocks: 1,
                interpPollEvery: 100, // Never poll, so we hit maxBlocks first
            })
        ).toThrow(/Timer edge not observed/);
    });

    it('sampleDeltas should return requested number of samples (default interpCount mode)', async () => {
        const count = 10;
        const deltas = await sampleDeltas(count, { healthCheck: false });
        expect(deltas.length).toBe(count);
        expect(deltas[0]).toBeGreaterThan(0);
    });

    it('sampleDeltas with duration mode should work', async () => {
        const count = 10;
        const deltas = await sampleDeltas(count, {
            timingMode: 'duration',
            iterations: 100,
            healthCheck: false,
        });
        expect(deltas.length).toBe(count);
        expect(deltas[0]).toBeGreaterThan(0);
    });

    it('sampleDeltas with interpCount mode should work', async () => {
        const count = 10;
        const deltas = await sampleDeltas(count, {
            timingMode: 'interpCount',
            healthCheck: false,
        });
        expect(deltas.length).toBe(count);
        expect(deltas[0]).toBeGreaterThan(0);
    });

    it('sampleDeltas should execute in chunks (not freeze)', async () => {
        // Ideally we would mock timers or performace, but for basic check:
        const start = performance.now();
        // Ask for enough samples to trigger chunking (default chunk 50 for interpCount)
        await sampleDeltas(100, { healthCheck: false, chunkSize: 20 });
        const end = performance.now();

        // It should have taken at least some time, and returned successfully.
        // The main thing is it didn't crash or timeout.
        expect(end - start).toBeGreaterThan(0);
    });

    it('sampleDeltas should throw on non-positive chunkSize', async () => {
        await expect(sampleDeltas(10, { chunkSize: 0 })).rejects.toThrow(RangeError);
        await expect(sampleDeltas(10, { chunkSize: 1.1 })).rejects.toThrow(TypeError);
    });

    it('measureOneInterpolatedCount with timerResolution high should return large values', () => {
        const count = measureOneInterpolatedCount({ timerResolution: 'high' });
        // High resolution mode returns blocks * 1000 + fractionalPart
        // So the value should be at least 1000
        expect(count).toBeGreaterThanOrEqual(1000);
    });

    it('measureOneInterpolatedCount with timerResolution low should return small values', () => {
        const count = measureOneInterpolatedCount({ timerResolution: 'low' });
        // Low resolution mode returns blocks only (typically 1-100)
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThan(1000);
    });

    it('measureOneInterpolatedCount with timerResolution auto should work', () => {
        const count = measureOneInterpolatedCount({ timerResolution: 'auto' });
        expect(count).toBeGreaterThan(0);
    });
});

