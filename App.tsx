
import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import BalanceDisplay from './components/BalanceDisplay';
import CommandBar from './components/CommandBar';
import TransactionList from './components/TransactionList';
import ShoppingListWidget from './components/widgets/ShoppingListWidget';
import BudgetsWidget from './components/widgets/BudgetsWidget';
import GoalsWidget from './components/widgets/GoalsWidget';
import InsightsWidget from './components/widgets/InsightsWidget';
import GraphWidget from './components/widgets/GraphWidget';
import RecurringWidget from './components/widgets/RecurringWidget';
import PlanningWidget from './components/widgets/PlanningWidget';
import RuleBasedBudgetWidget from './components/widgets/RuleBasedBudgetWidget';
import TableBudgetWidget from './components/widgets/TableBudgetWidget';
import BudgetCreationWidget from './components/widgets/BudgetCreationWidget';
import DebtWidget from './components/widgets/DebtWidget';
import ForecastWidget from './components/widgets/ForecastWidget';
import MonthlyReportWidget from './components/widgets/MonthlyReportWidget';
import DashboardView from './components/DashboardView';
import BudgetDetailWidget from './components/widgets/BudgetDetailWidget';
import GoalDetailWidget from './components/widgets/GoalDetailWidget';
import EducationWidget from './components/widgets/EducationWidget';
import ProfileWidget from './components/widgets/ProfileWidget';
import { ActiveWidget } from './types';
import Sidebar from './components/Sidebar';
import MenuIcon from './components/icons/MenuIcon';
import MicIcon from './components/icons/MicIcon';
import LoaderIcon from './components/icons/LoaderIcon';
import { motion, AnimatePresence } from 'framer-motion';
import SettingsModal from './components/SettingsModal';
import SimulationBanner from './components/SimulationBanner';
import LiveAssistant from './components/LiveAssistant';
import LandingPage from './components/landing/LandingPage';
import LoginView from './components/auth/LoginView';
import SignupView from './components/auth/SignupView';
import CommandHelpModal from './components/CommandHelpModal';

const AppContent: React.FC = () => {
  const { activeWidget, budgetCreationState, inspectedBudgetId, inspectedGoalId, isSimulating, setLiveAssistantOpen, userName, isHelpOpen, setHelpOpen, setCommandInput } = useFinance();
  const { t } = useLanguage();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // View State for Landing/Auth routing
  const [view, setView] = useState<'landing' | 'login' | 'signup'>('landing');

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-zinc-950">
        <LoaderIcon className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
      </div>
    );
  }

  // If authenticated, show the main app
  if (isAuthenticated && user) {
      const renderContent = () => {
        if (inspectedBudgetId) return <BudgetDetailWidget />;
        if (inspectedGoalId) return <GoalDetailWidget />;
        
        if (budgetCreationState.step !== 'idle') {
          return <BudgetCreationWidget />;
        }
        switch (activeWidget) {
          case ActiveWidget.SHOPPING_LIST: return <ShoppingListWidget />;
          case ActiveWidget.BUDGETS: return <BudgetsWidget />;
          case ActiveWidget.GOALS: return <GoalsWidget />;
          case ActiveWidget.INSIGHTS: return <InsightsWidget />;
          case ActiveWidget.GRAPH: return <GraphWidget />;
          case ActiveWidget.RECURRING: return <RecurringWidget />;
          case ActiveWidget.PLANNING: return <PlanningWidget />;
          case ActiveWidget.RULE_BASED_BUDGET: return <RuleBasedBudgetWidget />;
          case ActiveWidget.TABLE_BUDGET: return <TableBudgetWidget />;
          case ActiveWidget.DEBT: return <DebtWidget />;
          case ActiveWidget.FORECAST: return <ForecastWidget />;
          case ActiveWidget.REPORTS: return <MonthlyReportWidget />;
          case ActiveWidget.EDUCATION: return <EducationWidget />;
          case ActiveWidget.PROFILE: return <ProfileWidget />;
          case ActiveWidget.NONE:
          default: return <DashboardView />;
        }
      };

      return (
        <div className={`flex h-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white transition-all ${isSimulating ? 'ring-4 ring-inset ring-cyan-500/20' : ''}`}>
           <SimulationBanner />
           <LiveAssistant />
           <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
           <CommandHelpModal 
              isOpen={isHelpOpen} 
              onClose={() => setHelpOpen(false)} 
              onExecute={(cmd) => {
                  setCommandInput(cmd);
                  setHelpOpen(false);
              }}
           />
          <div className="hidden md:flex md:flex-shrink-0">
            <Sidebar openSettings={() => setIsSettingsOpen(true)} />
          </div>

          <AnimatePresence>
            {isSidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="fixed inset-0 bg-black/60 z-30 md:hidden"
                  onClick={() => setIsSidebarOpen(false)}
                />
                <motion.div
                  className="fixed top-0 left-0 h-full z-40 md:hidden"
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <Sidebar closeSidebar={() => setIsSidebarOpen(false)} openSettings={() => setIsSettingsOpen(true)} />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="flex flex-col flex-1 w-full relative">
            <button
              className="md:hidden absolute top-4 left-4 z-20 p-2 rounded-full bg-zinc-100/50 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              aria-label={t('sidebar.openMenu')}
            >
              <MenuIcon className="w-6 h-6" />
            </button>

            <main className={`flex-1 flex flex-col items-center p-4 overflow-y-auto ${isSimulating ? 'pt-24 md:pt-32' : 'pt-20 md:pt-32'}`}>
              <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
                <BalanceDisplay />
                <CommandBar />
                <div className="transition-all duration-300 ease-in-out">{renderContent()}</div>
                <TransactionList />
              </div>
              <footer className="text-zinc-400 dark:text-zinc-600 text-xs text-center py-4 mt-auto w-full max-w-2xl mx-auto">
                <p>{t('footer.title')}</p>
                <p>{t('footer.instructions')}</p>
              </footer>
            </main>
            
            {/* Live Assistant FAB */}
            <button
                onClick={() => setLiveAssistantOpen(true)}
                className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all z-40"
                aria-label="Start Voice Assistant"
            >
                <MicIcon className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      );
  }

  // Not authenticated routing
  if (view === 'login') return <LoginView onSwitch={() => setView('signup')} />;
  if (view === 'signup') return <SignupView onSwitch={() => setView('login')} />;
  
  // Default to Landing Page
  return <LandingPage onLogin={() => setView('login')} onSignup={() => setView('signup')} />;
};

const App: React.FC = () => (
  <LanguageProvider>
    <AuthProvider>
      <FinanceProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </FinanceProvider>
    </AuthProvider>
  </LanguageProvider>
);

export default App;
