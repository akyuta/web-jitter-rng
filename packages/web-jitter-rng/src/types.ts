export interface JitterOptions {
    /**
     * Number of iterations for the CPU burn loop per sample.
     * Higher values increase CPU load and potential jitter.
     * Default: 500000
     */
    iterations?: number;

    /**
     * Scaling factor for quantization.
     * Math.round(delta * scale)
     * Default: 1000
     */
    scale?: number;

    /**
     * Size of the rolling window for median estimation.
     * Default: 256
     */
    windowSize?: number;

    /**
     * Oversampling factor for hashed random generation.
     * We collect (target * oversamplingFactor) bytes of raw jitter.
     * Default: 4
     */
    oversamplingFactor?: number;

    /**
     * Number of samples to collect in one synchronous chunk before yielding to event loop.
     * Default: 100
     */
    chunkSize?: number;

    /**
     * Enable or disable health checking of collected deltas.
     * Default: true
     */
    healthCheck?: boolean;

    /**
     * Minimum acceptable unique-rate of quantized samples.
     * Default: 0.05
     */
    minUniqueRate?: number;

    /**
     * Maximum acceptable zero-difference rate between consecutive quantized samples.
     * Default: 0.6
     */
    maxZeroDiffRate?: number;

    /**
     * Minimum acceptable runs rate for sign bits of diffs.
     * Default: 0.02
     */
    minRunsRate?: number;
}
