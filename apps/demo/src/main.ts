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
        // Let's collect 32 bytes of raw jitter entropy
        outputBits.textContent = 'Collecting 32 bytes of raw jitter...';
        rawBytes = await collectJitterBytes(32);

        btnExtract.disabled = false;
        btnDownload.disabled = false;

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
        content += `${i},${rawBytes[i]}\n`;
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
