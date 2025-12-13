import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { collectJitterBytes, getJitterRandom, jitterRandom256 } from '../src/core/rng';
import * as sampler from '../src/core/sampler';

describe('RNG', () => {
    beforeEach(() => {
        if (!globalThis.crypto) {
            vi.stubGlobal('crypto', {
                getRandomValues: vi.fn(),
                subtle: { digest: vi.fn(), sign: vi.fn(), importKey: vi.fn() }
            });
        } else if (!crypto.subtle) {
            // @ts-expect-error partial polyfill for tests
            crypto.subtle = { digest: vi.fn(), sign: vi.fn(), importKey: vi.fn() } as any;
        }
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('collectJitterBytes should return exact requested length', async () => {
        const len = 16;
        vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(new Uint8Array(32).fill(0x11).buffer);
        vi.spyOn(crypto.subtle, 'sign').mockResolvedValue(new Uint8Array(32).fill(0x22).buffer);
        vi.spyOn(crypto.subtle, 'importKey').mockResolvedValue({} as CryptoKey);
        vi.spyOn(sampler, 'sampleDeltas').mockResolvedValue(new Float64Array(100).map((_, i) => i * 0.001 + 0.1));

        const bytes = await collectJitterBytes(len, { iterations: 100, healthCheck: false });
        expect(bytes.length).toBe(len);
    });

    it('getJitterRandom should return hashed bytes', async () => {
        // Mock digest to return all 0xAA
        const digestSpy = vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(new Uint8Array(32).fill(0xAA).buffer);
        const signSpy = vi.spyOn(crypto.subtle, 'sign').mockResolvedValue(new Uint8Array(32).fill(0xBB).buffer);
        vi.spyOn(crypto.subtle, 'importKey').mockResolvedValue({} as CryptoKey);
        vi.spyOn(sampler, 'sampleDeltas').mockResolvedValue(new Float64Array(100).map((_, i) => i * 0.001 + 0.1));

        const bytes = await getJitterRandom(32, { healthCheck: false });

        expect(bytes.length).toBe(32);
        expect(bytes[0]).toBe(0xBB);
        expect(digestSpy).toHaveBeenCalled();
        expect(signSpy).toHaveBeenCalled();
    });

    it('getJitterRandom should handle length > 32 (extended generation)', async () => {
        // Mock digest to return a NEW buffer each time filled with 0xBB
        // This ensures no side effects from shared buffer references
        const digestSpy = vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(new Uint8Array(32).fill(0xBB).buffer);
        const signSpy = vi.spyOn(crypto.subtle, 'sign').mockResolvedValue(new Uint8Array(32).fill(0xCC).buffer);
        vi.spyOn(crypto.subtle, 'importKey').mockResolvedValue({} as CryptoKey);
        vi.spyOn(sampler, 'sampleDeltas').mockResolvedValue(new Float64Array(200).map((_, i) => i * 0.001 + 0.1));

        const bytes = await getJitterRandom(64, { healthCheck: false });

        expect(bytes.length).toBe(64);
        expect(bytes[0]).toBe(0xCC);
        expect(bytes[32]).toBe(0xCC);
        expect(signSpy).toHaveBeenCalledTimes(2);
        expect(digestSpy).toHaveBeenCalled();
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
        await expect(collectJitterBytes(1, { minUniqueRate: -0.1 })).rejects.toThrow(RangeError);
        await expect(collectJitterBytes(1, { maxZeroDiffRate: 1.5 })).rejects.toThrow(RangeError);
        await expect(collectJitterBytes(1, { minRunsRate: 2 })).rejects.toThrow(RangeError);
    });
});
