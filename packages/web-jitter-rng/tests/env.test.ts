import { describe, it, expect, vi, afterEach } from 'vitest';
import { getJitterRandom } from '../src/core/rng';

describe('Environment Edge Cases', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should fail if crypto is missing for hashed RNG', async () => {
        vi.stubGlobal('crypto', undefined);
        await expect(getJitterRandom(32)).rejects.toThrow();
    });
});
