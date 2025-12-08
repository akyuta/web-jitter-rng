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
}
