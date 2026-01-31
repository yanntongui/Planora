
import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { Budget } from '../../types';
import CalendarIcon from '../icons/CalendarIcon';

const BudgetCard: React.FC<{ budget: Budget }> = ({ budget }) => {
  const { setInspectedBudgetId, categories } = useFinance();
  const { t, locale, currency } = useLanguage();
  const progress = Math.min((budget.currentSpent / budget.limit) * 100, 100);
  const remaining = budget.limit - budget.currentSpent;
  const isOverBudget = progress >= 100;

  const progressColor = isOverBudget ? 'bg-red-500' : 'bg-purple-500';

  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: currency });

  const getDaysLeftInMonth = () => {
    if (budget.type !== 'monthly') return null;
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysLeft = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  const daysLeft = getDaysLeftInMonth();

  const budgetName = React.useMemo(() => {
      if (budget.type === 'monthly' && budget.category) {
          const cat = categories.find(c => c.id === budget.category);
          return cat ? (cat.isCustom ? cat.name : t(cat.name)) : budget.name;
      }
      return budget.name;
  }, [budget, categories, t]);

  return (
    <button
      onClick={() => setInspectedBudgetId(budget.id)}
      className="p-4 rounded-lg bg-zinc-100 dark:bg-zinc-900/50 text-left w-full transition-transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="flex justify-between items-baseline mb-1">
        <h4 className="font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            {budget.type === 'monthly' && <CalendarIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />}
            {budgetName}
        </h4>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <span className={isOverBudget ? 'text-red-500 dark:text-red-400 font-bold' : 'text-zinc-800 dark:text-zinc-100'}>{formatter.format(budget.currentSpent)}</span> / {formatter.format(budget.limit)}
        </p>
      </div>
      <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5">
        <div className={`${progressColor} h-2.5 rounded-full transition-all duration-500 ease-out`} style={{ width: `${progress}%` }}></div>
      </div>
       <p className="text-right text-xs text-zinc-400 dark:text-zinc-500 mt-1">
          {isOverBudget 
            ? t('budgets.overBudget', { amount: formatter.format(Math.abs(remaining)) })
            : (daysLeft !== null ? t('budgets.daysLeft', { count: daysLeft }) : t('budgets.remaining', { amount: formatter.format(remaining) }))
          }
        </p>
    </button>
  );
};

const BudgetsWidget: React.FC = () => {
  const { budgets } = useFinance();
  const { t } = useLanguage();

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">{t('budgets.title')}</h3>
      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map(budget => (
            <BudgetCard key={budget.id} budget={budget} />
          ))}
        </div>
      ) : (
        <p className="text-zinc-500 dark:text-zinc-500 text-sm">{t('budgets.empty')}</p>
      )}
    </div>
  );
};

export default BudgetsWidget;
