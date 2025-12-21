import { JitterOptions } from '../types';
import { validateOptions, validateLength } from './validation';
import { runHealthTests } from './health';

// Module-level sink used to accumulate burn() results.
// This prevents aggressive optimizers/JITs from eliminating the burn loop
// under the assumption that its result is unused.
let burnSink = 0;

/**
 * CPU burn loop to increase load and induce jitter.
 * @param iterations Loop count
 */
function burn(iterations: number): number {
    let x = 0x1234567 | 0;
    for (let i = 0; i < iterations; i++) {
        x = (x * 1664525 + 1013904223) | 0;
    }
    return x;
}

/**
 * Measures the time taken to execute the burn loop.
 * @param iterations Loop count for burn
 * @returns Execution time in milliseconds
 */
export function measureOne(iterations: number): number {
    const t0 = performance.now();
    burnSink ^= burn(iterations);
    const t1 = performance.now();
    return t1 - t0;
}

/**
 * Measures the number of burn iterations until timer tick changes.
 * This is more robust in low-resolution timer environments.
 * 
 * Returns a sample value based on timerResolution:
 * - 'low': Block count only (for browsers with coarse timers)
 * - 'high': Block count * 1000 + fractional timing (for Node.js with fine timers)
 * - 'auto': Detects based on whether performance.now() has sub-ms precision
 * 
 * @param options Jitter options containing interpWork, interpPollEvery, interpMaxBlocks, timerResolution
 * @returns Sample value with timing variation
 * @throws Error if interpMaxBlocks is exceeded (freeze prevention)
 */
export function measureOneInterpolatedCount(options: JitterOptions): number {
    const work = options.interpWork ?? 256;
    const pollEvery = options.interpPollEvery ?? 1;
    const maxBlocks = options.interpMaxBlocks ?? 4096;
    const timerResolution = options.timerResolution ?? 'auto';

    const t0 = performance.now();
    let blocks = 0;

    while (true) {
        burnSink ^= burn(work);
        blocks++;

        if (blocks >= maxBlocks) {
            throw new Error(
                `Timer edge not observed within interpMaxBlocks=${maxBlocks} (possible coarse timer / throttling)`
            );
        }

        if (blocks % pollEvery === 0) {
            const t1 = performance.now();
            if (t1 !== t0) {
                // Determine resolution mode
                let useHighRes: boolean;
                if (timerResolution === 'high') {
                    useHighRes = true;
                } else if (timerResolution === 'low') {
                    useHighRes = false;
                } else {
                    // 'auto': detect based on fractional precision
                    const frac = t1 - Math.floor(t1);
                    useHighRes = frac !== 0;
                }

                if (useHighRes) {
                    // High resolution: use fractional timing for entropy
                    // Use 1023 (odd) instead of 1000 (even) so that blocks contribute to parity bit
                    const fractionalPart = (t1 * 1000) % 1000;
                    return blocks * 1023 + fractionalPart;
                } else {
                    // Low resolution: use block count only
                    return blocks;
                }
            }
        }
    }
}


/**
 * Collects a specified number of timing deltas asynchronously.
 * Yields to the event loop periodically to prevent UI freezing.
 * 
 * @param count Number of samples to collect
 * @param options Jitter options
 */
export async function sampleDeltas(
    count: number,
    options: JitterOptions = {}
): Promise<Float64Array> {
    validateLength('count', count, 1);
    const normalized = validateOptions(options);

    const result = new Float64Array(count);
    let collected = 0;

    while (collected < count) {
        const batchSize = Math.min(normalized.chunkSize, count - collected);

        for (let i = 0; i < batchSize; i++) {
            result[collected++] = normalized.timingMode === 'interpCount'
                ? measureOneInterpolatedCount(normalized)
                : measureOne(normalized.iterations);
        }

        // Yield to event loop if we have more to do
        if (collected < count) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    runHealthTests(result, normalized);

    return result;
}

// Re-export for compatibility if needed, but implementation changed significantly.
// We keep the old signature's simple wrapper for now or let it break?
// The user authorized breaking changes, so we focus on new API.
