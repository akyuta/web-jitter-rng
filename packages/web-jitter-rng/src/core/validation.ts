import { JitterOptions } from '../types';

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
}
