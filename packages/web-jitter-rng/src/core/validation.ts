import { JitterOptions, NormalizedOptions } from '../types';

function assertIntegerAtLeast(name: string, value: number, min: number) {
    if (!Number.isFinite(value)) {
        throw new TypeError(`${name} must be a finite number`);
    }

    if (!Number.isInteger(value)) {
        throw new TypeError(`${name} must be an integer`);
    }

    if (value < min) {
        throw new RangeError(`${name} must be >= ${min}`);
    }
}

function assertPositiveNumber(name: string, value: number) {
    if (!Number.isFinite(value)) {
        throw new TypeError(`${name} must be a finite number`);
    }

    if (value <= 0) {
        throw new RangeError(`${name} must be > 0`);
    }
}

function assertProbability(name: string, value: number) {
    if (!Number.isFinite(value)) {
        throw new TypeError(`${name} must be a finite number`);
    }

    if (value < 0 || value > 1) {
        throw new RangeError(`${name} must be within [0, 1]`);
    }
}

export function validateLength(name: string, value: number, min = 1): void {
    assertIntegerAtLeast(name, value, min);
}

export function validateJitterOptions(options: JitterOptions): void {
    if (options.iterations !== undefined) {
        assertIntegerAtLeast('iterations', options.iterations, 1);
    }

    if (options.chunkSize !== undefined) {
        assertIntegerAtLeast('chunkSize', options.chunkSize, 1);
    }

    if (options.windowSize !== undefined) {
        assertIntegerAtLeast('windowSize', options.windowSize, 2);
    }

    if (options.scale !== undefined) {
        assertPositiveNumber('scale', options.scale);
    }

    if (options.oversamplingFactor !== undefined) {
        assertIntegerAtLeast('oversamplingFactor', options.oversamplingFactor, 1);
    }

    if (options.minUniqueRate !== undefined) {
        assertProbability('minUniqueRate', options.minUniqueRate);
    }

    if (options.maxZeroDiffRate !== undefined) {
        assertProbability('maxZeroDiffRate', options.maxZeroDiffRate);
    }

    if (options.minRunsRate !== undefined) {
        assertProbability('minRunsRate', options.minRunsRate);
    }

    if (options.timingMode !== undefined &&
        options.timingMode !== 'duration' &&
        options.timingMode !== 'interpCount') {
        throw new TypeError(`timingMode must be 'duration' or 'interpCount'`);
    }

    if (options.interpWork !== undefined) {
        assertIntegerAtLeast('interpWork', options.interpWork, 1);
    }

    if (options.interpPollEvery !== undefined) {
        assertIntegerAtLeast('interpPollEvery', options.interpPollEvery, 1);
    }

    if (options.interpMaxBlocks !== undefined) {
        assertIntegerAtLeast('interpMaxBlocks', options.interpMaxBlocks, 1);
    }

    if (options.timerResolution !== undefined &&
        options.timerResolution !== 'auto' &&
        options.timerResolution !== 'high' &&
        options.timerResolution !== 'low') {
        throw new TypeError(`timerResolution must be 'auto', 'high', or 'low'`);
    }
}

/**
 * Default option values used when not specified.
 */
export const DEFAULT_OPTIONS: NormalizedOptions = {
    iterations: 500000,
    scale: 1000,
    windowSize: 256,
    oversamplingFactor: 4,
    chunkSize: 50, // Default for interpCount mode
    healthCheck: true,
    minUniqueRate: 0.05,
    maxZeroDiffRate: 0.6,
    minRunsRate: 0.02,
    timingMode: 'interpCount',
    interpWork: 256,
    interpPollEvery: 1,
    interpMaxBlocks: 4096,
    timerResolution: 'auto',
};

/**
 * Validates and normalizes jitter options.
 * 
 * - Validates all provided options (throws TypeError/RangeError on invalid input)
 * - Fills in default values for any unspecified options
 * - Returns a fully populated NormalizedOptions object
 * 
 * @param options Optional partial jitter options
 * @returns Fully normalized options with all defaults applied
 * @throws TypeError if any option has an invalid type
 * @throws RangeError if any option is out of valid range
 */
export function validateOptions(options?: JitterOptions): NormalizedOptions {
    const opts = options ?? {};
    validateJitterOptions(opts);

    const timingMode = opts.timingMode ?? DEFAULT_OPTIONS.timingMode;
    // chunkSize default depends on timingMode
    const defaultChunkSize = timingMode === 'interpCount' ? 50 : 100;

    return {
        iterations: opts.iterations ?? DEFAULT_OPTIONS.iterations,
        scale: opts.scale ?? DEFAULT_OPTIONS.scale,
        windowSize: opts.windowSize ?? DEFAULT_OPTIONS.windowSize,
        oversamplingFactor: opts.oversamplingFactor ?? DEFAULT_OPTIONS.oversamplingFactor,
        chunkSize: opts.chunkSize ?? defaultChunkSize,
        healthCheck: opts.healthCheck ?? DEFAULT_OPTIONS.healthCheck,
        minUniqueRate: opts.minUniqueRate ?? DEFAULT_OPTIONS.minUniqueRate,
        maxZeroDiffRate: opts.maxZeroDiffRate ?? DEFAULT_OPTIONS.maxZeroDiffRate,
        minRunsRate: opts.minRunsRate ?? DEFAULT_OPTIONS.minRunsRate,
        timingMode,
        interpWork: opts.interpWork ?? DEFAULT_OPTIONS.interpWork,
        interpPollEvery: opts.interpPollEvery ?? DEFAULT_OPTIONS.interpPollEvery,
        interpMaxBlocks: opts.interpMaxBlocks ?? DEFAULT_OPTIONS.interpMaxBlocks,
        timerResolution: opts.timerResolution ?? DEFAULT_OPTIONS.timerResolution,
    };
}
