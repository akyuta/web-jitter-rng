import './style.css';

import { getJitterRandom } from 'web-jitter-rng';

// ============================================================
// Random Number Generator
// ============================================================

const inputDigits = document.getElementById('input-digits') as HTMLInputElement;
const selectFormat = document.getElementById('select-format') as HTMLSelectElement;
const inputCount = document.getElementById('input-count') as HTMLInputElement;
const btnGenerate = document.getElementById('btn-generate') as HTMLButtonElement;
const outputResults = document.getElementById('output-results') as HTMLPreElement;
const resultCount = document.getElementById('result-count') as HTMLSpanElement;

/**
 * Format random bytes into the specified format
 */
function formatRandomNumber(bytes: Uint8Array, digits: number, format: 'hex' | 'dec'): string {
    if (format === 'hex') {
        let hex = '';
        for (const byte of bytes) {
            hex += byte.toString(16).padStart(2, '0');
        }
        return hex.slice(0, digits).toUpperCase();
    } else {
        // Use BigInt for decimal conversion
        let bigNum = 0n;
        for (const byte of bytes) {
            bigNum = (bigNum << 8n) | BigInt(byte);
        }
        const decStr = bigNum.toString(10);
        // Adjust to required digits (pad with zeros if needed, truncate if too long)
        if (decStr.length >= digits) {
            return decStr.slice(0, digits);
        } else {
            return decStr.padStart(digits, '0');
        }
    }
}

/**
 * Display generated results
 */
function displayResults(results: string[]): void {
    outputResults.textContent = results.join('\n');
    resultCount.textContent = `${results.length} item${results.length !== 1 ? 's' : ''}`;
}

btnGenerate.addEventListener('click', async () => {
    // Get input values and clamp to valid range
    const digits = Math.min(256, Math.max(1, parseInt(inputDigits.value) || 32));
    const format = selectFormat.value as 'hex' | 'dec';
    const count = Math.min(100, Math.max(1, parseInt(inputCount.value) || 1));

    // Normalize and display clamped values
    inputDigits.value = String(digits);
    inputCount.value = String(count);

    // Calculate required bytes
    // Hex: 1 digit = 4 bits → digits/2 bytes (rounded up)
    // Decimal: log2(10) ≈ 3.32 bits → digits * 3.32 / 8 bytes (rounded up) + buffer
    const bytesNeeded = format === 'hex'
        ? Math.ceil(digits / 2)
        : Math.ceil(digits * 3.32 / 8) + 1;

    btnGenerate.disabled = true;
    btnGenerate.textContent = 'Generating...';
    outputResults.textContent = `Generating ${count} random number${count !== 1 ? 's' : ''}...`;

    try {
        const results: string[] = [];
        for (let i = 0; i < count; i++) {
            const bytes = await getJitterRandom(bytesNeeded);
            const result = formatRandomNumber(bytes, digits, format);
            results.push(result);
        }

        displayResults(results);
    } catch (err) {
        outputResults.textContent = `Error: ${err}`;
        resultCount.textContent = '0 items';
    } finally {
        btnGenerate.disabled = false;
        btnGenerate.textContent = 'Generate';
    }
});

// ============================================================
// Quality Tests
// ============================================================

import RandomnessWorker from 'randomness/worker?worker';

const btnQualityTest = document.getElementById('btn-quality-test') as HTMLButtonElement;
const testResultsDiv = document.getElementById('test-results') as HTMLDivElement;
const testResultsBody = document.getElementById('test-results-body') as HTMLTableSectionElement;
const progressContainer = document.getElementById('progress-container') as HTMLDivElement;
const progressBar = document.getElementById('progress-bar') as HTMLProgressElement;
const progressText = document.getElementById('progress-text') as HTMLSpanElement;

// Test list (matching randomness package naming)
// Note: DFT Test is excluded because it requires power-of-2 bit length for FFT
const TEST_NAMES = [
    'monobitTest',
    'frequencyWithinBlockTest',
    'runsTest',
    'longestRunOnesInABlockTest',
    'binaryMatrixRankTest',
    // 'dftTest', // Excluded: requires power-of-2 bit length for FFT
    'approximateEntropyTest',
    'cumulativeSumsTest',
] as const;

// Display names for tests (matching quality test tool)
const TEST_DISPLAY_NAMES: Record<string, string> = {
    'monobitTest': 'Monobit Test',
    'frequencyWithinBlockTest': 'Frequency Within Block Test',
    'runsTest': 'Runs Test',
    'longestRunOnesInABlockTest': 'Longest Run Ones In A Block Test',
    'binaryMatrixRankTest': 'Binary Matrix Rank Test',
    'dftTest': 'DFT Test',
    'approximateEntropyTest': 'Approximate Entropy Test',
    'cumulativeSumsTest': 'Cumulative Sums Test',
};

btnQualityTest.addEventListener('click', async () => {
    btnQualityTest.disabled = true;
    btnQualityTest.textContent = 'Generating Samples...';

    // Initialize progress display
    progressContainer.style.display = 'block';
    progressBar.value = 0;
    progressBar.max = TEST_NAMES.length;
    progressText.textContent = `0 / ${TEST_NAMES.length} tests completed`;

    // Initialize test results display
    testResultsDiv.style.display = 'block';
    testResultsBody.innerHTML = '';

    // Sample size (5120 bytes = 40960 bits)
    const TEST_SIZE_BYTES = 5120;

    let randomBytes: Uint8Array;
    try {
        randomBytes = await getJitterRandom(TEST_SIZE_BYTES);
    } catch (e) {
        alert(`Failed to generate random samples: ${e}`);
        btnQualityTest.disabled = false;
        btnQualityTest.textContent = 'Run Quality Tests';
        progressContainer.style.display = 'none';
        return;
    }

    btnQualityTest.textContent = 'Running Tests...';

    // Convert bytes to bits
    const bits: Array<0 | 1> = [];
    for (let i = 0; i < randomBytes.length; i++) {
        const byte = randomBytes[i];
        for (let j = 7; j >= 0; j--) {
            bits.push(((byte >> j) & 1) as 0 | 1);
        }
    }

    // Spawn Worker
    const worker = new RandomnessWorker();

    let completedTests = 0;
    const totalTests = TEST_NAMES.length;

    // Handle messages from worker
    worker.onmessage = (e) => {
        const result = e.data; // { testName, success, pValue, extra }
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = TEST_DISPLAY_NAMES[result.testName] || result.testName;

        const pValueCell = document.createElement('td');
        pValueCell.textContent = result.pValue.toFixed(6);

        const resultCell = document.createElement('td');
        if (result.success) {
            resultCell.textContent = 'PASS';
            resultCell.className = 'pass';
        } else {
            resultCell.textContent = 'FAIL';
            resultCell.className = 'fail';
        }

        row.appendChild(nameCell);
        row.appendChild(pValueCell);
        row.appendChild(resultCell);
        testResultsBody.appendChild(row);

        // Update progress
        completedTests++;
        progressBar.value = completedTests;
        progressText.textContent = `${completedTests} / ${totalTests} tests completed`;

        if (completedTests >= totalTests) {
            btnQualityTest.disabled = false;
            btnQualityTest.textContent = 'Run Quality Tests';
            worker.terminate();
        }
    };

    // Dispatch jobs to worker
    TEST_NAMES.forEach(testName => {
        worker.postMessage({
            testName,
            bits,
            alpha: 0.01 // Default alpha
        });
    });
});
