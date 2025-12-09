import { RandomnessTest } from '../types';
import { bitsToMatrix, computeRank } from '../utils/matrix';

const test: RandomnessTest = (bits, M = 32, Q = 32, alpha = 0.01) => {
  const n = bits.length;
  const N = Math.floor(n / (M * Q));
  if (N < 38) {
    throw new Error('Too little data for test. Number of blocks must be greater than 37');
  }

  let upper1: number;
  let upper2: number;
  let lower: number;
  let r = M;
  let product = 1;
  for (let i = 0; i < r; i++) {
    upper1 = 1 - 2 ** (i - Q);
    upper2 = 1 - 2 ** (i - M);
    lower = 1 - 2 ** (i - r);
    product = product * ((upper1 * upper2) / lower);
  }
  const FR_prob = product * 2 ** (r * (Q + M - r) - M * Q);
  r = M - 1;
  product = 1;
  for (let i = 0; i < r; i++) {
    upper1 = 1 - 2 ** (i - Q);
    upper2 = 1 - 2 ** (i - M);
    lower = 1 - 2 ** (i - r);
    product = product * ((upper1 * upper2) / lower);
  }
  const FRM1_prob = product * 2 ** (r * (Q + M - r) - M * Q);
  const LR_prob = 1 - (FR_prob + FRM1_prob);
  let FM = 0;
  let FMM = 0;
  let remainder = 0;
  for (let blockNumber = 0; blockNumber < N; blockNumber++) {
    const block = bits.slice(blockNumber * (M * Q), (blockNumber + 1) * (M * Q));
    const matrix = bitsToMatrix(M, Q, block);
    const rank = computeRank(M, Q, matrix);
    if (rank === M) FM += 1;
    else if (rank === M - 1) FMM += 1;
    else remainder += 1;
  }

  let chiSquare = (FM - FR_prob * N) ** 2 / (FR_prob * N);
  chiSquare += (FMM - FRM1_prob * N) ** 2 / (FRM1_prob * N);
  chiSquare += (remainder - LR_prob * N) ** 2 / (LR_prob * N);
  const p = Math.E ** (-chiSquare / 2);
  const success = p >= alpha;
  return [success, p];
};

export default test;
