import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { collectJitterBytes, getJitterRandom, jitterRandom256 } from '../src/core/rng';
import * as sampler from '../src/core/sampler';

describe('RNG', () => {
    beforeEach(() => {
        if (!globalThis.crypto) {
            vi.stubGlobal('crypto', {
                getRandomValues: vi.fn(),
                subtle: { digest: vi.fn() }
            });
        }
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('collectJitterBytes should return exact requested length', async () => {
        const len = 16;
        const bytes = await collectJitterBytes(len, { iterations: 100 });
        expect(bytes.length).toBe(len);
    });

    it('getJitterRandom should return hashed bytes', async () => {
        // Mock digest to return all 0xAA
        const digestSpy = vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(new Uint8Array(32).fill(0xAA).buffer);

        const bytes = await getJitterRandom(32);

        expect(bytes.length).toBe(32);
        expect(bytes[0]).toBe(0xAA);
        expect(digestSpy).toHaveBeenCalled();
    });

    it('getJitterRandom should handle length > 32 (extended generation)', async () => {
        // Mock digest to return a NEW buffer each time filled with 0xBB
        // This ensures no side effects from shared buffer references
        const digestSpy = vi.spyOn(crypto.subtle, 'digest').mockImplementation(() => Promise.resolve(new Uint8Array(32).fill(0xBB).buffer));

        const bytes = await getJitterRandom(64);

        expect(bytes.length).toBe(64);
        // First 32 bytes should be 0xBB
        expect(bytes[0]).toBe(0xBB);
        // Byte 33 should ALSO be 0xBB, verifying the loop correctly continued and hashed
        expect(bytes[32]).toBe(0xBB);
    });

    it('getJitterRandom should throw on invalid oversamplingFactor', async () => {
        await expect(getJitterRandom(16, { oversamplingFactor: 0 })).rejects.toThrow(RangeError);
        await expect(getJitterRandom(16, { oversamplingFactor: 1.5 })).rejects.toThrow(TypeError);
    });

    it('collectJitterBytes should validate input options', async () => {
        await expect(collectJitterBytes(0)).rejects.toThrow(RangeError);
        await expect(collectJitterBytes(1, { windowSize: 1 })).rejects.toThrow(RangeError);
        await expect(collectJitterBytes(1, { windowSize: 0 })).rejects.toThrow(RangeError);
        await expect(collectJitterBytes(1, { scale: 0 })).rejects.toThrow(RangeError);
        await expect(collectJitterBytes(1, { scale: -1 })).rejects.toThrow(RangeError);
    });
});
