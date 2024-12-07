/**
 *
 * @param input Value to make it safe.
 * @returns The integer representation of the given input.
 *
 * @example
 * safeInt(15.000001) // 1500
 * safeInt(25.33) // 2533
 */
export function safeInt(input: string | number): number {
  // remove symbols
  const cleaned = input
    .toString()
    .replace(/[^0-9\.\,]+/g, '')
    .replace(',', '.');
  const fixedNum = Number(cleaned).toFixed(2);
  return Number(fixedNum.toString().replace(/[^0-9]+/g, ''));
}

/**
 *
 * @param input Value to make it float
 * @returns toFixed(2)
 *
 * @example
 * safeFloat(15) // 15.00
 * safeFloat(15.123) // 15.12
 */
export function safeFloat(input: string | number): number {
  const cleaned = input
    .toString()
    .replace(/[^0-9\.\,]+/g, '')
    .replace(',', '.');
  const fixedNum = Number(cleaned).toFixed(2);
  return Number(fixedNum);
}

/**
 *
 * @param input Value to make it safe
 *
 * @example
 * safePercent(15) // 0.15
 * safePercent(75) // 0.75
 */
export function safePercent(input: string | number): number {
  const cleaned = Number(input);
  return cleaned / 100;
}

/**
 *
 * @example
 * realValue(1500) // 15
 * realValue(25000) // 250
 */
export function realValue(input: string | number): number {
  const cleaned = Number(input);
  return Number(Number(cleaned / 100).toFixed(2));
}
