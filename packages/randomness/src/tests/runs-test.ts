import { erf } from 'mathjs';
import { Bit, RandomnessTest } from '../types';
import { getCounts } from '../utils/counter';

const test: RandomnessTest = (bits: Bit[], alpha = 0.01) => {
  const n = bits.length;
  const [, ones] = getCounts(bits);
  const proportion = ones / n;
  const tau = 2 / Math.sqrt(n);
  if (Math.abs(proportion - 0.5) > tau) return [false, 0];

  let observedRuns = 0;
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] !== bits[i + 1]) observedRuns += 1;
  }

  const p = 1 -
    erf(Math.abs(observedRuns - 2 * n * proportion * (1 - proportion)) /
      (2 * Math.sqrt(2 * n) * proportion * (1 - proportion)));
  const success = p >= alpha;
  return [success, p];
};

export default test;
