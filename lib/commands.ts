
import React from 'react';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import PiggyBankIcon from '../components/icons/PiggyBankIcon';
import TargetIcon from '../components/icons/TargetIcon';
import PieChartIcon from '../components/icons/PieChartIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import RefreshCwIcon from '../components/icons/RefreshCwIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import UsersIcon from '../components/icons/UsersIcon';
import PercentIcon from '../components/icons/PercentIcon';
import PlusIcon from '../components/icons/PlusIcon';
import HelpCircleIcon from '../components/icons/HelpCircleIcon';
import LineChartIcon from '../components/icons/LineChartIcon';
import FileTextIcon from '../components/icons/FileTextIcon';
import BookIcon from '../components/icons/BookIcon';
import UserIcon from '../components/icons/UserIcon';

export interface Command {
  name: string;
  description: string;
  command: string;
  icon: React.ReactElement;
  keywords: string[];
  isActionable: boolean;
  isFeatured?: boolean;
}

export const getCommands = (t: (key: string) => string): Command[] => [
  {
    name: t('commands.addExpense.name'),
    description: t('commands.addExpense.description'),
    command: t('commands.addExpense.example'),
    icon: React.createElement(PlusIcon, { className: 'text-red-500' }),
    keywords: ['expense', 'add', 'transaction', 'dépense', 'ajouter'],
    isActionable: false,
    isFeatured: true,
  },
  {
    name: t('commands.addIncome.name'),
    description: t('commands.addIncome.description'),
    command: t('commands.addIncome.example'),
    icon: React.createElement(PlusIcon, { className: 'text-green-500' }),
    keywords: ['income', 'add', 'transaction', 'revenu', 'ajouter'],
    isActionable: false,
  },
  {
    name: t('commands.showShopping.name'),
    description: t('commands.showShopping.description'),
    command: t('commands.showShopping.example'),
    icon: React.createElement(ShoppingCartIcon, {}),
    keywords: ['shopping', 'list', 'courses', 'liste'],
    isActionable: true,
    isFeatured: true,
  },
  {
    name: t('commands.showBudgets.name'),
    description: t('commands.showBudgets.description'),
    command: t('commands.showBudgets.example'),
    icon: React.createElement(PiggyBankIcon, {}),
    keywords: ['budgets'],
    isActionable: true,
    isFeatured: true,
  },
  {
    name: t('commands.showGoals.name'),
    description: t('commands.showGoals.description'),
    command: t('commands.showGoals.example'),
    icon: React.createElement(TargetIcon, {}),
    keywords: ['goals', 'objectifs'],
    isActionable: true,
    isFeatured: true,
  },
  {
    name: t('commands.showGraph.name'),
    description: t('commands.showGraph.description'),
    command: t('commands.showGraph.example'),
    icon: React.createElement(PieChartIcon, {}),
    keywords: ['graph', 'chart', 'breakdown', 'graphique'],
    isActionable: true,
  },
  {
    name: t('commands.showForecast.name'),
    description: t('commands.showForecast.description'),
    command: t('commands.showForecast.example'),
    icon: React.createElement(LineChartIcon, {}),
    keywords: ['forecast', 'projection', 'future', 'avenir', 'prévision'],
    isActionable: true,
    isFeatured: true,
  },
  {
    name: t('commands.showInsights.name'),
    description: t('commands.showInsights.description'),
    command: t('commands.showInsights.example'),
    icon: React.createElement(SparklesIcon, {}),
    keywords: ['insights', 'analyze', 'aperçus', 'analyser'],
    isActionable: true,
  },
  {
    name: t('commands.showReports.name'),
    description: t('commands.showReports.description'),
    command: t('commands.showReports.example'),
    icon: React.createElement(FileTextIcon, {}),
    keywords: ['reports', 'monthly', 'rapports', 'mensuel'],
    isActionable: true,
  },
  {
    name: t('commands.showEducation.name'),
    description: t('commands.showEducation.description'),
    command: t('commands.showEducation.example'),
    icon: React.createElement(BookIcon, {}),
    keywords: ['learn', 'education', 'apprendre', 'cours'],
    isActionable: true,
  },
  {
    name: t('commands.showProfile.name'),
    description: t('commands.showProfile.description'),
    command: t('commands.showProfile.example'),
    icon: React.createElement(UserIcon, {}),
    keywords: ['profile', 'profil', 'stats', 'score'],
    isActionable: true,
  },
  {
    name: t('commands.showRecurring.name'),
    description: t('commands.showRecurring.description'),
    command: t('commands.showRecurring.example'),
    icon: React.createElement(RefreshCwIcon, {}),
    keywords: ['recurring', 'subscriptions', 'récurrents', 'abonnements'],
    isActionable: true,
  },
  {
    name: t('commands.showPlanning.name'),
    description: t('commands.showPlanning.description'),
    command: t('commands.showPlanning.example'),
    icon: React.createElement(CalendarIcon, {}),
    keywords: ['plan', 'planning', 'planification'],
    isActionable: true,
  },
  {
    name: t('commands.showDebts.name'),
    description: t('commands.showDebts.description'),
    command: t('commands.showDebts.example'),
    icon: React.createElement(UsersIcon, {}),
    keywords: ['debt', 'loan', 'dette', 'prêt'],
    isActionable: true,
  },
  {
    name: t('commands.createBudget.name'),
    description: t('commands.createBudget.description'),
    command: t('commands.createBudget.example'),
    icon: React.createElement(PiggyBankIcon, {}),
    keywords: ['create', 'budget', 'créer'],
    isActionable: false,
  },
  {
      name: t('commands.createGoal.name'),
      description: t('commands.createGoal.description'),
      command: t('commands.createGoal.example'),
      icon: React.createElement(TargetIcon, {}),
      keywords: ['create', 'goal', 'objectif', 'créer'],
      isActionable: false,
  },
  {
    name: t('commands.startMonthlyBudget.name'),
    description: t('commands.startMonthlyBudget.description'),
    command: t('commands.startMonthlyBudget.example'),
    icon: React.createElement(PercentIcon, {}),
    keywords: ['monthly', 'budget', 'mensuel', 'budget'],
    isActionable: true,
  },
  {
    name: t('commands.help.name'),
    description: t('commands.help.description'),
    command: t('commands.help.example'),
    icon: React.createElement(HelpCircleIcon, {}),
    keywords: ['help', 'aide', 'commandes', 'commands', '?'],
    isActionable: true,
  }
];
