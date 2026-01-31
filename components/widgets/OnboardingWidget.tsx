
import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import PlusIcon from '../icons/PlusIcon';
import ArrowRightIcon from '../icons/ArrowRightIcon';

const OnboardingWidget: React.FC = () => {
    const { transactions, budgets, goals, setCommandInput } = useFinance();
    const { t } = useLanguage();

    // Determine completion status based on real data
    const hasExpense = useMemo(() => transactions.some(t => t.type === 'expense'), [transactions]);
    const hasIncome = useMemo(() => transactions.some(t => t.type === 'income'), [transactions]);
    const hasBudget = useMemo(() => budgets.length > 0, [budgets]);
    const hasGoal = useMemo(() => goals.length > 0, [goals]);

    const steps = [
        {
            id: 'expense',
            title: t('onboarding.stepExpenseTitle'),
            desc: t('onboarding.stepExpenseDesc'),
            command: t('commands.addExpense.example'),
            isDone: hasExpense
        },
        {
            id: 'income',
            title: t('onboarding.stepIncomeTitle'),
            desc: t('onboarding.stepIncomeDesc'),
            command: t('commands.addIncome.example'),
            isDone: hasIncome
        },
        {
            id: 'budget',
            title: t('onboarding.stepBudgetTitle'),
            desc: t('onboarding.stepBudgetDesc'),
            command: t('commands.createBudget.example'),
            isDone: hasBudget
        },
        {
            id: 'goal',
            title: t('onboarding.stepGoalTitle'),
            desc: t('onboarding.stepGoalDesc'),
            command: t('commands.createGoal.example'),
            isDone: hasGoal
        }
    ];

    const completedSteps = steps.filter(s => s.isDone).length;
    const progress = (completedSteps / steps.length) * 100;
    const allDone = completedSteps === steps.length;

    const handleTryClick = (command: string) => {
        setCommandInput(command);
        // Focus is handled by the command bar listening to input changes or we rely on user clicking input
        // Ideally we focus the input, but passing ref is complex here. 
        // The CommandBar observes input state, so this updates the UI.
        // We can dispatch a custom event or just let the user see the text appear.
        const inputElement = document.querySelector('input[type="text"]');
        if (inputElement instanceof HTMLInputElement) {
            inputElement.focus();
        }
    };

    if (allDone) return null;

    return (
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm mb-6">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <span>🚀</span> {t('onboarding.title')}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {t('onboarding.subtitle', { count: completedSteps, total: steps.length })}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{Math.round(progress)}%</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 mb-6">
                <motion.div 
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {steps.map((step) => (
                    <div 
                        key={step.id}
                        className={`p-3 rounded-lg border transition-all ${
                            step.isDone 
                                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30' 
                                : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                step.isDone ? 'bg-green-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                            }`}>
                                {step.isDone ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />}
                            </div>
                            <div className="flex-grow min-w-0">
                                <h4 className={`text-sm font-semibold ${step.isDone ? 'text-green-800 dark:text-green-200' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                    {step.title}
                                </h4>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                                    {step.desc}
                                </p>
                                {!step.isDone && (
                                    <button 
                                        onClick={() => handleTryClick(step.command)}
                                        className="mt-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 flex items-center gap-1 group"
                                    >
                                        {t('onboarding.tryIt')} <span className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] text-zinc-600 dark:text-zinc-300 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">{step.command}</span>
                                        <ArrowRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OnboardingWidget;
