
import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { getBucketForCategory } from '../../lib/rule-mapper';
import PercentIcon from '../icons/PercentIcon';

type Bucket = 'needs' | 'wants' | 'savings';

const RuleBucketCard: React.FC<{
  title: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
}> = ({ title, targetAmount, currentAmount, color }) => {
  const { locale, currency } = useLanguage();
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
  const progress = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  const isOver = currentAmount > targetAmount;

  return (
    <div className="p-4 rounded-lg bg-zinc-100 dark:bg-zinc-900/50">
      <div className="flex justify-between items-baseline mb-1">
        <h4 className="font-semibold text-zinc-800 dark:text-zinc-100">{title}</h4>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <span className={isOver ? 'text-red-500 dark:text-red-400 font-bold' : 'text-zinc-800 dark:text-zinc-100'}>{formatter.format(currentAmount)}</span> / {formatter.format(targetAmount)}
        </p>
      </div>
      <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full transition-all duration-500 ease-out ${color}`} style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

const RuleBasedBudgetWidget: React.FC = () => {
  const { budgetingRule, transactions } = useFinance();
  const { t, locale, currency } = useLanguage();

  if (!budgetingRule) {
    return (
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-center">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center justify-center gap-2">
          <PercentIcon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          {t('ruleBudget.title')}
        </h3>
        <p className="text-zinc-500 dark:text-zinc-500 text-sm">{t('ruleBudget.noRule')}</p>
      </div>
    );
  }
  
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthTxs = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  const currentMonthIncome = currentMonthTxs
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const spending = currentMonthTxs.reduce((acc, tx) => {
    if (tx.type === 'expense') {
      const bucket = tx.goalId ? 'savings' : getBucketForCategory(tx.category);
      acc[bucket] += tx.amount;
    }
    return acc;
  }, { needs: 0, wants: 0, savings: 0 });

  const targets = {
    needs: currentMonthIncome * (budgetingRule.needs / 100),
    wants: currentMonthIncome * (budgetingRule.wants / 100),
    savings: currentMonthIncome * (budgetingRule.savings / 100),
  };

  const ruleTitle = `${budgetingRule.needs}/${budgetingRule.wants}/${budgetingRule.savings}`;

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <PercentIcon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          {t('ruleBudget.title')}
        </h3>
        <span className="text-sm font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full">{ruleTitle}</span>
      </div>

      <div className="text-center mb-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('ruleBudget.currentMonthIncome')}</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatter.format(currentMonthIncome)}</p>
      </div>

      <div className="space-y-4">
        <RuleBucketCard title={t('ruleBudget.needs')} targetAmount={targets.needs} currentAmount={spending.needs} color="bg-blue-500" />
        <RuleBucketCard title={t('ruleBudget.wants')} targetAmount={targets.wants} currentAmount={spending.wants} color="bg-pink-500" />
        <RuleBucketCard title={t('ruleBudget.savings')} targetAmount={targets.savings} currentAmount={spending.savings} color="bg-green-500" />
      </div>
    </div>
  );
};

export default RuleBasedBudgetWidget;
