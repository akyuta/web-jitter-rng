import { RandomnessTest } from '../types';
import { gammaincc } from '../utils/gamma';
import { getCounts } from '../utils/counter';

const defaultBlockSize = 10;
const blockNumberMax = 100;
const sequenceSizeMin = 100;

const test: RandomnessTest = (bits, alpha = 0.01) => {
  const n = bits.length;
  if (n < sequenceSizeMin) {
    throw new Error('Too little data for test. Supply at least 100 bits');
  }

  let M = defaultBlockSize;
  let N = Math.floor(n / M);
  if (N > blockNumberMax) {
    N = blockNumberMax - 1;
    M = Math.floor(n / N);
  }

  const totalBlocks = N;
  const blockSize = M;
  const proportions: number[] = [];
  for (let i = 0; i < totalBlocks; i++) {
    const block = bits.slice(i * blockSize, (i + 1) * blockSize);
    const [, ones] = getCounts(block);
    proportions.push(ones / blockSize);
  }

  let chiSquare = 0;
  for (let i = 0; i < proportions.length; i++) {
    chiSquare += 4 * blockSize * (proportions[i] - 1 / 2) ** 2;
  }
  const p = gammaincc(totalBlocks / 2, chiSquare / 2);
  const success = p >= alpha;
  return [success, p];
};

export default test;
