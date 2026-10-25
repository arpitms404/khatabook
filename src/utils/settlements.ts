/**
 * Balance & Settlement Computation Engine
 * Strict consistency:
 * - Positive balance: The member should receive money.
 * - Negative balance: The member owes money.
 * - Zero balance: The member is settled.
 * Personal expenses are excluded from shared debt calculations.
 */

import { GroupMember, Expense, Settlement, MemberBalance, DebtPayment } from '../types';

/**
 * Computes net balances for all members in the group based on confirmed shared expenses and confirmed settlements.
 */
export function calculateMemberBalances(
  members: GroupMember[],
  expenses: Expense[],
  settlements: Settlement[]
): MemberBalance[] {
  const memberMap = new Map<string, MemberBalance>();

  // Initialize balance records for all active members
  members.forEach((m) => {
    memberMap.set(m.user_id, {
      user_id: m.user_id,
      full_name: m.profile?.full_name || 'Member',
      avatar_url: m.profile?.avatar_url,
      role: m.role,
      total_paid_shared_paise: 0,
      total_shared_cost_paise: 0,
      total_personal_paise: 0,
      settlements_received_paise: 0,
      settlements_paid_paise: 0,
      net_balance_paise: 0,
    });
  });

  // 1. Process expenses
  expenses.forEach((expense) => {
    // Ignore soft-deleted expenses
    if (expense.deleted_at) return;

    if (expense.expense_type === 'personal') {
      const payer = memberMap.get(expense.paid_by);
      if (payer) {
        payer.total_personal_paise += expense.amount_paise;
      }
      return;
    }

    // Shared expense:
    // Payer contributed expense.amount_paise toward shared expenses
    const payer = memberMap.get(expense.paid_by);
    if (payer) {
      payer.total_paid_shared_paise += expense.amount_paise;
    }

    // Each participant owes their split share
    if (expense.splits && expense.splits.length > 0) {
      expense.splits.forEach((split) => {
        const participant = memberMap.get(split.member_id);
        if (participant) {
          participant.total_shared_cost_paise += split.share_amount_paise;
        }
      });
    }
  });

  // 2. Process settlements (only confirmed settlements reduce outstanding debt)
  settlements.forEach((settlement) => {
    if (settlement.status !== 'confirmed') return;

    const payer = memberMap.get(settlement.payer_member_id);
    const recipient = memberMap.get(settlement.recipient_member_id);

    if (payer) {
      payer.settlements_paid_paise += settlement.amount_paise;
    }
    if (recipient) {
      recipient.settlements_received_paise += settlement.amount_paise;
    }
  });

  // 3. Compute final net balance for each member
  // Net balance = (total_paid_shared_paise - total_shared_cost_paise) + (settlements_received_paise - settlements_paid_paise)
  const balances: MemberBalance[] = [];
  memberMap.forEach((balance) => {
    const sharedNet = balance.total_paid_shared_paise - balance.total_shared_cost_paise;
    const settlementNet = balance.settlements_received_paise - balance.settlements_paid_paise;
    balance.net_balance_paise = sharedNet - settlementNet;
    // Wait! Let's verify the sign convention:
    // If Alice pays ₹1000 for dinner shared equally with Bob (₹500 each):
    // Alice: paid 1000, share 500. sharedNet = +500. She should receive 500.
    // Bob: paid 0, share 500. sharedNet = -500. He owes 500.
    // Now Bob settles by paying Alice ₹500:
    // Bob: settlements_paid = 500, settlements_received = 0.
    // If Bob's net balance should be 0:
    // Net balance = (paid - share) + (repayments made to others) - (repayments received from others)
    // Let's re-verify:
    // Before repayment:
    // Alice = +500 (is owed 500)
    // Bob = -500 (owes 500)
    // After Bob pays Alice 500:
    // Alice received 500. She is now owed 0! So Alice's net = +500 - 500 = 0.
    // Bob paid 500. He now owes 0! So Bob's net = -500 + 500 = 0.
    // Exactly!
    // Net balance = (Amount paid toward shared - Assigned shared expense shares) + (Repayments paid - Repayments received)
    balance.net_balance_paise =
      balance.total_paid_shared_paise -
      balance.total_shared_cost_paise +
      balance.settlements_paid_paise -
      balance.settlements_received_paise;

    balances.push(balance);
  });

  return balances;
}

/**
 * Simplifies debts among members to minimize the total number of repayment transactions.
 * Uses greedy matching between maximum debtor and maximum creditor.
 */
export function simplifyDebts(balances: MemberBalance[]): DebtPayment[] {
  // Debtors have negative balance, Creditors have positive balance
  const debtors: { user_id: string; full_name: string; amount: number }[] = [];
  const creditors: { user_id: string; full_name: string; amount: number }[] = [];

  balances.forEach((b) => {
    if (b.net_balance_paise < 0) {
      debtors.push({
        user_id: b.user_id,
        full_name: b.full_name,
        amount: Math.abs(b.net_balance_paise),
      });
    } else if (b.net_balance_paise > 0) {
      creditors.push({
        user_id: b.user_id,
        full_name: b.full_name,
        amount: b.net_balance_paise,
      });
    }
  });

  // Sort descending by amount
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const payments: DebtPayment[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const paymentAmount = Math.min(debtor.amount, creditor.amount);

    if (paymentAmount > 0) {
      payments.push({
        from_user_id: debtor.user_id,
        from_name: debtor.full_name,
        to_user_id: creditor.user_id,
        to_name: creditor.full_name,
        amount_paise: paymentAmount,
      });

      debtor.amount -= paymentAmount;
      creditor.amount -= paymentAmount;
    }

    if (debtor.amount === 0) dIdx++;
    if (creditor.amount === 0) cIdx++;
  }

  return payments;
}
