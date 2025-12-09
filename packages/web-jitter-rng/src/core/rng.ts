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
    const result = new Uint8Array(byteLength);
    let outputOffset = 0;

    // Loop to collect and hash in chunks (max 32 bytes output per chunk)
    while (outputOffset < byteLength) {
        // Determine output size for this iteration (max 32)
        const chunkLength = Math.min(32, byteLength - outputOffset);
        // Determine required raw bytes based on oversampling factor
        const rawChunkLength = chunkLength * factor;

        // Collect raw jitter bytes for this chunk
        const rawBytes = await collectJitterBytes(rawChunkLength, options);

        // Hash the raw bytes
        const hashBuffer = await crypto.subtle.digest('SHA-256', rawBytes as unknown as BufferSource);
        const hashBytes = new Uint8Array(hashBuffer);

        // Copy the needed bytes to the result
        result.set(hashBytes.slice(0, chunkLength), outputOffset);

        outputOffset += chunkLength;
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
