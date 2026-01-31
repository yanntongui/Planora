
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import LineChartIcon from '../icons/LineChartIcon';
import TrendingUpIcon from '../icons/TrendingUpIcon';

type ProjectionScenario = 'optimistic' | 'realistic' | 'conservative';
type ForecastDataPoint = {
  month: string;
  realistic: number;
  optimistic: number;
  conservative: number;
};

const CustomTooltip: React.FC<any> = ({ active, payload, label, currency, locale }) => {
  if (active && payload && payload.length) {
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 });
    return (
      <div className="bg-white dark:bg-zinc-800 p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl text-sm">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span className="capitalize font-medium">{entry.name}:</span>
            <span className="font-bold font-mono ml-auto">{formatter.format(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ForecastWidget: React.FC = () => {
  const { balance, transactions, recurringTransactions } = useFinance();
  const { t, locale, currency } = useLanguage();
  const { theme } = useTheme();
  const [duration, setDuration] = useState<3 | 6 | 12>(6);

  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 });

  const projectionData = useMemo(() => {
    const data: ForecastDataPoint[] = [];
    const now = new Date();
    
    // 1. Calculate Recurring Monthly Impact
    const monthlyRecurringIncome = recurringTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.frequency === 'weekly' ? t.amount * 4 : t.frequency === 'yearly' ? t.amount / 12 : t.amount), 0);
        
    const monthlyRecurringExpense = recurringTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.frequency === 'weekly' ? t.amount * 4 : t.frequency === 'yearly' ? t.amount / 12 : t.amount), 0);

    // 2. Calculate Variable Average (Last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    
    const variableTxs = transactions.filter(tx => new Date(tx.date) >= threeMonthsAgo);
    
    // Exclude transactions that seem to match recurring ones (rough logic: same amount and similar label)
    // For simplicity in this version, we assume user manages recurring separately or we take raw average.
    // A smarter approach: subtract recurring totals from raw totals if we assume history includes them.
    // Let's take the simpler approach: Analyze history as "Non-Recurring" flow estimate.
    
    const variableIncomeTotal = variableTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const variableExpenseTotal = variableTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    
    // Normalize to monthly average
    const monthsDiff = 3;
    const avgVariableIncome = variableIncomeTotal / monthsDiff;
    const avgVariableExpense = variableExpenseTotal / monthsDiff;

    // 3. Build Projection
    let currentRealistic = balance;
    let currentOptimistic = balance;
    let currentConservative = balance;

    for (let i = 0; i <= duration; i++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthLabel = monthDate.toLocaleDateString(locale, { month: 'short', year: '2-digit' });

        if (i === 0) {
            // Start point
            data.push({
                month: t('date.today'),
                realistic: balance,
                optimistic: balance,
                conservative: balance
            });
            continue;
        }

        // Base Flows
        // We use a blend: Recurring (known) + Variable Average (estimated)
        // Note: If history includes recurring, we are double counting. 
        // Heuristic: If recurring items exist, we rely more on them.
        // Let's assume Average Variable Expense calculated above includes EVERYTHING.
        // So we will use the Historical Average as the baseline for "Realistic".
        // And we use the Recurring List to adjust scenarios or if history is empty.
        
        let projectedIncome = avgVariableIncome;
        let projectedExpense = avgVariableExpense;

        // Fallback if no history: use recurring only
        if (variableTxs.length < 5) {
            projectedIncome = monthlyRecurringIncome;
            projectedExpense = monthlyRecurringExpense;
        }

        const netFlow = projectedIncome - projectedExpense;

        // Scenarios
        // Optimistic: Expense -10%
        // Conservative: Expense +10%
        
        const optFlow = projectedIncome - (projectedExpense * 0.9);
        const consFlow = projectedIncome - (projectedExpense * 1.1);

        currentRealistic += netFlow;
        currentOptimistic += optFlow;
        currentConservative += consFlow;

        data.push({
            month: monthLabel,
            realistic: currentRealistic,
            optimistic: currentOptimistic,
            conservative: currentConservative
        });
    }

    return data;
  }, [balance, transactions, recurringTransactions, duration, locale, t]);

  const endBalance = projectionData[projectionData.length - 1];
  const profit = endBalance.realistic - balance;
  const isProfitable = profit >= 0;

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <LineChartIcon className="w-5 h-5 text-indigo-500" />
          {t('forecast.title')}
        </h3>
        
        <div className="flex bg-zinc-200 dark:bg-zinc-800 p-1 rounded-lg">
            {[3, 6, 12].map((d) => (
                <button
                    key={d}
                    onClick={() => setDuration(d as any)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        duration === d 
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                >
                    {d}M
                </button>
            ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={projectionData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={theme === 'dark' ? '#27272a' : '#e4e4e7'} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} dy={10} stroke={theme === 'dark' ? '#71717a' : '#a1a1aa'} />
            <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => new Intl.NumberFormat(locale, { notation: "compact" }).format(val)} stroke={theme === 'dark' ? '#71717a' : '#a1a1aa'} />
            <Tooltip content={<CustomTooltip currency={currency} locale={locale} />} />
            <Legend verticalAlign="top" height={36} iconType="plainline" />
            <Line type="monotone" dataKey="optimistic" name={t('forecast.optimistic')} stroke="#10B981" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            <Line type="monotone" dataKey="realistic" name={t('forecast.realistic')} stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="conservative" name={t('forecast.conservative')} stroke="#F59E0B" strokeWidth={2} dot={false} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{t('forecast.projectedBalance')}</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{formatter.format(endBalance.realistic)}</p>
          </div>
          <div className={`text-right ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <p className="text-xs font-medium flex items-center justify-end gap-1">
                  <TrendingUpIcon className={`w-3 h-3 ${!isProfitable && 'rotate-180'}`} />
                  {isProfitable ? '+' : ''}{formatter.format(profit)}
              </p>
              <p className="text-[10px] opacity-70">
                  {t('forecast.trend', { months: duration })}
              </p>
          </div>
      </div>
    </div>
  );
};

export default ForecastWidget;
