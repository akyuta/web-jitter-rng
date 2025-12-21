import { JitterOptions } from '../types';

export class JitterHealthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'JitterHealthError';
    }
}

// ============================================================================
// Duration Mode Helper Functions (legacy)
// ============================================================================

function quantizeDuration(deltas: Float64Array, scale: number): Int32Array {
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

/**
 * Duration mode health checks (legacy mode).
 * Uses unique rate, zero-diff rate, and runs checks.
 */
function runDurationHealthTests(deltas: Float64Array, options: JitterOptions): void {
    const scale = options.scale ?? 1000;
    const minUniqueRate = options.minUniqueRate ?? 0.05;
    const maxZeroDiffRate = options.maxZeroDiffRate ?? 0.6;
    const minRunsRate = options.minRunsRate ?? 0.02;

    const q = quantizeDuration(deltas, scale);

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

// ============================================================================
// InterpCount Mode Helper Functions
// ============================================================================

/**
 * Computes a simple runs rate for a bit sequence.
 * Returns the number of runs divided by the length of the sequence.
 */
function computeRunsRate(bits: Uint8Array): number {
    if (bits.length < 2) return 0;
    let runs = 1;
    for (let i = 1; i < bits.length; i++) {
        if (bits[i] !== bits[i - 1]) runs++;
    }
    return runs / bits.length;
}

/**
 * InterpCount mode health checks.
 * Focuses on diff-based analysis and bit survival verification.
 */
function runInterpCountHealthTests(deltas: Float64Array, options: JitterOptions): void {
    const n = deltas.length;
    if (n < 2) return;

    // Quantize (no scale for interpCount)
    const q = new Int32Array(n);
    for (let i = 0; i < n; i++) {
        q[i] = Math.trunc(deltas[i]);
    }

    // Compute diffs: d[i] = q[i+1] - q[i]
    const d = new Int32Array(n - 1);
    for (let i = 1; i < n; i++) {
        d[i - 1] = q[i] - q[i - 1];
    }

    const diffCount = d.length;

    // -------------------------------------------------------------------------
    // 1. NonZeroDiffs check
    // -------------------------------------------------------------------------
    const minNonZeroDiffs = Math.max(4, Math.floor(diffCount * 0.05));
    let nonZeroDiffs = 0;
    for (const diff of d) {
        if (diff !== 0) nonZeroDiffs++;
    }
    if (nonZeroDiffs < minNonZeroDiffs) {
        throw new JitterHealthError(
            `Health check failed: nonZeroDiffs ${nonZeroDiffs} < ${minNonZeroDiffs}`
        );
    }

    // -------------------------------------------------------------------------
    // 2. Sample value diversity check
    // In interpCount mode, consecutive diff values are often small (0, 1, 2),
    // but the sample values themselves should be diverse.
    // -------------------------------------------------------------------------
    const minUniqueQCount = Math.max(8, Math.floor(n * 0.05));
    const uniqueQ = new Set<number>();
    for (const val of q) {
        uniqueQ.add(val);
    }
    if (uniqueQ.size < minUniqueQCount) {
        throw new JitterHealthError(
            `Health check failed: uniqueQCount ${uniqueQ.size} < ${minUniqueQCount}`
        );
    }


    // -------------------------------------------------------------------------
    // 3. Bit survival checks (most important)
    // -------------------------------------------------------------------------
    const minMinorityCount = 2;

    // signBit: 1 if diff > 0, 0 otherwise
    let signZero = 0, signOne = 0;
    // parityBit: 1 if abs(diff) is odd, 0 if even
    let parityZero = 0, parityOne = 0;

    const signBits = new Uint8Array(diffCount);
    const parityBits = new Uint8Array(diffCount);

    for (let i = 0; i < diffCount; i++) {
        const diff = d[i];
        // signBit
        if (diff > 0) {
            signBits[i] = 1;
            signOne++;
        } else {
            signBits[i] = 0;
            signZero++;
        }
        // parityBit
        if ((Math.abs(diff) & 1) === 1) {
            parityBits[i] = 1;
            parityOne++;
        } else {
            parityBits[i] = 0;
            parityZero++;
        }
    }

    const signMinority = Math.min(signZero, signOne);
    if (signMinority < minMinorityCount) {
        throw new JitterHealthError(
            `Health check failed: sign minority ${signMinority} < ${minMinorityCount}`
        );
    }

    const parityMinority = Math.min(parityZero, parityOne);
    if (parityMinority < minMinorityCount) {
        throw new JitterHealthError(
            `Health check failed: parity minority ${parityMinority} < ${minMinorityCount}`
        );
    }

    // -------------------------------------------------------------------------
    // 4. Simplified runs check (relaxed threshold to avoid false positives)
    // Only catches extreme monotonic sequences.
    // -------------------------------------------------------------------------
    const minRunsRate = options.minRunsRate ?? 0.02;

    const signRunsRate = computeRunsRate(signBits);
    if (signRunsRate < minRunsRate) {
        throw new JitterHealthError(
            `Health check failed: sign runs rate ${signRunsRate.toFixed(4)} < ${minRunsRate}`
        );
    }

    const parityRunsRate = computeRunsRate(parityBits);
    if (parityRunsRate < minRunsRate) {
        throw new JitterHealthError(
            `Health check failed: parity runs rate ${parityRunsRate.toFixed(4)} < ${minRunsRate}`
        );
    }
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Runs health tests on collected deltas.
 * Dispatches to the appropriate test suite based on timingMode.
 */
export function runHealthTests(deltas: Float64Array, options: JitterOptions): void {
    if (options.healthCheck === false) return;
    if (deltas.length === 0) {
        throw new JitterHealthError('No samples collected for health check');
    }

    const timingMode = options.timingMode ?? 'interpCount';

    if (timingMode === 'interpCount') {
        runInterpCountHealthTests(deltas, options);
    } else {
        runDurationHealthTests(deltas, options);
    }
}
