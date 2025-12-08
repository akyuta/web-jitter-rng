import { sampleDeltas } from './sampler';
import { JitterCollector } from './extractor';
import { JitterOptions } from '../types';

/**
 * Collects raw jitter bytes using time-jitter entropy.
 * This is the lower-level API providing unconditioned entropy.
 */
export async function collectJitterBytes(
    byteLength: number,
    options: JitterOptions = {}
): Promise<Uint8Array> {
    const collector = new JitterCollector(options);

    // Calculate roughly how many samples we need.
    // We get 3 bits per sample.
    // const neededBits = byteLength * 8;
    const bitsPerSample = 3;
    // const estimatedSamples = Math.ceil(neededBits / bitsPerSample) + 50; // buffer (Used dynamically in loop)

    // In a real loop, we might need more passes if estimatedSamples wasn't enough due to buffering,
    // but for simplicity we'll just ask for a chunk and then check.
    // If not enough, we loop.

    while (collector.byteLength < byteLength) {
        const remainingBytes = byteLength - collector.byteLength;
        const needed = Math.ceil((remainingBytes * 8) / bitsPerSample) + 10;

        const deltas = await sampleDeltas(needed, options);

        for (let i = 0; i < deltas.length; i++) {
            collector.addSample(deltas[i]);
            // Optimization: could break early if enough bytes
            if (collector.byteLength >= byteLength) break;
        }
    }

    return collector.getBytes().slice(0, byteLength);
}

/**
 * Generates cryptographically strong random bytes seeded by jitter.
 * Uses oversampling and SHA-256 hashing.
 * 
 * @warning **This is a Proof of Concept (PoC). NOT a certified CSPRNG.**
 * Do not use this for critical key generation (e.g. wallet generation, production server keys).
 * Use `window.crypto.getRandomValues` for standard cryptographic needs.
 * 
 * @warning **これは概念実証 (PoC) であり、認証された CSPRNG ではありません。**
 * ウォレット生成や本番サーバーの鍵生成など、クリティカルな用途には使用しないでください。
 * 標準的な暗号化用途には `window.crypto.getRandomValues` を使用してください。
 */
export async function getJitterRandom(
    byteLength: number,
    options: JitterOptions = {}
): Promise<Uint8Array> {
    const factor = options.oversamplingFactor ?? 4;
    const rawLength = byteLength * factor;

    const rawBytes = await collectJitterBytes(rawLength, options);

    // If requested length is small enough for a single hash
    if (byteLength <= 32) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', rawBytes as unknown as BufferSource);
        const hashBytes = new Uint8Array(hashBuffer);
        return hashBytes.slice(0, byteLength);
    }

    // For lengths > 32, we chunk the raw bytes and hash each chunk.
    // Each 32 bytes of output requires (32 * factor) raw bytes.
    const outputBlockSize = 32;
    const rawBlockSize = outputBlockSize * factor;

    const result = new Uint8Array(byteLength);
    let outputOffset = 0;
    let rawOffset = 0;

    while (outputOffset < byteLength) {
        // Determine how many raw bytes to use for this block
        // We want to generate up to 32 bytes of output.
        // But we might be at the end.

        // Actually, simpler approach: 
        // We already collected `rawLength` which is exactly `byteLength * factor`.
        // So we can just take slices of `rawBlockSize` (or remaining) and hash them.
        // Hashing always produces 32 bytes (or less if we slice).

        const rawChunkSize = Math.min(rawBlockSize, rawBytes.length - rawOffset);
        if (rawChunkSize <= 0) break; // Should not happen

        const rawChunk = rawBytes.slice(rawOffset, rawOffset + rawChunkSize);
        const hashBuffer = await crypto.subtle.digest('SHA-256', rawChunk as unknown as BufferSource);
        const hashBytes = new Uint8Array(hashBuffer);

        const needed = Math.min(outputBlockSize, byteLength - outputOffset);
        result.set(hashBytes.slice(0, needed), outputOffset);

        outputOffset += needed;
        rawOffset += rawChunkSize;
    }

    return result;
}

/**
 * Alias for getJitterRandom(32) to maintain some compatibility context
 * or just a helper for standard 256-bit key generation.
 */
export async function jitterRandom256(
    options: JitterOptions = {}
): Promise<Uint8Array> {
    return getJitterRandom(32, options);
}

// Removing hybridRandom256 for now as it wasn't requested in redesign explicitly
// and simplifies the focus, but if needed it can be re-added easily using getJitterRandom.
