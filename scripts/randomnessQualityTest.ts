import { getJitterRandom } from '../packages/web-jitter-rng/src/index';
// @ts-ignore
import randomnessImport from 'nist-randomness-tests';

// Handle CJS/ESM interop
// @ts-ignore
const randomness = randomnessImport.default?.default || randomnessImport.default || randomnessImport;

async function runQualityTest() {
    console.log('Starting Randomness Quality Test (NIST-based checks)...');

    const args = process.argv.slice(2);
    // Parse arguments
    const noHealthCheck = args.includes('--no-health-check');

    // Parse --timing-mode option
    const timingModeIndex = args.findIndex(a => a === '--timing-mode');
    let timingMode: 'duration' | 'interpCount' = 'interpCount'; // default
    if (timingModeIndex !== -1 && args[timingModeIndex + 1]) {
        const modeArg = args[timingModeIndex + 1];
        if (modeArg === 'duration' || modeArg === 'interpCount') {
            timingMode = modeArg;
        } else {
            console.warn(`⚠️  Invalid timing mode '${modeArg}', using default 'interpCount'`);
        }
    }

    const sizeArgIndex = args.findIndex(a => !a.startsWith('--') && !['duration', 'interpCount'].includes(a));
    const argBytes = sizeArgIndex !== -1 ? parseInt(args[sizeArgIndex], 10) : 125000;
    const TARGET_BYTES = isNaN(argBytes) ? 125000 : argBytes;

    console.log('Mode: SECURE (SHA-256 Conditioned)');
    console.log(`Timing Mode: ${timingMode}`);
    console.log(`Health Check: ${noHealthCheck ? 'DISABLED' : 'ENABLED'}`);
    console.log(`Generating ${(TARGET_BYTES * 8).toLocaleString()} bits (${TARGET_BYTES.toLocaleString()} bytes) of random data...`);
    console.log(`Target Bytes: ${TARGET_BYTES}`);

    if (noHealthCheck) {
        console.warn('⚠️  WARNING: Health check disabled. Entropy quality is not verified.');
    }

    const startTime = performance.now();

    // Chunking for progress
    // We'll generate in chunks of ~1KB or similar to allow UI updates
    const CHUNK_SIZE = 1024; // 1KB
    const randomBytes = new Uint8Array(TARGET_BYTES);
    let offset = 0;

    // Select generator function
    const generateChunk = async (size: number) => {
        const options = { healthCheck: !noHealthCheck, timingMode };
        return await getJitterRandom(size, options);
    };

    console.log('Progress:');


    while (offset < TARGET_BYTES) {
        const remaining = TARGET_BYTES - offset;
        const currentChunkSize = Math.min(remaining, CHUNK_SIZE);

        const chunk = await generateChunk(currentChunkSize);
        randomBytes.set(chunk, offset);

        offset += currentChunkSize;

        // Update progress bar
        const percent = Math.min(100, Math.floor((offset / TARGET_BYTES) * 100));
        const barLength = 30;
        const filledLength = Math.floor((barLength * percent) / 100);
        const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

        process.stdout.write(`\r[${bar}] ${percent}% (${offset} / ${TARGET_BYTES} bytes)`);
    }

    console.log('\n'); // Newline after progress

    const duration = performance.now() - startTime;
    console.log(`Generation complete in ${duration.toFixed(2)}ms.`);

    // Convert to bits
    console.log('Converting to bits...');
    const bits: number[] = [];
    for (const byte of randomBytes) {
        for (let i = 7; i >= 0; i--) {
            bits.push((byte >> i) & 1);
        }
    }
    console.log(`Total bits: ${bits.length}`);

    // Define tests to run
    const tests = [
        { name: 'Monobit Test', fn: randomness.monobitTest },
        { name: 'Frequency Within Block Test', fn: randomness.frequencyWithinBlockTest },
        { name: 'Runs Test', fn: randomness.runsTest },
        { name: 'Longest Run Ones In A Block Test', fn: randomness.longestRunOnesInABlockTest },
        { name: 'Binary Matrix Rank Test', fn: randomness.binaryMatrixRankTest },
        { name: 'Approximate Entropy Test', fn: randomness.approximateEntropyTest },
        // DFT Test often requires power of 2 length or specific condition, let's include if stable
        // { name: 'DFT Test', fn: randomness.dftTest }, 
    ];

    console.log('\nRunning Statistical Tests...\n');
    console.log('| Test Name | P-Value | Result |');
    console.log('|---|---|---|');

    let allPass = true;
    let failedTests = [];

    for (const test of tests) {
        if (!test.fn) {
            console.log(`| ${test.name} | N/A | SKIPPED (Not found) |`);
            continue;
        }

        try {
            const result = test.fn(bits);

            let pValue: number;
            let passed: boolean;

            if (Array.isArray(result)) {
                passed = result[0];
                pValue = result[1];
            } else {
                // If it returns just a number (p-value)
                pValue = result;
                passed = pValue >= 0.01; // Standard significance level 0.01
            }

            const pValueStr = typeof pValue === 'number' ? pValue.toFixed(6) : String(pValue);
            const status = passed ? 'PASS' : 'FAIL';

            if (!passed) {
                allPass = false;
                failedTests.push(test.name);
            }

            console.log(`| ${test.name} | ${pValueStr} | ${status} |`);

        } catch (error) {
            console.log(`| ${test.name} | ERROR | ${error instanceof Error ? error.message : String(error)} |`);
            allPass = false;
            failedTests.push(test.name);
        }
    }

    console.log('\n');
    if (allPass) {
        console.log('✅ All executed tests PASSED.');
        process.exit(0);
    } else {
        console.error('❌ Some tests FAILED.');
        process.exit(1);
    }
}

runQualityTest().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
