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
     * Oversampling factor for seed collection.
     * Collects max(32, oversamplingFactor * 32) bytes of raw jitter as a seed,
     * then expands it via HKDF to the requested output length.
     * Higher values increase entropy margin but also collection time.
     * Default: 4 (collects 128 bytes of raw jitter for seed)
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

    /**
     * Timing measurement mode.
     * - 'interpCount': Counts iterations until timer tick changes (recommended, default)
     * - 'duration': Uses raw millisecond duration (legacy mode)
     * Default: 'interpCount'
     */
    timingMode?: 'duration' | 'interpCount';

    /**
     * Work iterations per burn block for interpCount mode.
     * Default: 256
     */
    interpWork?: number;

    /**
     * Check timer every N blocks in interpCount mode.
     * Default: 1
     */
    interpPollEvery?: number;

    /**
     * Maximum blocks before throwing error in interpCount mode (freeze prevention).
     * Default: 4096
     */
    interpMaxBlocks?: number;

    /**
     * Timer resolution hint for interpCount mode.
     * - 'auto': Detect automatically based on performance.now() precision (default)
     * - 'high': Force high-resolution mode (Node.js, uses fractional timing)
     * - 'low': Force low-resolution mode (Browser, uses block count only)
     * Default: 'auto'
     */
    timerResolution?: 'auto' | 'high' | 'low';
}

/**
 * Normalized options with all fields filled in with default values.
 * This is the result of validateOptions().
 */
export interface NormalizedOptions {
    /** Number of iterations for the CPU burn loop per sample. */
    iterations: number;
    /** Scaling factor for quantization. */
    scale: number;
    /** Size of the rolling window for median estimation. */
    windowSize: number;
    /** Oversampling factor for seed collection. */
    oversamplingFactor: number;
    /** Number of samples to collect in one synchronous chunk. */
    chunkSize: number;
    /** Enable or disable health checking. */
    healthCheck: boolean;
    /** Minimum acceptable unique-rate of quantized samples. */
    minUniqueRate: number;
    /** Maximum acceptable zero-difference rate. */
    maxZeroDiffRate: number;
    /** Minimum acceptable runs rate. */
    minRunsRate: number;
    /** Timing measurement mode. */
    timingMode: 'duration' | 'interpCount';
    /** Work iterations per burn block for interpCount mode. */
    interpWork: number;
    /** Check timer every N blocks in interpCount mode. */
    interpPollEvery: number;
    /** Maximum blocks before throwing error in interpCount mode. */
    interpMaxBlocks: number;
    /** Timer resolution hint for interpCount mode. */
    timerResolution: 'auto' | 'high' | 'low';
}
