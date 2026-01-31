
import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';

const PlanningWidget: React.FC = () => {
    const { monthlyPlan, budgets, recurringTransactions, goals } = useFinance();
    const { t, locale, currency } = useLanguage();

    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: currency });

    if (!monthlyPlan || monthlyPlan.plannedIncome === 0) {
        return (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-center">
                 <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{t('planning.title')}</h3>
                <p className="text-zinc-500 dark:text-zinc-500 text-sm">{t('planning.noPlan')}</p>
            </div>
        );
    }
    
    const { plannedIncome, plannedContributions } = monthlyPlan;
    
    const totalMonthlyBudgets = budgets.filter(b => b.type === 'monthly').reduce((sum, b) => sum + b.limit, 0);
    const totalRecurringExpenses = recurringTransactions.filter(r => r.type === 'expense' && r.frequency === 'monthly').reduce((sum, r) => sum + r.amount, 0);
    const totalPlannedSavings = plannedContributions.reduce((sum, c) => sum + c.amount, 0);

    const totalAssigned = totalMonthlyBudgets + totalRecurringExpenses + totalPlannedSavings;
    const leftToAssign = plannedIncome - totalAssigned;
    
    const leftToAssignColor = leftToAssign > 0 ? 'text-yellow-500 dark:text-yellow-400' : leftToAssign < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400';

    const breakdownItems = [
        { label: t('planning.monthlyBudgets'), amount: totalMonthlyBudgets, visible: totalMonthlyBudgets > 0 },
        { label: t('planning.recurringExpenses'), amount: totalRecurringExpenses, visible: totalRecurringExpenses > 0 },
        { label: t('planning.plannedSavings'), amount: totalPlannedSavings, visible: totalPlannedSavings > 0 },
    ].filter(item => item.visible);

    return (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{t('planning.title')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
                <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('planning.plannedIncome')}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatter.format(plannedIncome)}</p>
                </div>
                <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('planning.totalAssigned')}</p>
                    <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{formatter.format(totalAssigned)}</p>
                </div>
                <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('planning.leftToAssign')}</p>
                    <p className={`text-2xl font-bold ${leftToAssignColor}`}>{formatter.format(leftToAssign)}</p>
                </div>
            </div>
            
            {breakdownItems.length > 0 && (
                <div>
                    <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{t('planning.breakdownTitle')}</h4>
                    <ul className="space-y-2 text-sm">
                        {breakdownItems.map(item => (
                             <li key={item.label} className="flex justify-between p-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-md">
                                <span className="text-zinc-600 dark:text-zinc-400">{item.label}</span>
                                <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatter.format(item.amount)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PlanningWidget;
