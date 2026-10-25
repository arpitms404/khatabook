/**
 * Currency utilities for Indian Rupee (₹) and Paise Integer Math
 * 1 INR = 100 Paise
 */

/**
 * Formats integer paise into a localized INR display string
 * e.g., 125000 -> "₹1,250" or "₹1,250.00"
 */
export function formatPaise(
  paise: number,
  options?: { showPaise?: boolean; showSign?: boolean }
): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = Math.floor(absPaise / 100);
  const remainingPaise = absPaise % 100;

  // Indian number grouping: e.g. 12,34,567
  const formattedRupees = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(rupees);

  let formatted = `₹${formattedRupees}`;

  if (options?.showPaise || remainingPaise > 0) {
    formatted += `.${remainingPaise.toString().padStart(2, '0')}`;
  }

  if (isNegative) {
    return `- ${formatted}`;
  }

  if (options?.showSign && paise > 0) {
    return `+ ${formatted}`;
  }

  return formatted;
}

/**
 * Converts a string rupee input (e.g., "1500.50") into integer paise
 */
export function parseRupeesToPaise(input: string | number): number {
  if (typeof input === 'number') {
    return Math.round(input * 100);
  }

  const clean = input.replace(/[^0-9.]/g, '');
  if (!clean) return 0;

  const parts = clean.split('.');
  const wholePart = parseInt(parts[0] || '0', 10);

  if (parts.length > 1) {
    const fractionPart = (parts[1] + '00').slice(0, 2);
    return wholePart * 100 + parseInt(fractionPart, 10);
  }

  return wholePart * 100;
}

/**
 * Converts integer paise to decimal rupees for input fields
 */
export function paiseToRupeesString(paise: number): string {
  const rupees = paise / 100;
  return rupees % 1 === 0 ? rupees.toString() : rupees.toFixed(2);
}
