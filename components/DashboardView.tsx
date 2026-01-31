
import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { ActiveWidget, Budget, Goal } from '../types';
import ArrowUpCircleIcon from './icons/ArrowUpCircleIcon';
import ArrowDownCircleIcon from './icons/ArrowDownCircleIcon';
import PiggyBankIcon from './icons/PiggyBankIcon';
import TargetIcon from './icons/TargetIcon';
import { motion } from 'framer-motion';
import OnboardingWidget from './widgets/OnboardingWidget';
import CoachAlerts from './CoachAlerts';

const StatCard: React.FC<{ title: string; amount: number; icon: React.ReactElement }> = ({ title, amount, icon }) => {
    const { locale, currency } = useLanguage();
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });

    return (
        <div
            className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-lg flex items-center gap-4 overflow-hidden"
            role="status"
            aria-label={`${title}: ${formatter.format(amount)}`}
        >
            <div className="text-2xl flex-shrink-0" aria-hidden="true">{icon}</div>
            <div className="min-w-0">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{title}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">{formatter.format(amount)}</p>
            </div>
        </div>
    );
};

const MiniBudgetCard: React.FC<{ budget: Budget }> = ({ budget }) => {
    const { setInspectedBudgetId } = useFinance();
    const { t, locale, currency } = useLanguage();
    const progress = Math.min((budget.currentSpent / budget.limit) * 100, 100);
    const remaining = budget.limit - budget.currentSpent;
    const isOverBudget = progress >= 100;
    const progressColor = isOverBudget ? 'bg-red-500' : 'bg-purple-500';
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency, notation: 'compact' });

    return (
        <button
            onClick={() => setInspectedBudgetId(budget.id)}
            className="bg-zinc-100 dark:bg-zinc-900/50 p-3 rounded-lg w-full text-left transition-transform hover:scale-[1.03] active:scale-[0.99]"
        >
            <div className="flex justify-between items-baseline mb-1 text-sm">
                <h4 className="font-semibold text-zinc-800 dark:text-zinc-100 truncate pr-2 flex-grow">
                    {budget.type === 'monthly' ? t(`categories.${budget.category}`) : budget.name}
                </h4>
                <p className="text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                    <span className={isOverBudget ? 'text-red-500 font-bold' : 'text-zinc-800 dark:text-zinc-100'}>{formatter.format(budget.currentSpent)}</span> / {formatter.format(budget.limit)}
                </p>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                <div className={`${progressColor} h-2 rounded-full`} style={{ width: `${progress}%` }}></div>
            </div>
        </button>
    );
};

const MiniGoalCard: React.FC<{ goal: Goal }> = ({ goal }) => {
    const { locale, currency } = useLanguage();
    const progress = goal.target > 0 ? Math.min((goal.currentSaved / goal.target) * 100, 100) : 0;
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency, notation: 'compact' });

    return (
        <div className="bg-zinc-100 dark:bg-zinc-900/50 p-3 rounded-lg">
            <div className="flex justify-between items-baseline mb-1 text-sm">
                <h4 className="font-semibold text-zinc-800 dark:text-zinc-100 truncate pr-2 flex-grow">{goal.name}</h4>
                <p className="text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400 font-bold">{formatter.format(goal.currentSaved)}</span> / {formatter.format(goal.target)}
                </p>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
};


const DashboardView: React.FC = () => {
    const { transactions, budgets, goals, setActiveWidget } = useFinance();
    const { t } = useLanguage();

    const { income, expenses, net } = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyTxs = transactions.filter(tx => new Date(tx.date) >= startOfMonth);
        const income = monthlyTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
        const expenses = monthlyTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
        return { income, expenses, net: income - expenses };
    }, [transactions]);

    const topBudgets = useMemo(() => budgets.slice(0, 2), [budgets]);
    const topGoals = useMemo(() => goals.slice(0, 2), [goals]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants}>
                <CoachAlerts />
            </motion.div>

            <motion.div variants={itemVariants}>
                <OnboardingWidget />
            </motion.div>

            <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" variants={itemVariants}>
                <StatCard title={t('sidebar.monthlyIncome')} amount={income} icon={<ArrowUpCircleIcon className="text-green-500" />} />
                <StatCard title={t('sidebar.monthlyExpenses')} amount={expenses} icon={<ArrowDownCircleIcon className="text-red-500" />} />
                <StatCard title={t('sidebar.netSavings')} amount={net} icon={<PiggyBankIcon className={net >= 0 ? 'text-blue-500' : 'text-orange-500'} />} />
            </motion.div>

            {topBudgets.length > 0 && (
                <motion.div variants={itemVariants}>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">{t('budgets.title')}</h3>
                        <button onClick={() => setActiveWidget(ActiveWidget.BUDGETS)} className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">{t('dashboard.viewAll')}</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {topBudgets.map(b => <MiniBudgetCard key={b.id} budget={b} />)}
                    </div>
                </motion.div>
            )}

            {topGoals.length > 0 && (
                <motion.div variants={itemVariants}>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">{t('goals.title')}</h3>
                        <button onClick={() => setActiveWidget(ActiveWidget.GOALS)} className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">{t('dashboard.viewAll')}</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {topGoals.map(g => <MiniGoalCard key={g.id} goal={g} />)}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default DashboardView;
