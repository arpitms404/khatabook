/**
 * Expense Splitting Algorithms with Exact Paise Preservation
 */

export interface SplitResult {
  memberId: string;
  sharePaise: number;
}

/**
 * Calculates equal splits with remainder distribution so that the sum of splits
 * exactly equals the total expense amount in paise.
 *
 * Example: ₹100 (10000 paise) split 3 ways:
 * Base share: 3333 paise (₹33.33)
 * Remainder: 1 paise -> Member 1 gets 3334 paise (₹33.34), Member 2 & 3 get 3333 paise.
 * Total sum: 3334 + 3333 + 3333 = 10000 paise.
 */
export function calculateEqualSplits(
  totalPaise: number,
  memberIds: string[]
): SplitResult[] {
  if (memberIds.length === 0 || totalPaise <= 0) {
    return [];
  }

  const count = memberIds.length;
  const baseShare = Math.floor(totalPaise / count);
  const remainder = totalPaise % count;

  return memberIds.map((memberId, index) => {
    // Distribute remainder 1 paise at a time to the first 'remainder' members
    const sharePaise = baseShare + (index < remainder ? 1 : 0);
    return {
      memberId,
      sharePaise,
    };
  });
}

/**
 * Validates whether the custom splits sum up to exactly the total expense amount in paise.
 */
export function validateCustomSplits(
  totalPaise: number,
  splits: { memberId: string; sharePaise: number }[]
): {
  isValid: boolean;
  sumPaise: number;
  differencePaise: number;
} {
  const sumPaise = splits.reduce((acc, curr) => acc + curr.sharePaise, 0);
  const differencePaise = totalPaise - sumPaise;

  return {
    isValid: differencePaise === 0,
    sumPaise,
    differencePaise,
  };
}
