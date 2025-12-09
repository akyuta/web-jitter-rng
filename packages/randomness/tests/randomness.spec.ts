import { describe, expect, it } from 'vitest';
import {
  monobitTest,
  runsTest,
  frequencyWithinBlockTest,
  dftTest,
} from '../src';
import path from 'path';
import { Worker } from 'worker_threads';

const generateBalancedBits = (size: number): (0 | 1)[] => {
  const bits: (0 | 1)[] = [];
  for (let i = 0; i < size / 2; i++) bits.push(0, 1);
  for (let i = bits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bits[i], bits[j]] = [bits[j], bits[i]];
  }
  return bits;
};

describe('randomness tests', () => {
  const bits = generateBalancedBits(20000);

  it('monobitTest returns success for balanced bits', () => {
    const [success] = monobitTest(bits);
    expect(success).toBe(true);
  });

  it('runsTest returns success for balanced bits', () => {
    const [success] = runsTest(bits);
    expect(success).toBe(true);
  });

  it('frequencyWithinBlockTest works on long sequences', () => {
    const [success] = frequencyWithinBlockTest(bits);
    expect(success).toBe(true);
  });

  it('dftTest completes on long sequences', () => {
    const [success] = dftTest(bits);
    expect(success).toBe(true);
  });
});

describe('worker bridge', () => {
  it('returns results via worker', async () => {
    const bits = generateBalancedBits(4096);
    const workerPath = path.join(__dirname, '../dist/worker.js');
    const result = await new Promise<{ success: boolean; pValue: number }>((resolve, reject) => {
      const worker = new Worker(workerPath, { type: 'module' });
      worker.on('message', (msg) => {
        resolve({ success: msg.success, pValue: msg.pValue });
        worker.terminate();
      });
      worker.on('error', reject);
      worker.postMessage({ testName: 'monobitTest', bits });
    });
    expect(result.success).toBe(true);
    expect(result.pValue).toBeGreaterThan(0);
  });
});
