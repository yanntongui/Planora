
import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { Goal } from '../../types';
import TargetIcon from '../icons/TargetIcon';
import TrendingUpIcon from '../icons/TrendingUpIcon';
import TrendingDownIcon from '../icons/TrendingDownIcon';
import ArrowRightIcon from '../icons/ArrowRightIcon';

type GoalStatus = 'ahead' | 'onTrack' | 'behind';

const GoalCard: React.FC<{ goal: Goal }> = ({ goal }) => {
    const { setInspectedGoalId } = useFinance();
    const { t, locale, currency } = useLanguage();
    
    const progress = goal.target > 0 ? Math.min((goal.currentSaved / goal.target) * 100, 100) : 0;
    const remaining = goal.target - goal.currentSaved;

    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
    const compactFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency, notation: 'compact' });
    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short' });

    let status: GoalStatus = 'onTrack';
    let monthlyTarget = 0;

    if (goal.targetDate) {
        const now = new Date();
        const startDate = new Date(goal.createdAt);
        const targetDate = new Date(goal.targetDate);

        if (!isNaN(startDate.getTime()) && !isNaN(targetDate.getTime()) && targetDate > now) {
            const monthsRemaining = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
            if (monthsRemaining > 0) {
                monthlyTarget = (goal.target - goal.currentSaved) / monthsRemaining;
            } else {
                 monthlyTarget = (goal.target - goal.currentSaved);
            }

            const totalMonths = (targetDate.getFullYear() - startDate.getFullYear()) * 12 + (targetDate.getMonth() - startDate.getMonth());
            const monthsElapsed = Math.max(0, (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()));

            if (totalMonths > 0) {
                const idealSavings = (goal.target / totalMonths) * monthsElapsed;
                const difference = goal.currentSaved - idealSavings;
                const onTrackThreshold = (goal.target / totalMonths) * 0.05;

                if (difference > onTrackThreshold) status = 'ahead';
                else if (difference < -onTrackThreshold) status = 'behind';
                else status = 'onTrack';
            }
        }
    }
    
    const statusInfo = {
        ahead: { text: t('goals.statusAhead'), color: 'text-green-500 dark:text-green-400', icon: TrendingUpIcon },
        onTrack: { text: t('goals.statusOnTrack'), color: 'text-blue-500 dark:text-blue-400', icon: ArrowRightIcon },
        behind: { text: t('goals.statusBehind'), color: 'text-red-500 dark:text-red-400', icon: TrendingDownIcon },
    };
    const StatusIcon = statusInfo[status].icon;

    return (
        <button
            onClick={() => setInspectedGoalId(goal.id)}
            className="p-4 rounded-lg bg-zinc-100 dark:bg-zinc-900/50 flex flex-col gap-3 text-left w-full transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
            <div>
                <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-semibold text-zinc-800 dark:text-zinc-100">{goal.name}</h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        <span className="text-zinc-800 dark:text-zinc-100 font-bold">{compactFormatter.format(goal.currentSaved)}</span> / {compactFormatter.format(goal.target)}
                    </p>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5">
                    <div 
                        className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                 <p className="text-right text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    {t('goals.toGo', { amount: formatter.format(remaining < 0 ? 0 : remaining) })}
                </p>
            </div>
            
            {goal.targetDate && (
                <div className="mt-auto pt-3 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-3 text-center">
                    <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('goals.status')}</p>
                        <p className={`font-bold text-sm flex items-center justify-center gap-1 ${statusInfo[status].color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusInfo[status].text}
                        </p>
                    </div>
                     <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('goals.monthlyTarget')}</p>
                        <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{formatter.format(monthlyTarget > 0 ? monthlyTarget : 0)}</p>
                    </div>
                     <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('goals.targetDate')}</p>
                        <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{dateFormatter.format(new Date(goal.targetDate))}</p>
                    </div>
                </div>
            )}
        </button>
    );
};

const GoalsWidget: React.FC = () => {
    const { goals } = useFinance();
    const { t } = useLanguage();

    return (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <TargetIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
                {t('goals.title')}
            </h3>
            {goals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map(goal => (
                        <GoalCard key={goal.id} goal={goal} />
                    ))}
                </div>
            ) : (
                <p className="text-zinc-500 dark:text-zinc-500 text-sm">{t('goals.empty')}</p>
            )}
        </div>
    );
};

export default GoalsWidget;