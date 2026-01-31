
import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import UserIcon from '../icons/UserIcon';
import TargetIcon from '../icons/TargetIcon';
import TrendingUpIcon from '../icons/TrendingUpIcon';
import ShieldCheckIcon from '../icons/ShieldCheckIcon'; // Assuming we have this, or use CheckCircle
import { motion } from 'framer-motion';
import { UserProfile } from '../../types';

// Simple Circular Progress Component
const ScoreRing: React.FC<{ score: number, label: string, color: string }> = ({ score, label, color }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="40" cy="40" r={radius}
                        stroke="currentColor" strokeWidth="6"
                        fill="transparent"
                        className="text-zinc-200 dark:text-zinc-800"
                    />
                    <circle
                        cx="40" cy="40" r={radius}
                        stroke="currentColor" strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className={`${color} transition-all duration-1000 ease-out`}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-lg font-bold ${color}`}>{score}</span>
                </div>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1 text-center">{label}</span>
        </div>
    )
}

const ProfileWidget: React.FC = () => {
    const { userProfile, userName, userAvatar, goals } = useFinance();
    const { t } = useLanguage();

    const getMaturityLabel = (score: number) => {
        if (score < 40) return t('profile.maturity.beginner');
        if (score < 80) return t('profile.maturity.intermediate');
        return t('profile.maturity.advanced');
    };

    const getStressLabel = (level: string) => {
        return t(`profile.stress.${level}`);
    }

    const primaryGoalObj = goals.find(g => g.currentSaved < g.target) || goals[0];

    return (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center text-3xl shadow-sm border border-white dark:border-zinc-700">
                    {userAvatar}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{userName}</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                        {getMaturityLabel(userProfile.metrics.financialMaturityScore)} Investor
                        <span className="w-1 h-1 bg-zinc-400 rounded-full"/>
                        {t(`settings.persona.${userProfile.learningStyle}`)} Learner
                    </p>
                </div>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-3 gap-2 bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <ScoreRing 
                    score={userProfile.metrics.budgetDisciplineScore} 
                    label={t('profile.score.discipline')} 
                    color="text-blue-500" 
                />
                <ScoreRing 
                    score={userProfile.metrics.stabilityIndex} 
                    label={t('profile.score.stability')} 
                    color="text-green-500" 
                />
                <ScoreRing 
                    score={userProfile.metrics.financialMaturityScore} 
                    label={t('profile.score.maturity')} 
                    color="text-purple-500" 
                />
            </div>

            {/* Inferred Status */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <h4 className="text-xs uppercase font-bold text-zinc-500 mb-1">{t('profile.stressLevel')}</h4>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                            userProfile.inferred.stressLevel === 'low' ? 'bg-green-500' :
                            userProfile.inferred.stressLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                            {getStressLabel(userProfile.inferred.stressLevel)}
                        </span>
                    </div>
                </div>
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <h4 className="text-xs uppercase font-bold text-zinc-500 mb-1">{t('profile.primaryFocus')}</h4>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <TargetIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate text-sm">
                            {primaryGoalObj ? primaryGoalObj.name : t('goals.empty')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Recommendations / Insights based on profile */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                    <TrendingUpIcon className="w-4 h-4 text-indigo-500" />
                    {t('profile.nextSteps')}
                </h4>
                <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {userProfile.metrics.budgetDisciplineScore < 60 && (
                        <li className="flex gap-2 items-start">
                            <span className="text-blue-500">•</span> {t('profile.tip.improveDiscipline')}
                        </li>
                    )}
                    {userProfile.metrics.stabilityIndex < 50 && (
                        <li className="flex gap-2 items-start">
                            <span className="text-green-500">•</span> {t('profile.tip.buildEmergency')}
                        </li>
                    )}
                    {userProfile.inferred.stressLevel === 'high' && (
                        <li className="flex gap-2 items-start">
                            <span className="text-red-500">•</span> {t('profile.tip.reduceStress')}
                        </li>
                    )}
                    {userProfile.metrics.financialMaturityScore > 80 && (
                        <li className="flex gap-2 items-start">
                            <span className="text-purple-500">•</span> {t('profile.tip.invest')}
                        </li>
                    )}
                </ul>
            </div>
            
            <p className="text-[10px] text-zinc-400 text-center italic">
                {t('profile.disclaimer')}
            </p>
        </div>
    );
};

export default ProfileWidget;
