import { describe, it, expect } from 'vitest';
import { bitsToMatrix } from '../src/utils/matrix';

describe('bitsToMatrix', () => {
    it('should create an M x Q matrix when bits are sufficient', () => {
        const M = 3;
        const Q = 2;
        // Need 6 bits
        const bits = [1, 2, 3, 4, 5, 6];

        const matrix = bitsToMatrix(M, Q, bits);

        // Check dimensions
        expect(matrix.length).toBe(M);      // 3 rows
        expect(matrix[0].length).toBe(Q);   // 2 cols

        // Check content (row-major order expected)
        // Row 0: [1, 2]
        // Row 1: [3, 4]
        // Row 2: [5, 6]
        expect(matrix).toEqual([
            [1, 2],
            [3, 4],
            [5, 6]
        ]);
    });

    it('should throw an error if bits are insufficient', () => {
        const M = 2;
        const Q = 2;
        // Need 4 bits, provide 3
        const bits = [1, 0, 1];

        expect(() => bitsToMatrix(M, Q, bits)).toThrow(/Insufficient bits/);
    });
});
