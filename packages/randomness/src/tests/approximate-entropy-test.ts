import { RandomnessTest } from '../types';
import { gammaincc } from '../utils/gamma';

const bitsToInt = (bits: number[]): number => {
  let theint = 0;
  for (let i = 0; i < bits.length; i++) {
    theint = (theint << 1) + bits[i];
  }
  return theint;
};

const test: RandomnessTest = (bits, alpha = 0.01) => {
  const n = bits.length;
  let m = Math.floor(Math.log2(n)) - 6;
  if (m < 2) m = 2;
  if (m > 3) m = 3;

  const phiM: number[] = [];
  for (let iteration = m; iteration < m + 2; iteration++) {
    const paddedBits = bits.concat(bits.slice(0, iteration - 1));
    const counts: number[] = [];
    for (let i = 0; i < 2 ** iteration; i++) {
      let count = 0;
      for (let j = 0; j < n; j++) {
        if (bitsToInt(paddedBits.slice(j, j + iteration)) === i) count += 1;
      }
      counts.push(count);
    }
    let sum = 0;
    for (let i = 0; i < 2 ** iteration; i++) {
      const ci = counts[i] / n;
      if (ci > 0) sum += ci * Math.log(ci);
    }
    phiM.push(sum);
  }

  const approxEntropy = phiM[0] - phiM[1];
  const chiSquare = 2 * n * (Math.log(2) - approxEntropy);
  const p = gammaincc(2 ** (m - 1), chiSquare / 2.0);
  const success = p >= alpha;
  return [success, p];
};

export default test;
