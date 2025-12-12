
import stdlibGammainc from '@stdlib/math-base-special-gammainc';

// Cast to any because the type definition might be incorrect/restrictive regarding options
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stdlibGammaincAny = stdlibGammainc as any;

/**
 * Computes the lower regularized incomplete gamma function P(a, x).
 *
 * @param a The shape parameter (k in some texts, s in stdlib).
 * @param x The upper limit of integration.
 * @returns The value of P(a, x) = 1/Gamma(a) * integral(0 to x) t^(a-1) e^-t dt.
 */
export const gammainc = (a: number, x: number): number => {
  // stdlib 'gammainc' function signature is gammainc(x, s, regularized, upper)
  // We want lower regularized P(s, x): regularized=true, upper=false
  return stdlibGammaincAny(x, a, true, false);
};

/**
 * Computes the upper regularized incomplete gamma function Q(a, x).
 *
 * @param a The shape parameter.
 * @param x The lower limit of integration.
 * @returns The value of Q(a, x) = 1/Gamma(a) * integral(x to infinity) t^(a-1) e^-t dt.
 */
export const gammaincc = (a: number, x: number): number => {
  // stdlib 'gammainc' function signature is gammainc(x, s, regularized, upper)
  // We want upper regularized Q(s, x): regularized=true, upper=true
  return stdlibGammaincAny(x, a, true, true);
};
