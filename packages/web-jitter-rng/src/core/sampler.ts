import { JitterOptions } from '../types';

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
    burn(iterations);
    const t1 = performance.now();
    return t1 - t0;
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
    const iterations = options.iterations ?? 500000;
    const chunkSize = options.chunkSize ?? 100;

    const result = new Float64Array(count);
    let collected = 0;

    while (collected < count) {
        const batchSize = Math.min(chunkSize, count - collected);

        for (let i = 0; i < batchSize; i++) {
            result[collected++] = measureOne(iterations);
        }

        // Yield to event loop if we have more to do
        if (collected < count) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    return result;
}

// Re-export for compatibility if needed, but implementation changed significantly.
// We keep the old signature's simple wrapper for now or let it break?
// The user authorized breaking changes, so we focus on new API.
