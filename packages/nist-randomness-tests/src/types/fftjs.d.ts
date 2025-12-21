declare module 'fft.js' {
  export default class FFT {
    constructor(size: number);
    createComplexArray(): Float64Array;
    transform(out: Float64Array, data: Float64Array): void;
  }
}
