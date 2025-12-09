import { erf } from 'mathjs';
import { RandomnessTest } from '../types';

const normcdf = (n: number) => 0.5 * (1 - erf(-n * Math.sqrt(0.5)));

const pValue = (n: number, z: number): number => {
  let sum_a = 0;
  let start = Math.floor((-n / z + 1) / 4);
  let end = Math.floor((n / z - 1) / 4);
  for (let k = start; k < end + 1; k++) {
    const d = normcdf(((4 * k + 1) * z) / Math.sqrt(n));
    const e = normcdf(((4 * k - 1) * z) / Math.sqrt(n));
    sum_a = sum_a + d - e;
  }

  let sum_b = 0;
  start = Math.floor((-n / z - 3) / 4);
  end = Math.floor((n / z - 1) / 4);
  for (let k = start; k < end + 1; k++) {
    const d = normcdf(((4 * k + 3) * z) / Math.sqrt(n));
    const e = normcdf(((4 * k + 1) * z) / Math.sqrt(n));
    sum_b = sum_b + d - e;
  }
  const p = 1 - sum_a + sum_b;
  return p;
};

const test: RandomnessTest = (bits, alpha = 0.01) => {
  const n = bits.length;
  const x: number[] = [];
  for (const bit of bits) {
    x.push(bit * 2 - 1);
  }
  let pos = 0;
  let forwardMax = 0;
  for (const e of x) {
    pos = pos + e;
    if (Math.abs(pos) > forwardMax) forwardMax = Math.abs(pos);
  }

  pos = 0;
  let backwardMax = 0;
  for (const e of x.reverse()) {
    pos = pos + e;
    if (Math.abs(pos) > backwardMax) backwardMax = Math.abs(pos);
  }

  const pForward = pValue(n, forwardMax);
  const pBackward = pValue(n, backwardMax);
  const success = pForward >= alpha && pBackward >= alpha;
  return [success, Math.min(pForward, pBackward), [pForward, pBackward]];
};

export default test;
