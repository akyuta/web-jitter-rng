import { Matrix } from '../types';

const MATRIX_FORWARD_ELIMINATION = 0;
const MATRIX_BACKWARD_ELIMINATION = 1;

export const bitsToMatrix = (rows: number, cols: number, bits: number[]): Matrix => {
  if (bits.length < rows * cols) {
    throw new Error(`Insufficient bits for matrix creation. Required: ${rows * cols}, Provided: ${bits.length}`);
  }
  const matrix: Matrix = [];
  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    const row = bits.slice(rowIndex * cols, (rowIndex + 1) * cols);
    matrix.push(row);
  }
  return matrix;
};

export const computeRank = (rows: number, cols: number, matrix: Matrix): number => {
  const m = Math.min(rows, cols);
  for (let i = 0; i < m - 1; i++) {
    if (matrix[i][i] === 1) perform_elementary_row_operations(MATRIX_FORWARD_ELIMINATION, i, rows, cols, matrix);
    else if (find_unit_element_and_swap(MATRIX_FORWARD_ELIMINATION, i, rows, cols, matrix) === 1)
      perform_elementary_row_operations(MATRIX_FORWARD_ELIMINATION, i, rows, cols, matrix);
  }

  for (let i = m - 1; i > 0; i--) {
    if (matrix[i][i] === 1) perform_elementary_row_operations(MATRIX_BACKWARD_ELIMINATION, i, rows, cols, matrix);
    else if (find_unit_element_and_swap(MATRIX_BACKWARD_ELIMINATION, i, rows, cols, matrix) === 1)
      perform_elementary_row_operations(MATRIX_BACKWARD_ELIMINATION, i, rows, cols, matrix);
  }
  return determine_rank(m, rows, cols, matrix);
};

const perform_elementary_row_operations = (
  flag: number,
  i: number,
  rows: number,
  cols: number,
  A: Matrix,
): void => {
  let k: number;
  if (flag === MATRIX_FORWARD_ELIMINATION) {
    for (let j = i + 1; j < rows; j++)
      if (A[j][i] === 1) for (k = i; k < cols; k++) A[j][k] = (A[j][k] + A[i][k]) % 2;
  } else {
    for (let j = i - 1; j >= 0; j--)
      if (A[j][i] === 1) for (k = 0; k < cols; k++) A[j][k] = (A[j][k] + A[i][k]) % 2;
  }
};

const find_unit_element_and_swap = (flag: number, i: number, rows: number, cols: number, A: Matrix): number => {
  let index: number;
  if (flag === MATRIX_FORWARD_ELIMINATION) {
    index = i + 1;
    while (index < rows && A[index][i] === 0) index++;
    if (index < rows) return swap_rows(i, index, cols, A);
  } else {
    index = i - 1;
    while (index >= 0 && A[index][i] === 0) index--;
    if (index >= 0) return swap_rows(i, index, cols, A);
  }
  return 0;
};

const swap_rows = (i: number, index: number, cols: number, A: Matrix): number => {
  let temp: number;
  for (let p = 0; p < cols; p++) {
    temp = A[i][p];
    A[i][p] = A[index][p];
    A[index][p] = temp;
  }
  return 1;
};

const determine_rank = (m: number, rows: number, cols: number, A: Matrix): number => {
  let rank = m;
  let allZeroes: number;
  for (let i = 0; i < rows; i++) {
    allZeroes = 1;
    for (let j = 0; j < cols; j++) {
      if (A[i][j] === 1) {
        allZeroes = 0;
        break;
      }
    }
    if (allZeroes === 1) rank--;
  }
  return rank;
};
