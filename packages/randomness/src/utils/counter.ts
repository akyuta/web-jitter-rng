import { Bit } from '../types';

export const getCounts = (bits: Bit[]): [number, number] => {
  let zeroes = 0;
  let ones = 0;
  for (const bit of bits) {
    if (bit === 0) zeroes += 1;
    else ones += 1;
  }
  return [zeroes, ones];
};
