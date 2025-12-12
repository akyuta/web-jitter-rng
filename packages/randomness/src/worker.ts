import {
  approximateEntropyTest,
  binaryMatrixRankTest,
  cumulativeSumsTest,
  dftTest,
  frequencyWithinBlockTest,
  longestRunOnesInABlockTest,
  monobitTest,
  runsTest,
} from './index';
import { TestName, Bit } from './types';

const testMap: Record<TestName, typeof monobitTest> = {
  approximateEntropyTest,
  binaryMatrixRankTest,
  cumulativeSumsTest,
  dftTest,
  frequencyWithinBlockTest,
  longestRunOnesInABlockTest,
  monobitTest,
  runsTest,
};

type WorkerRequest = {
  testName: TestName;
  bits: Bit[];
  alpha?: number;
};

type WorkerResponse = {
  testName: TestName;
  success: boolean;
  pValue: number;
  extra?: number[];
};

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { testName, bits, alpha } = event.data;
  const testFn = testMap[testName];
  const [success, pValue, extra] = testFn(bits, alpha);
  const message: WorkerResponse = { testName, success, pValue, extra };
  self.postMessage(message);
};
