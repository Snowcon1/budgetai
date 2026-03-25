import { Transaction, Goal, Subscription, HealthScoreBreakdown } from '../types';

export function calculateHealthScore(
  transactions: Transaction[],
  goals: Goal[],
  subscriptions: Subscription[],
  monthlyIncome: number
): HealthScoreBreakdown {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlySpend = monthlyTransactions
    .filter((t) => t.category !== 'Income' && t.category !== 'Transfer')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Spending ratio (25 pts): full 25 if under 70%, scales to 0 at 100%+
  const spendRatio = monthlyIncome > 0 ? monthlySpend / monthlyIncome : 1;
  let spending_ratio: number;
  if (spendRatio <= 0.7) {
    spending_ratio = 25;
  } else if (spendRatio >= 1.0) {
    spending_ratio = 0;
  } else {
    spending_ratio = Math.round(25 * (1 - (spendRatio - 0.7) / 0.3));
  }

  // Savings rate (25 pts): based on goal contributions vs 10% of income target
  const goalContributions = monthlyTransactions
    .filter((t) => t.notes?.toLowerCase().includes('goal') || t.notes?.toLowerCase().includes('savings'))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const savingsTarget = monthlyIncome * 0.1;
  const savingsRatio = savingsTarget > 0 ? Math.min(goalContributions / savingsTarget, 1) : 0;
  const savings_rate = Math.round(25 * savingsRatio);

  // Goal progress (25 pts): average progress weighted by target amount
  let goal_progress = 0;
  if (goals.length > 0) {
    const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
    const weightedProgress = goals.reduce((sum, g) => {
      const progress = g.target_amount > 0 ? g.current_amount / g.target_amount : 0;
      const weight = totalTarget > 0 ? g.target_amount / totalTarget : 1 / goals.length;
      return sum + progress * weight;
    }, 0);
    goal_progress = Math.round(25 * Math.min(weightedProgress, 1));
  }

  // Subscription efficiency (25 pts): deduct for unused subs
  let subscription_efficiency = 25;
  if (subscriptions.length > 0) {
    const totalSubCost = subscriptions
      .filter((s) => s.is_active)
      .reduce((sum, s) => sum + s.amount, 0);
    const unusedCost = subscriptions
      .filter((s) => s.possibly_unused && s.is_active)
      .reduce((sum, s) => sum + s.amount, 0);
    if (totalSubCost > 0) {
      const wasteRatio = unusedCost / totalSubCost;
      subscription_efficiency = Math.round(25 * (1 - wasteRatio));
    }
  }

  const total = Math.min(spending_ratio + savings_rate + goal_progress + subscription_efficiency, 100);

  return {
    total,
    spending_ratio,
    goal_progress,
    savings_rate,
    subscription_efficiency,
  };
}
