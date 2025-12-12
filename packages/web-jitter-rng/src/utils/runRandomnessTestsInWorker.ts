export type RandomnessWorkerResult = {
  success: boolean;
  pValue: number;
  extra?: number[];
};

export type RandomnessWorkerMessage = RandomnessWorkerResult & { testName: string };

export function runRandomnessTestsInWorker(
  testName: string,
  bits: (0 | 1)[],
  alpha?: number,
  onProgress?: (message: string) => void,
): { promise: Promise<RandomnessWorkerMessage>; cancel: () => void } {
  const worker = new Worker(new URL('../../randomness/dist/worker.js', import.meta.url), { type: 'module' });

  const promise = new Promise<RandomnessWorkerMessage>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<RandomnessWorkerMessage>) => {
      resolve(event.data);
      worker.terminate();
    };
    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
    };
    if (onProgress) {
      onProgress('Running randomness test in worker...');
    }
    worker.postMessage({ testName, bits, alpha });
  });

  return {
    promise,
    cancel: () => worker.terminate(),
  };
}
