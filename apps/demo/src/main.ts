import './style.css';

import { sampleDeltas, collectJitterBytes, getJitterRandom } from 'web-jitter-rng';

// State
let rawBytes: Uint8Array | null = null;

// UI Elements
const btnSample = document.getElementById('btn-sample') as HTMLButtonElement;
const btnExtract = document.getElementById('btn-extract') as HTMLButtonElement;
const btnDownload = document.getElementById('btn-download') as HTMLButtonElement;

const valMin = document.getElementById('val-min') as HTMLDivElement;
const valMax = document.getElementById('val-max') as HTMLDivElement;
const valAvg = document.getElementById('val-avg') as HTMLDivElement;
const valJitter = document.getElementById('val-jitter') as HTMLDivElement;
const outputBits = document.getElementById('output-bits') as HTMLPreElement;
const bitCountLabel = document.getElementById('bit-count') as HTMLSpanElement;

function updateStats(deltas: Float64Array) {
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;

    for (let i = 0; i < deltas.length; i++) {
        const v = deltas[i];
        if (v < min) min = v;
        if (v > max) max = v;
        sum += v;
    }

    const avg = sum / deltas.length;

    let sumSqDiff = 0;
    for (let i = 0; i < deltas.length; i++) {
        sumSqDiff += (deltas[i] - avg) ** 2;
    }
    const variance = sumSqDiff / deltas.length;

    valMin.textContent = min.toFixed(4) + ' ms';
    valMax.textContent = max.toFixed(4) + ' ms';
    valAvg.textContent = avg.toFixed(4) + ' ms';
    valJitter.textContent = variance.toExponential(4);
}

btnSample.addEventListener('click', async () => {
    btnSample.disabled = true;
    btnSample.textContent = 'Sampling...';
    outputBits.textContent = 'Sampling hardware jitter (Heavy Workload)...';

    try {
        // 1. Gather some deltas for statistics (separate from the RNG accumulation)
        const statsDeltas = await sampleDeltas(200);
        updateStats(statsDeltas);

        // 2. Collect Raw Jitter Bytes (Unconditioned)
        // We need at least ~39k bits (~4.9KB) for Binary Matrix Rank Test (32x32 matrices, 38 blocks)
        const SAMPLE_SIZE = 5120; // 5KB
        outputBits.textContent = `Collecting ${SAMPLE_SIZE} bytes of raw jitter (this may take a while)...`;
        rawBytes = await collectJitterBytes(SAMPLE_SIZE);

        btnExtract.disabled = false;
        btnDownload.disabled = false;
        btnQualityTest.disabled = false;

        // Display Raw Bytes immediately
        displayBytes(rawBytes, "Raw Jitter Bytes (Unconditioned)");

    } catch (err) {
        console.error(err);
        outputBits.textContent = 'Error: ' + err;
    } finally {
        btnSample.disabled = false;
        btnSample.textContent = 'Start Sampling';
    }
});


btnExtract.addEventListener('click', async () => {
    // Generate Hashed Random (Conditioned)
    const randomBytes = await getJitterRandom(32);
    displayBytes(randomBytes, "Hashed Random Bytes (SHA-256 Conditioned)");
});


function displayBytes(bytes: Uint8Array, label: string) {
    let hexString = '';
    for (let i = 0; i < bytes.length; i++) {
        hexString += bytes[i].toString(16).padStart(2, '0');
    }
    const displayStr = hexString.match(/.{1,32}/g)?.join('\n') || hexString;

    outputBits.textContent = `[${label}]\n` + displayStr;
    bitCountLabel.textContent = `${bytes.length * 8} bits`;
}

btnDownload.addEventListener('click', () => {
    console.log('Download clicked. RawBytes:', rawBytes);
    if (!rawBytes) {
        console.error('RawBytes is null');
        alert('No data to download');
        return;
    }
    if (rawBytes.length === 0) {
        console.error('RawBytes is empty');
        alert('Data is empty');
        return;
    }

    // Download Raw Bytes as Decimal
    let content = "Index,Byte(Dec)\n";
    for (let i = 0; i < rawBytes.length; i++) {
        content += `${i},${rawBytes[i]} \n`;
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `jitter_bytes_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});

// Quality Tests
import RandomnessWorker from 'randomness/worker?worker';

const btnQualityTest = document.getElementById('btn-quality-test') as HTMLButtonElement;
const testResultsDiv = document.getElementById('test-results') as HTMLDivElement;
const testResultsBody = document.getElementById('test-results-body') as HTMLTableSectionElement;

// List of tests to run
const TEST_NAMES = [
    'monobitTest',
    'frequencyWithinBlockTest',
    'runsTest',
    'longestRunOnesInABlockTest',
    'binaryMatrixRankTest',
    'dftTest',
    'approximateEntropyTest',
    'cumulativeSumsTest',
] as const;

btnQualityTest.addEventListener('click', async () => {
    // Note: We generate fresh, conditioned random numbers for the quality test
    // to match the behavior of the quality-test script and ensure we are testing
    // the actual RNG output, not the raw entropy source.

    btnQualityTest.disabled = true;
    btnQualityTest.textContent = 'Generating Conditioned Samples...';
    testResultsDiv.style.display = 'block';

    // Clear previous results
    testResultsBody.innerHTML = '';

    // Use the same sample size as raw collection for consistency/sufficiency 
    // (5120 bytes > 39k bits required for Rank Test)
    const TEST_SIZE_BYTES = 5120;

    let randomBytes: Uint8Array;
    try {
        randomBytes = await getJitterRandom(TEST_SIZE_BYTES);
    } catch (e) {
        alert('Failed to generate random samples: ' + e);
        btnQualityTest.disabled = false;
        btnQualityTest.textContent = 'Run Quality Tests';
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
        nameCell.textContent = result.testName;

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

        completedTests++;
        if (completedTests >= totalTests) {
            btnQualityTest.disabled = false;
            btnQualityTest.textContent = 'Run Quality Tests';
            worker.terminate();
        }
    };

    // Dispatch jobs
    TEST_NAMES.forEach(testName => {
        worker.postMessage({
            testName,
            bits,
            alpha: 0.01 // Default alpha
        });
    });
});


