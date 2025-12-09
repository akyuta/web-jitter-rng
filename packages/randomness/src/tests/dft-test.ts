import { erf } from 'mathjs';
import FFT from 'fft.js';
import { RandomnessTest } from '../types';

const test: RandomnessTest = (bits, alpha = 0.01) => {
  const n = bits.length;
  const ts: number[] = [];
  const max = n % 2 === 0 ? n : n - 1;
  for (let i = 0; i < max; i++) {
    ts.push(bits[i] * 2 - 1);
  }

  const fft = new FFT(ts.length);
  const input = fft.createComplexArray();
  for (let i = 0; i < ts.length; i++) {
    input[2 * i] = ts[i];
    input[2 * i + 1] = 0;
  }
  const output = fft.createComplexArray();
  fft.transform(output, input);

  const magnitudes: number[] = [];
  for (let i = 0; i < ts.length; i++) {
    const re = output[2 * i];
    const im = output[2 * i + 1];
    magnitudes.push(Math.sqrt(re * re + im * im));
  }

  const T = Math.sqrt(Math.log(1.0 / 0.05) * n);
  const N0 = (0.95 * n) / 2.0;
  let N1 = 0;
  for (let index = 0; index < magnitudes.length; index++) {
    if (magnitudes[index] < T) N1 += 1;
  }
  const d = (N1 - N0) / Math.sqrt((n * 0.95 * 0.05) / 4);
  const p = 1 - erf(Math.abs(d) / Math.sqrt(2));
  const success = p >= alpha;
  return [success, p];
};

export default test;
