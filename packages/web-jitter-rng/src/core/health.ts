import { JitterOptions } from '../types';

export class JitterHealthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'JitterHealthError';
    }
}

function quantize(deltas: Float64Array, scale: number): Int32Array {
    const q = new Int32Array(deltas.length);
    for (let i = 0; i < deltas.length; i++) {
        q[i] = Math.round(deltas[i] * scale);
    }
    return q;
}

function uniqueRate(values: Int32Array): number {
    const seen = new Set<number>();
    for (const v of values) {
        seen.add(v);
    }
    return seen.size / values.length;
}

function zeroDiffRate(values: Int32Array): number {
    if (values.length < 2) return 0;
    let zero = 0;
    for (let i = 1; i < values.length; i++) {
        if (values[i] === values[i - 1]) zero++;
    }
    return zero / (values.length - 1);
}

function runBitChecks(values: Int32Array): { hasBoth: boolean; runsRate: number } {
    if (values.length < 2) return { hasBoth: false, runsRate: 0 };
    const bits = new Uint8Array(values.length - 1);
    for (let i = 1; i < values.length; i++) {
        bits[i - 1] = values[i] > values[i - 1] ? 1 : 0;
    }

    const hasZero = bits.includes(0);
    const hasOne = bits.includes(1);

    let runs = 1;
    for (let i = 1; i < bits.length; i++) {
        if (bits[i] !== bits[i - 1]) runs++;
    }

    return { hasBoth: hasZero && hasOne, runsRate: runs / bits.length };
}

export function runHealthTests(deltas: Float64Array, options: JitterOptions): void {
    if (options.healthCheck === false) return;
    if (deltas.length === 0) {
        throw new JitterHealthError('No samples collected for health check');
    }

    const scale = options.scale ?? 1000;
    const minUniqueRate = options.minUniqueRate ?? 0.05;
    const maxZeroDiffRate = options.maxZeroDiffRate ?? 0.6;
    const minRunsRate = options.minRunsRate ?? 0.02;

    const q = quantize(deltas, scale);

    if (q.length < 2) {
        return; // Not enough data to evaluate diffs/runs meaningfully.
    }

    const uRate = uniqueRate(q);
    if (uRate < minUniqueRate) {
        throw new JitterHealthError(`Health check failed: unique rate ${uRate.toFixed(4)} < ${minUniqueRate}`);
    }

    const zRate = zeroDiffRate(q);
    if (zRate > maxZeroDiffRate) {
        throw new JitterHealthError(`Health check failed: zero-diff rate ${zRate.toFixed(4)} > ${maxZeroDiffRate}`);
    }

    const { hasBoth, runsRate } = runBitChecks(q);
    if (!hasBoth) {
        throw new JitterHealthError('Health check failed: sign bits lack variability');
    }
    if (runsRate < minRunsRate) {
        throw new JitterHealthError(`Health check failed: runs rate ${runsRate.toFixed(4)} < ${minRunsRate}`);
    }
}
