import { RandomnessTest } from '../types';
import { gammaincc } from '../utils/gamma';
import { getCounts } from '../utils/counter';

const sequenceSizeMin = 100;

const test: RandomnessTest = (bits, alpha = 0.01, blockLength?: number) => {
  const n = bits.length;
  if (n < sequenceSizeMin) {
    throw new Error('Too little data for test. Supply at least 100 bits');
  }

  let M = blockLength;
  if (!M) {
    M = Math.max(20, Math.ceil(0.01 * n));
    if (Math.floor(n / M) >= 100) {
      M = Math.ceil(n / 99);
    }
  }

  let N = Math.floor(n / M);

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
