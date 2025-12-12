import { erf } from 'mathjs';
import { Bit, RandomnessTest } from '../types';
import { getCounts } from '../utils/counter';

const test: RandomnessTest = (bits: Bit[], alpha = 0.01) => {
  const n = bits.length;
  const [zeroes, ones] = getCounts(bits);
  const difference = Math.abs(ones - zeroes);
  const p = 1 - erf(difference / (Math.sqrt(n) * Math.sqrt(2.0)));
  const success = p >= alpha;
  return [success, p];
};

export default test;
