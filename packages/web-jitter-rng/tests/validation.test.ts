import { describe, it, expect } from 'vitest';
import { validateOptions, DEFAULT_OPTIONS } from '../src/core/validation';

describe('validateOptions', () => {
    describe('default values', () => {
        it('should return all default values when called with no arguments', () => {
            const result = validateOptions();

            expect(result.timingMode).toBe('interpCount');
            expect(result.iterations).toBe(500000);
            expect(result.scale).toBe(1000);
            expect(result.windowSize).toBe(256);
            expect(result.oversamplingFactor).toBe(4);
            expect(result.chunkSize).toBe(50);
            expect(result.healthCheck).toBe(true);
            expect(result.minUniqueRate).toBe(0.05);
            expect(result.maxZeroDiffRate).toBe(0.6);
            expect(result.minRunsRate).toBe(0.02);
            expect(result.interpWork).toBe(256);
            expect(result.interpPollEvery).toBe(1);
            expect(result.interpMaxBlocks).toBe(4096);
            expect(result.timerResolution).toBe('auto');
        });

        it('should return all default values when called with empty object', () => {
            const result = validateOptions({});

            expect(result.timingMode).toBe('interpCount');
            expect(result.interpWork).toBe(256);
            expect(result.interpPollEvery).toBe(1);
            expect(result.interpMaxBlocks).toBe(4096);
        });

        it('should use chunkSize=50 for interpCount mode (default)', () => {
            const result = validateOptions({});
            expect(result.chunkSize).toBe(50);
        });

        it('should use chunkSize=100 for duration mode', () => {
            const result = validateOptions({ timingMode: 'duration' });
            expect(result.chunkSize).toBe(100);
        });

        it('should preserve explicit chunkSize regardless of timingMode', () => {
            const result = validateOptions({ timingMode: 'duration', chunkSize: 25 });
            expect(result.chunkSize).toBe(25);
        });
    });

    describe('timingMode validation', () => {
        it('should accept "duration"', () => {
            const result = validateOptions({ timingMode: 'duration' });
            expect(result.timingMode).toBe('duration');
        });

        it('should accept "interpCount"', () => {
            const result = validateOptions({ timingMode: 'interpCount' });
            expect(result.timingMode).toBe('interpCount');
        });

        it('should throw TypeError for invalid timingMode string', () => {
            expect(() => validateOptions({ timingMode: 'invalid' as any }))
                .toThrow(TypeError);
            expect(() => validateOptions({ timingMode: 'invalid' as any }))
                .toThrow(/timingMode must be/);
        });
    });

    describe('interpWork validation', () => {
        it('should throw RangeError for interpWork = 0', () => {
            expect(() => validateOptions({ interpWork: 0 }))
                .toThrow(RangeError);
            expect(() => validateOptions({ interpWork: 0 }))
                .toThrow(/interpWork must be >= 1/);
        });

        it('should throw RangeError for interpWork = -1', () => {
            expect(() => validateOptions({ interpWork: -1 }))
                .toThrow(RangeError);
        });

        it('should throw TypeError for interpWork = 1.5 (non-integer)', () => {
            expect(() => validateOptions({ interpWork: 1.5 }))
                .toThrow(TypeError);
            expect(() => validateOptions({ interpWork: 1.5 }))
                .toThrow(/interpWork must be an integer/);
        });

        it('should throw TypeError for interpWork = NaN', () => {
            expect(() => validateOptions({ interpWork: NaN }))
                .toThrow(TypeError);
            expect(() => validateOptions({ interpWork: NaN }))
                .toThrow(/interpWork must be a finite number/);
        });

        it('should accept valid interpWork values', () => {
            expect(validateOptions({ interpWork: 1 }).interpWork).toBe(1);
            expect(validateOptions({ interpWork: 100 }).interpWork).toBe(100);
            expect(validateOptions({ interpWork: 512 }).interpWork).toBe(512);
        });
    });

    describe('interpPollEvery validation', () => {
        it('should throw RangeError for interpPollEvery = 0', () => {
            expect(() => validateOptions({ interpPollEvery: 0 }))
                .toThrow(RangeError);
        });

        it('should throw TypeError for interpPollEvery = 2.5 (non-integer)', () => {
            expect(() => validateOptions({ interpPollEvery: 2.5 }))
                .toThrow(TypeError);
        });

        it('should throw TypeError for interpPollEvery = NaN', () => {
            expect(() => validateOptions({ interpPollEvery: NaN }))
                .toThrow(TypeError);
        });

        it('should accept valid interpPollEvery values', () => {
            expect(validateOptions({ interpPollEvery: 1 }).interpPollEvery).toBe(1);
            expect(validateOptions({ interpPollEvery: 5 }).interpPollEvery).toBe(5);
        });
    });

    describe('interpMaxBlocks validation', () => {
        it('should throw RangeError for interpMaxBlocks = 0', () => {
            expect(() => validateOptions({ interpMaxBlocks: 0 }))
                .toThrow(RangeError);
        });

        it('should throw TypeError for interpMaxBlocks = 100.5 (non-integer)', () => {
            expect(() => validateOptions({ interpMaxBlocks: 100.5 }))
                .toThrow(TypeError);
        });

        it('should throw TypeError for interpMaxBlocks = NaN', () => {
            expect(() => validateOptions({ interpMaxBlocks: NaN }))
                .toThrow(TypeError);
        });

        it('should accept valid interpMaxBlocks values', () => {
            expect(validateOptions({ interpMaxBlocks: 1 }).interpMaxBlocks).toBe(1);
            expect(validateOptions({ interpMaxBlocks: 8192 }).interpMaxBlocks).toBe(8192);
        });
    });

    describe('chunkSize validation', () => {
        it('should throw RangeError for chunkSize = 0', () => {
            expect(() => validateOptions({ chunkSize: 0 }))
                .toThrow(RangeError);
        });

        it('should throw TypeError for chunkSize = 10.5 (non-integer)', () => {
            expect(() => validateOptions({ chunkSize: 10.5 }))
                .toThrow(TypeError);
        });

        it('should throw TypeError for chunkSize = NaN', () => {
            expect(() => validateOptions({ chunkSize: NaN }))
                .toThrow(TypeError);
        });

        it('should accept valid chunkSize values', () => {
            expect(validateOptions({ chunkSize: 1 }).chunkSize).toBe(1);
            expect(validateOptions({ chunkSize: 200 }).chunkSize).toBe(200);
        });
    });

    describe('timerResolution validation', () => {
        it('should accept "auto"', () => {
            expect(validateOptions({ timerResolution: 'auto' }).timerResolution).toBe('auto');
        });

        it('should accept "high"', () => {
            expect(validateOptions({ timerResolution: 'high' }).timerResolution).toBe('high');
        });

        it('should accept "low"', () => {
            expect(validateOptions({ timerResolution: 'low' }).timerResolution).toBe('low');
        });

        it('should throw TypeError for invalid timerResolution', () => {
            expect(() => validateOptions({ timerResolution: 'medium' as any }))
                .toThrow(TypeError);
        });
    });

    describe('iterations validation', () => {
        it('should throw RangeError for iterations = 0', () => {
            expect(() => validateOptions({ iterations: 0 }))
                .toThrow(RangeError);
        });

        it('should throw TypeError for iterations = 1000.5 (non-integer)', () => {
            expect(() => validateOptions({ iterations: 1000.5 }))
                .toThrow(TypeError);
        });

        it('should accept valid iterations values', () => {
            expect(validateOptions({ iterations: 1 }).iterations).toBe(1);
            expect(validateOptions({ iterations: 1000000 }).iterations).toBe(1000000);
        });
    });

    describe('probability options validation', () => {
        it('should throw RangeError for minUniqueRate < 0', () => {
            expect(() => validateOptions({ minUniqueRate: -0.1 }))
                .toThrow(RangeError);
        });

        it('should throw RangeError for minUniqueRate > 1', () => {
            expect(() => validateOptions({ minUniqueRate: 1.5 }))
                .toThrow(RangeError);
        });

        it('should throw RangeError for maxZeroDiffRate < 0', () => {
            expect(() => validateOptions({ maxZeroDiffRate: -0.1 }))
                .toThrow(RangeError);
        });

        it('should throw RangeError for minRunsRate > 1', () => {
            expect(() => validateOptions({ minRunsRate: 2.0 }))
                .toThrow(RangeError);
        });
    });

    describe('DEFAULT_OPTIONS constant', () => {
        it('should have timingMode = interpCount', () => {
            expect(DEFAULT_OPTIONS.timingMode).toBe('interpCount');
        });

        it('should have all required fields', () => {
            expect(DEFAULT_OPTIONS.iterations).toBeDefined();
            expect(DEFAULT_OPTIONS.scale).toBeDefined();
            expect(DEFAULT_OPTIONS.windowSize).toBeDefined();
            expect(DEFAULT_OPTIONS.oversamplingFactor).toBeDefined();
            expect(DEFAULT_OPTIONS.chunkSize).toBeDefined();
            expect(DEFAULT_OPTIONS.healthCheck).toBeDefined();
            expect(DEFAULT_OPTIONS.minUniqueRate).toBeDefined();
            expect(DEFAULT_OPTIONS.maxZeroDiffRate).toBeDefined();
            expect(DEFAULT_OPTIONS.minRunsRate).toBeDefined();
            expect(DEFAULT_OPTIONS.timingMode).toBeDefined();
            expect(DEFAULT_OPTIONS.interpWork).toBeDefined();
            expect(DEFAULT_OPTIONS.interpPollEvery).toBeDefined();
            expect(DEFAULT_OPTIONS.interpMaxBlocks).toBeDefined();
            expect(DEFAULT_OPTIONS.timerResolution).toBeDefined();
        });
    });
});
