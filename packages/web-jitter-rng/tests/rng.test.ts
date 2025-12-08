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
        // Real implementation should generate full random bytes, not just pad with zero.
        // We mock digest to return a known pattern to verify concatenation logic if we want,
        // but here we just want to ensure it's NOT zero-padded.

        // Let's restore original implementation for this test or partially mock?
        // The mock in beforeEach mocks 'crypto.subtle.digest' globally. 
        // We need to adjust the mock to allow multiple calls or just return something non-zero.

        // Reset mock for this test to return a specific sequence per call potentially?
        // Or just use the existing mock which returns 0xAA filled array.
        const digestSpy = vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(new Uint8Array(32).fill(0xBB).buffer);

        const bytes = await getJitterRandom(64);

        expect(bytes.length).toBe(64);
        // First 32 bytes should be 0xBB
        expect(bytes[0]).toBe(0xBB);
        // Byte 33 should ALSO be 0xBB (if we implement loop correctly) 
        // Currently it is 0 because of the bug.
        expect(bytes[32]).toBe(0xBB);
    });
});
