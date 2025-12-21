import { JitterOptions } from '../types';

/**
 * Quantizes a sample value based on the timing mode.
 * - duration: Math.round(sample * scale)
 * - interpCount: Math.trunc(sample) (scale is not applied)
 *
 * @param sample The raw sample value (duration in ms or block count)
 * @param options Jitter options containing timingMode and scale
 * @returns Quantized integer value
 */
export function quantize(sample: number, options: JitterOptions): number {
    const timingMode = options.timingMode ?? 'interpCount';
    if (timingMode === 'interpCount') {
        return Math.trunc(sample);
    } else {
        const scale = options.scale ?? 1000;
        return Math.round(sample * scale);
    }
}
