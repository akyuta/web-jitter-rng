import { describe, it, expect } from 'vitest';
// @ts-ignore - handling potential type definition issues with the library
import randomnessImport from 'randomness';
import { getJitterRandom } from '../src/core/rng';

// Handle CJS/ESM interop issues where the library might be nested in default.default or similar
// @ts-ignore
const randomness = randomnessImport.default || randomnessImport;

describe('Randomness Quality Sanity Checks', () => {

    it('should be able to access randomness functions', () => {
        expect(randomness).toBeDefined();
        // Check if we need another level of unwrapping
        const r = randomness.monobitTest ? randomness : randomness.default;
        expect(r).toBeDefined();
        expect(r.monobitTest).toBeDefined();
        expect(r.runsTest).toBeDefined();
    });

    it('should pass basic monobit test interface check', async () => {
        const r = randomness.monobitTest ? randomness : randomness.default;

        // Generate a small sample (128 bits = 16 bytes)
        const bytes = await getJitterRandom(16);

        // Convert to bits array (0 or 1)
        const bits: number[] = [];
        for (const byte of bytes) {
            for (let i = 7; i >= 0; i--) {
                bits.push((byte >> i) & 1);
            }
        }

        const result = r.monobitTest(bits);
        // Expect [boolean, number]
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
        expect(typeof result[0]).toBe('boolean');
        expect(typeof result[1]).toBe('number');
        expect(result[1]).toBeGreaterThanOrEqual(0);
        expect(result[1]).toBeLessThanOrEqual(1);
    });

    it('should pass basic runs test interface check', async () => {
        const r = randomness.monobitTest ? randomness : randomness.default;

        const bytes = await getJitterRandom(32); // runs test might need more bits theoretically but for sanity check ok
        const bits: number[] = [];
        for (const byte of bytes) {
            for (let i = 7; i >= 0; i--) {
                bits.push((byte >> i) & 1);
            }
        }

        const result = r.runsTest(bits);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
        expect(typeof result[0]).toBe('boolean');
        expect(typeof result[1]).toBe('number');
        expect(result[1]).toBeGreaterThanOrEqual(0);
        expect(result[1]).toBeLessThanOrEqual(1);
    });
});
