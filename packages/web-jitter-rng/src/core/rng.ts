import { sampleDeltas } from './sampler';
import { JitterCollector } from './extractor';
import { JitterOptions } from '../types';
import { validateOptions, validateLength } from './validation';

const DEFAULT_INFO = new TextEncoder().encode('web-jitter-rng conditioned output');

async function hmac(key: CryptoKey, data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
    const sig = await crypto.subtle.sign('HMAC', key, data);
    return new Uint8Array(sig);
}

async function importHmacKey(keyData: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
    return crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

// HKDF-Expand constants (RFC 5869)
const HKDF_HASH_LEN = 32; // SHA-256 output length in bytes
const HKDF_MAX_OUTPUT_LEN = 255 * HKDF_HASH_LEN; // 8160 bytes

async function hkdfExpand(key: CryptoKey, length: number, info: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
    // RFC 5869 Section 2.3: L <= 255*HashLen
    if (length < 0 || length > HKDF_MAX_OUTPUT_LEN) {
        throw new RangeError(
            `HKDF-Expand(SHA-256) output length must be between 0 and ${HKDF_MAX_OUTPUT_LEN} bytes (255 * HashLen). Requested: ${length}`
        );
    }

    const okm = new Uint8Array(length);
    let prev: Uint8Array<ArrayBuffer> = new Uint8Array(0);
    let offset = 0;
    let counter = 1;

    while (offset < length) {
        const input = new Uint8Array(prev.length + info.length + 1);
        input.set(prev, 0);
        input.set(info, prev.length);
        input[input.length - 1] = counter;

        prev = await hmac(key, input);
        const chunk = Math.min(prev.length, length - offset);
        okm.set(prev.slice(0, chunk), offset);
        offset += chunk;
        counter++;
    }

    return okm;
}

async function collectRawJitterBytes(
    byteLength: number,
    options: JitterOptions = {},
): Promise<Uint8Array<ArrayBuffer>> {
    validateLength('byteLength', byteLength, 1);
    const normalized = validateOptions(options);

    const collector = new JitterCollector(normalized);
    const bitsPerSample = 3;

    while (collector.byteLength < byteLength) {
        const remainingBytes = byteLength - collector.byteLength;
        const needed = Math.ceil((remainingBytes * 8) / bitsPerSample) + 10;

        const deltas = await sampleDeltas(needed, normalized);

        for (let i = 0; i < deltas.length; i++) {
            collector.addSample(deltas[i]);
            if (collector.byteLength >= byteLength) break;
        }
    }

    const result = collector.getBytes().slice(0, byteLength);
    return new Uint8Array(result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength));
}

async function deriveKeyFromRaw(raw: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
    const digest = await crypto.subtle.digest('SHA-256', raw);
    return importHmacKey(new Uint8Array(digest));
}

/**
 * Collects conditioned jitter bytes using HMAC-based expansion from a single entropy harvest.
 * @warning Proof of Concept only. Do not rely on this alone for cryptographic key generation.
 */
export async function collectJitterBytes(
    byteLength: number,
    options: JitterOptions = {},
): Promise<Uint8Array> {
    validateLength('byteLength', byteLength, 1);
    const normalized = validateOptions(options);

    const rawSeedLength = Math.max(32, normalized.oversamplingFactor * 32);
    const rawSeed = await collectRawJitterBytes(rawSeedLength, normalized);
    const key = await deriveKeyFromRaw(rawSeed);

    return hkdfExpand(key, byteLength, DEFAULT_INFO);
}

/**
 * Generates conditioned random bytes using jitter entropy.
 * Alias to collectJitterBytes for compatibility.
 */
export async function getJitterRandom(
    byteLength: number,
    options: JitterOptions = {},
): Promise<Uint8Array> {
    return collectJitterBytes(byteLength, options);
}

/**
 * Alias for getJitterRandom(32) to maintain some compatibility context
 * or just a helper for standard 256-bit key generation.
 */
export async function jitterRandom256(
    options: JitterOptions = {},
): Promise<Uint8Array> {
    return getJitterRandom(32, options);
}
