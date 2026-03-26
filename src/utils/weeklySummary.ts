import { Transaction, Category } from '../types';
import { PersonaId, PERSONAS } from '../constants/personas';
import { formatCurrency } from './formatCurrency';

export interface WeeklySummary {
  totalSpent: number;
  vsLastWeek: number;
  vsLastWeekPct: number;
  topCategory: Category | null;
  topCategoryAmount: number;
  insightLine: string;
  generatedAt: string;
}

function getWeekRange(offsetWeeks: number): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - dayOfWeek);
  startOfThisWeek.setHours(0, 0, 0, 0);

  const start = new Date(startOfThisWeek);
  start.setDate(start.getDate() - offsetWeeks * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function generateWeeklySummary(
  transactions: Transaction[],
  persona: PersonaId,
  income: number
): WeeklySummary {
  const thisWeek = getWeekRange(0);
  const lastWeek = getWeekRange(1);

  const filterWeek = (start: string, end: string) =>
    transactions.filter(
      (t) =>
        t.category !== 'Income' &&
        t.category !== 'Transfer' &&
        t.amount < 0 &&
        t.date >= start &&
        t.date <= end
    );

  const thisWeekTxns = filterWeek(thisWeek.start, thisWeek.end);
  const lastWeekTxns = filterWeek(lastWeek.start, lastWeek.end);

  const totalSpent = thisWeekTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
  const lastWeekSpent = lastWeekTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
  const vsLastWeek = totalSpent - lastWeekSpent;
  const vsLastWeekPct = lastWeekSpent > 0 ? Math.round((vsLastWeek / lastWeekSpent) * 100) : 0;

  // Find top spending category this week
  const catTotals = new Map<Category, number>();
  thisWeekTxns.forEach((t) => {
    const cur = catTotals.get(t.category) ?? 0;
    catTotals.set(t.category, cur + Math.abs(t.amount));
  });
  const sorted = Array.from(catTotals.entries()).sort((a, b) => b[1] - a[1]);
  const topCategory = sorted.length > 0 ? sorted[0][0] : null;
  const topCategoryAmount = sorted.length > 0 ? sorted[0][1] : 0;

  const catName = topCategory ?? 'spending';
  const amtStr = formatCurrency(topCategoryAmount);
  const pctStr = Math.abs(vsLastWeekPct).toString();

  let insightLine: string;

  if (totalSpent === 0) {
    const noSpendTemplates: Record<PersonaId, string> = {
      advisor: 'No spending recorded this week yet. Keep tracking!',
      hype: "bestie we don't have data for this week yet 👀",
      cfo: 'No transactions recorded. Either a miracle or you stopped tracking.',
      that_girl: 'A fresh week full of intention! ✨ Keep logging your spending.',
      old_money: 'One has not recorded expenditures this week. Do keep up with the ledger.',
    };
    insightLine = noSpendTemplates[persona];
  } else if (vsLastWeek > 0) {
    // Spent more than last week
    const templates: Record<PersonaId, string> = {
      advisor: `Your top spend was ${amtStr} on ${catName} — ${pctStr}% over last week. Consider reviewing that category.`,
      hype: `bestie u spent ${amtStr} on ${catName} this week no cap 👀 that's ${pctStr}% more than last week fr`,
      cfo: `Another week, another ${amtStr} bleeding out via ${catName}. ${pctStr}% increase. Noted with disappointment.`,
      that_girl: `You channeled ${amtStr} into ${catName} this week ✨ — ${pctStr}% more than last week. Just be intentional babe 🌸`,
      old_money: `One spent ${amtStr} on ${catName} — a ${pctStr}% rise from last week. Discretion, as always, is advised.`,
    };
    insightLine = templates[persona];
  } else if (vsLastWeek < 0) {
    // Spent less — good!
    const templates: Record<PersonaId, string> = {
      advisor: `Great discipline — ${amtStr} on ${catName} and ${pctStr}% less than last week. Keep it up.`,
      hype: `W behavior!! ${amtStr} on ${catName} and ${pctStr}% LESS than last week 🙌 ur literally that person`,
      cfo: `You spent ${amtStr} on ${catName}. Down ${pctStr}% from last week. I did not see that coming. Well done.`,
      that_girl: `You spent ${amtStr} on ${catName} this week — and ${pctStr}% less than last week 💫 your future self is cheering!`,
      old_money: `${amtStr} on ${catName}. A ${pctStr}% reduction from the prior week. Not entirely without merit.`,
    };
    insightLine = templates[persona];
  } else {
    const templates: Record<PersonaId, string> = {
      advisor: `Consistent week — ${amtStr} on ${catName}, matching last week's pace.`,
      hype: `pretty consistent week ngl — ${amtStr} on ${catName} same as last week 📊`,
      cfo: `${amtStr} on ${catName}. Identical to last week. Consistency is something I suppose.`,
      that_girl: `${amtStr} on ${catName} — same as last week ✨ steady energy, love to see it.`,
      old_money: `${amtStr} on ${catName}. Precisely in line with last week. One appreciates consistency.`,
    };
    insightLine = templates[persona];
  }

  return {
    totalSpent,
    vsLastWeek,
    vsLastWeekPct,
    topCategory,
    topCategoryAmount,
    insightLine,
    generatedAt: new Date().toISOString(),
  };
}
