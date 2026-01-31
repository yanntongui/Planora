
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Transaction, ShoppingItem, ShoppingList, Budget, Goal, RecurringTransaction, MonthlyPlan, BudgetingRule, SubCategory, FinanceContextType, ActiveWidget, BudgetCreationState, BudgetMethod, Conversation, Debt, Category, Bucket, AiPersona, MonthlyReport, Installment, EducationState, UserProfile } from '../types';
import { getDefaultSubCategories } from '../lib/rule-mapper';
import { suggestBudget } from '../lib/budget-suggester';
import { generateMonthlyReportData } from '../lib/report-generator';
import { recalculateProfile } from '../lib/profile-intelligence';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLanguage } from './LanguageContext';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

interface FinancialState {
    userName: string;
    userAvatar: string;
    aiPersona: AiPersona;
    userProfile: UserProfile; // Added
    isPrivacyMode: boolean;
    transactions: Transaction[];
    shoppingLists: ShoppingList[];
    activeShoppingListId: string | null;
    budgets: Budget[];
    goals: Goal[];
    recurringTransactions: RecurringTransaction[];
    monthlyPlan: MonthlyPlan | null;
    budgetingRule: BudgetingRule | null;
    subCategories: SubCategory[];
    activeWidget: ActiveWidget;
    budgetCreationState: BudgetCreationState;
    debts: Debt[];
    monthlyReports: MonthlyReport[];
    aliases: Record<string, string>;
    inspectedBudgetId: string | null;
    inspectedGoalId: string | null;
    inspectedReportId: string | null;
    categories: Category[];
    educationState: EducationState;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'foodAndDining', name: 'categories.foodAndDining', bucket: 'needs', isCustom: false },
  { id: 'transport', name: 'categories.transport', bucket: 'needs', isCustom: false },
  { id: 'shopping', name: 'categories.shopping', bucket: 'wants', isCustom: false },
  { id: 'entertainment', name: 'categories.entertainment', bucket: 'wants', isCustom: false },
  { id: 'billsAndUtilities', name: 'categories.billsAndUtilities', bucket: 'needs', isCustom: false },
  { id: 'health', name: 'categories.health', bucket: 'needs', isCustom: false },
  { id: 'income', name: 'categories.income', bucket: 'wants', isCustom: false }, // Special case
  { id: 'general', name: 'categories.general', bucket: 'wants', isCustom: false }
];

const INITIAL_PROFILE: UserProfile = {
    financialMethod: 'custom',
    riskTolerance: 'medium',
    learningStyle: 'visual',
    metrics: {
        financialMaturityScore: 0,
        budgetDisciplineScore: 0,
        stabilityIndex: 0,
        monthlyProgress: 0
    },
    inferred: {
        stressLevel: 'low',
        educationalLevel: 'beginner',
        topSpendingCategory: null
    },
    lastUpdated: new Date().toISOString()
};

const initialFinancialState: FinancialState = {
    userName: 'Utilisateur',
    userAvatar: '👤',
    aiPersona: 'benevolent',
    userProfile: INITIAL_PROFILE,
    isPrivacyMode: false,
    transactions: [],
    shoppingLists: [],
    activeShoppingListId: null,
    budgets: [],
    goals: [],
    recurringTransactions: [],
    monthlyPlan: { month: new Date().toISOString().slice(0, 7), plannedIncome: 0, plannedContributions: [] },
    budgetingRule: null,
    subCategories: [],
    activeWidget: ActiveWidget.NONE,
    budgetCreationState: { step: 'idle', income: null, isGenerating: false },
    debts: [],
    monthlyReports: [],
    aliases: {},
    inspectedBudgetId: null,
    inspectedGoalId: null,
    inspectedReportId: null,
    categories: DEFAULT_CATEGORIES,
    educationState: { readResourceIds: [], activePathId: null }
};

interface AppState {
    conversations: Conversation[];
    activeConversationId: string | null;
    financialData: { [conversationId: string]: FinancialState };
}

const getCurrentMonthKey = () => new Date().toISOString().slice(0, 7); // YYYY-MM

// Helper to generate installments
const generateInstallments = (totalAmount: number, dueDateStr: string): Installment[] => {
    const installments: Installment[] = [];
    const now = new Date();
    const dueDate = new Date(dueDateStr);
    
    // Safety check: if due date is passed or invalid, no schedule
    if (dueDate <= now || isNaN(dueDate.getTime())) return [];

    // Calculate months difference
    const months = (dueDate.getFullYear() - now.getFullYear()) * 12 + (dueDate.getMonth() - now.getMonth());
    
    // We want at least 1 installment if date is future
    const count = Math.max(1, months); 
    const monthlyAmount = Math.floor(totalAmount / count);
    const remainder = totalAmount - (monthlyAmount * count);

    for (let i = 1; i <= count; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1); // 1st of next month
        // Adjust last month with remainder
        const amount = i === count ? monthlyAmount + remainder : monthlyAmount;
        
        installments.push({
            id: crypto.randomUUID(),
            date: date.toISOString(),
            amount: amount,
            isPaid: false
        });
    }
    return installments;
};

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useLocalStorage<AppState>('prompt-finance-state', {
    conversations: [],
    activeConversationId: null,
    financialData: {},
  });
  
  // Access language for report generation context
  const { language } = useLanguage();

  // UI State
  const [commandInput, setCommandInput] = useState('');
  const [isLiveAssistantOpen, setLiveAssistantOpen] = useState(false);
  const [isHelpOpen, setHelpOpen] = useState(false);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationState, setSimulationState] = useState<FinancialState | null>(null);

  const [balance, setBalance] = useState<number>(0);

  const activeConversationId = appState.activeConversationId;
  const currentConversation = useMemo(() => appState.conversations.find(c => c.id === activeConversationId), [appState.conversations, activeConversationId]);

  // This helper decides whether to update the real AppState or the temporary SimulationState
  const updateCurrentFinancialState = useCallback((updater: (prevState: FinancialState) => FinancialState) => {
    if (isSimulating && simulationState) {
        setSimulationState(prev => prev ? updater(prev) : null);
    } else {
        if (!activeConversationId) return;
        setAppState(prev => {
            const currentData = prev.financialData[activeConversationId] || initialFinancialState;
            const newData = updater(currentData);
            return {
                ...prev,
                financialData: {
                    ...prev.financialData,
                    [activeConversationId]: newData,
                },
            };
        });
    }
  }, [activeConversationId, setAppState, isSimulating, simulationState]);
  
  // The data exposed to the app. If simulating, return simulationState.
  const currentFinancialState = useMemo(() => {
    if (isSimulating && simulationState) {
        return simulationState;
    }
    if (!activeConversationId) return initialFinancialState;
    const state = appState.financialData[activeConversationId] || initialFinancialState;
    // Backward compatibility
    return {
        ...state,
        categories: state.categories || DEFAULT_CATEGORIES,
        userAvatar: state.userAvatar || '👤',
        aiPersona: state.aiPersona || 'benevolent',
        isPrivacyMode: state.isPrivacyMode || false,
        monthlyReports: state.monthlyReports || [],
        inspectedReportId: state.inspectedReportId || null,
        educationState: state.educationState || { readResourceIds: [], activePathId: null },
        userProfile: state.userProfile || INITIAL_PROFILE // Initialize profile if missing
    };
  }, [activeConversationId, appState.financialData, isSimulating, simulationState]);

  const { userName, userAvatar, aiPersona, isPrivacyMode, transactions, shoppingLists, activeShoppingListId, budgets, goals, recurringTransactions, monthlyPlan, budgetingRule, subCategories, activeWidget, budgetCreationState, debts, monthlyReports, aliases, inspectedBudgetId, inspectedGoalId, inspectedReportId, categories, educationState, userProfile } = currentFinancialState;

  // --- PROFILE INTELLIGENCE UPDATE ---
  useEffect(() => {
      // Recalculate profile logic if data changes significantly (e.g., loaded or updated)
      // To avoid infinite loops, we check if metrics have actually changed or if it's been a while.
      // For simplicity in this demo, we run it if transaction count changes or budget count changes.
      
      const updatedProfile = recalculateProfile(userProfile, transactions, budgets, goals, debts);
      
      // Only update if metrics changed significantly to avoid re-renders
      if (
          updatedProfile.metrics.financialMaturityScore !== userProfile.metrics.financialMaturityScore ||
          updatedProfile.metrics.budgetDisciplineScore !== userProfile.metrics.budgetDisciplineScore ||
          updatedProfile.metrics.stabilityIndex !== userProfile.metrics.stabilityIndex ||
          updatedProfile.inferred.stressLevel !== userProfile.inferred.stressLevel
      ) {
          updateCurrentFinancialState(prev => ({ ...prev, userProfile: updatedProfile }));
      }
  }, [transactions.length, budgets.length, goals.length, debts.length, updateCurrentFinancialState]); 
  // Dependency on length is a heuristic. In production, deep compare or specific triggers.

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
      updateCurrentFinancialState(prev => ({
          ...prev,
          userProfile: { ...prev.userProfile, ...updates }
      }));
  }, [updateCurrentFinancialState]);

  // --- REPORT GENERATION LOGIC ---
  const checkAndGenerateReports = useCallback(async () => {
      // Don't run in simulation or if no data
      if (isSimulating || !activeConversationId || transactions.length === 0) return;

      const now = new Date();
      // Check last month
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Check if report exists
      const reportExists = monthlyReports.some(r => r.id === lastMonthKey);
      
      if (!reportExists) {
          console.log(`Generating report for ${lastMonthKey}...`);
          try {
              const newReport = await generateMonthlyReportData(
                  lastMonthDate.getMonth(),
                  lastMonthDate.getFullYear(),
                  transactions,
                  subCategories,
                  categories,
                  aiPersona,
                  language
              );
              
              updateCurrentFinancialState(prev => ({
                  ...prev,
                  monthlyReports: [newReport, ...(prev.monthlyReports || [])]
              }));
          } catch (e) {
              console.error("Failed to generate monthly report automatically", e);
          }
      }
  }, [isSimulating, activeConversationId, transactions, monthlyReports, subCategories, categories, aiPersona, language, updateCurrentFinancialState]);

  useEffect(() => {
      const timer = setTimeout(() => {
          checkAndGenerateReports();
      }, 3000); // Small delay to allow hydration and avoid blocking main thread immediately
      return () => clearTimeout(timer);
  }, [checkAndGenerateReports]);
  // -------------------------------

  // Simulation Control Actions
  const startSimulation = useCallback(() => {
      // Deep copy current state to simulation state
      setSimulationState(JSON.parse(JSON.stringify(currentFinancialState)));
      setIsSimulating(true);
  }, [currentFinancialState]);

  const commitSimulation = useCallback(() => {
      if (simulationState && activeConversationId) {
          setAppState(prev => ({
              ...prev,
              financialData: {
                  ...prev.financialData,
                  [activeConversationId]: simulationState
              }
          }));
      }
      setIsSimulating(false);
      setSimulationState(null);
  }, [simulationState, activeConversationId, setAppState]);

  const cancelSimulation = useCallback(() => {
      setIsSimulating(false);
      setSimulationState(null);
  }, []);


  useEffect(() => {
    if (appState.conversations.length === 0) {
      const newId = crypto.randomUUID();
      const newConversation: Conversation = { id: newId, name: 'Conversation 1', createdAt: new Date().toISOString(), status: 'active' };
      setAppState({
        conversations: [newConversation],
        activeConversationId: newId,
        financialData: { [newId]: initialFinancialState },
      });
    }
  }, [appState.conversations.length, setAppState]);

  const createConversation = useCallback(() => {
    const newId = crypto.randomUUID();
    const newConversation: Conversation = {
      id: newId,
      name: `Budget ${appState.conversations.length + 1}`,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    setAppState(prev => ({
      conversations: [...prev.conversations, newConversation],
      activeConversationId: newId,
      financialData: {
        ...prev.financialData,
        [newId]: { ...initialFinancialState, userName: prev.financialData[prev.activeConversationId!]?.userName || 'Utilisateur' },
      },
    }));
  }, [appState.conversations, setAppState]);

  const duplicateConversation = useCallback((id: string) => {
      setAppState(prev => {
          const sourceConversation = prev.conversations.find(c => c.id === id);
          const sourceData = prev.financialData[id];
          if (!sourceConversation || !sourceData) return prev;

          const newId = crypto.randomUUID();
          const newConversation: Conversation = {
              id: newId,
              name: `${sourceConversation.name} (Copy)`,
              createdAt: new Date().toISOString(),
              status: 'active'
          };

          const newData = JSON.parse(JSON.stringify(sourceData)); // Deep copy

          return {
              conversations: [...prev.conversations, newConversation],
              activeConversationId: newId,
              financialData: {
                  ...prev.financialData,
                  [newId]: newData
              }
          };
      });
  }, [setAppState]);

  const archiveConversation = useCallback((id: string) => {
      setAppState(prev => {
          const updatedConversations = prev.conversations.map(c => 
              c.id === id ? { ...c, status: c.status === 'archived' ? 'active' : 'archived' } as Conversation : c
          );
          
          let newActiveId = prev.activeConversationId;
          // If archiving the active one, switch to another active one if possible
          if (prev.activeConversationId === id) {
              const otherActive = updatedConversations.find(c => c.status === 'active' && c.id !== id);
              if (otherActive) newActiveId = otherActive.id;
          }

          return {
              ...prev,
              conversations: updatedConversations,
              activeConversationId: newActiveId
          };
      });
  }, [setAppState]);

  const switchConversation = useCallback((id: string) => {
    setAppState(prev => ({ ...prev, activeConversationId: id }));
    // Reset simulation if switching conv
    if(isSimulating) cancelSimulation();
  }, [setAppState, isSimulating, cancelSimulation]);

  const deleteConversation = useCallback((id: string) => {
    setAppState(prev => {
      const newConversations = prev.conversations.filter(c => c.id !== id);
      const newFinancialData = { ...prev.financialData };
      delete newFinancialData[id];

      let newActiveId = prev.activeConversationId;
      if (prev.activeConversationId === id) {
        // Try to find an active one first
        const activeOne = newConversations.find(c => c.status === 'active');
        newActiveId = activeOne ? activeOne.id : (newConversations.length > 0 ? newConversations[0].id : null);
      }
      
      if (newConversations.length === 0) {
           const newId = crypto.randomUUID();
           const newConv: Conversation = { id: newId, name: 'Budget 1', createdAt: new Date().toISOString(), status: 'active' };
           newConversations.push(newConv);
           newFinancialData[newId] = initialFinancialState;
           newActiveId = newId;
      }

      return {
        conversations: newConversations,
        activeConversationId: newActiveId,
        financialData: newFinancialData,
      };
    });
  }, [setAppState]);

  const renameConversation = useCallback((id: string, newName: string) => {
    setAppState(prev => ({
      ...prev,
      conversations: prev.conversations.map(c => c.id === id ? { ...c, name: newName } : c),
    }));
  }, [setAppState]);
  
  const autoRenameConversation = useCallback(async (id: string): Promise<string | null> => {
      const targetData = appState.financialData[id];
      if (!targetData || targetData.transactions.length === 0) {
          return null;
      }
      
      const apiKey = process.env.API_KEY;
      if (!apiKey) return null;

      try {
          const ai = new GoogleGenAI({ apiKey });
          const txSummary = targetData.transactions.slice(0, 20).map(t => `${t.amount} ${t.label} (${t.category})`).join(', ');
          
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `Based on these transactions, provide a very short, creative and descriptive name (max 4 words) for this budget. It can be like 'Summer 2024', 'House Project', 'Daily Life'. No quotes. Transactions: ${txSummary}`,
          });
          
          const newName = response.text?.trim();
          if (newName) {
              renameConversation(id, newName);
              return newName;
          }
          return null;
      } catch (e) {
          console.error("Auto rename failed", e);
          return null;
      }
  }, [appState, renameConversation]);

  const setUserName = useCallback((name: string) => {
    updateCurrentFinancialState(prev => ({ ...prev, userName: name }));
  }, [updateCurrentFinancialState]);

  const setUserAvatar = useCallback((emoji: string) => {
    updateCurrentFinancialState(prev => ({ ...prev, userAvatar: emoji }));
  }, [updateCurrentFinancialState]);

  const setAiPersona = useCallback((persona: AiPersona) => {
    updateCurrentFinancialState(prev => ({ ...prev, aiPersona: persona }));
  }, [updateCurrentFinancialState]);

  const togglePrivacyMode = useCallback(() => {
    updateCurrentFinancialState(prev => ({ ...prev, isPrivacyMode: !prev.isPrivacyMode }));
  }, [updateCurrentFinancialState]);
  
  const exportData = useCallback(() => {
    if (!activeConversationId) return;
    const data = JSON.stringify(currentFinancialState, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-finance-data-${activeConversationId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeConversationId, currentFinancialState]);

  const exportCsv = useCallback(() => {
    if (!activeConversationId || transactions.length === 0) return;
    
    // Define headers
    const headers = ['Date', 'Label', 'Amount', 'Type', 'Category', 'Budget', 'Goal'];
    
    // Create rows
    const rows = transactions.map(tx => {
        const budgetName = tx.budgetId ? budgets.find(b => b.id === tx.budgetId)?.name || '' : '';
        const goalName = tx.goalId ? goals.find(g => g.id === tx.goalId)?.name || '' : '';
        const date = new Date(tx.date).toLocaleDateString() + ' ' + new Date(tx.date).toLocaleTimeString();
        
        return [
            `"${date}"`,
            `"${tx.label.replace(/"/g, '""')}"`, // Escape quotes
            tx.amount,
            `"${tx.type}"`,
            `"${tx.category}"`,
            `"${budgetName.replace(/"/g, '""')}"`,
            `"${goalName.replace(/"/g, '""')}"`
        ].join(',');
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${activeConversationId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeConversationId, transactions, budgets, goals]);

  const importData = useCallback((jsonString: string): boolean => {
      try {
          const parsedData = JSON.parse(jsonString) as FinancialState;
          
          // Basic validation to check if critical fields exist
          if (!Array.isArray(parsedData.transactions) || !Array.isArray(parsedData.budgets) || !Array.isArray(parsedData.goals)) {
              return false;
          }
          
          updateCurrentFinancialState(() => ({
              ...initialFinancialState, // Reset to initial to ensure structure
              ...parsedData,
              // Ensure critical IDs are set properly if they are missing in export (backwards compatibility)
              budgetCreationState: parsedData.budgetCreationState || initialFinancialState.budgetCreationState,
              activeWidget: ActiveWidget.NONE,
              aliases: parsedData.aliases || {},
              categories: parsedData.categories || DEFAULT_CATEGORIES,
              userAvatar: parsedData.userAvatar || '👤',
              aiPersona: parsedData.aiPersona || 'benevolent',
              isPrivacyMode: parsedData.isPrivacyMode || false,
              monthlyReports: parsedData.monthlyReports || [],
              debts: parsedData.debts ? parsedData.debts.map(d => ({ ...d, installments: d.installments || [] })) : [],
              educationState: parsedData.educationState || { readResourceIds: [], activePathId: null },
              userProfile: parsedData.userProfile || INITIAL_PROFILE
          }));
          return true;
      } catch (e) {
          console.error("Import failed", e);
          return false;
      }
  }, [updateCurrentFinancialState]);
  
  const resetCurrentConversation = useCallback(() => {
    updateCurrentFinancialState(prev => ({ ...initialFinancialState, userName: prev.userName }));
  }, [updateCurrentFinancialState]);


  useEffect(() => {
    const currentMonth = getCurrentMonthKey();
    if (monthlyPlan && monthlyPlan.month !== currentMonth) {
        updateCurrentFinancialState(prev => ({
            ...prev,
            monthlyPlan: { ...initialFinancialState.monthlyPlan!, month: currentMonth }
        }));
    }
  }, [monthlyPlan, updateCurrentFinancialState]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>) => {
    const finalCategory = tx.category || 'general';
    const newTransaction: Transaction = {
      ...tx, id: crypto.randomUUID(), date: tx.date || new Date().toISOString(), category: finalCategory,
    };
    
    updateCurrentFinancialState(prev => {
        const newTransactions = [newTransaction, ...prev.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        let newBudgets = prev.budgets;
        let newGoals = prev.goals;

        if (tx.type === 'expense') {
            const monthlyBudget = newBudgets.find(b => b.type === 'monthly' && b.category === finalCategory);
            if (monthlyBudget) newBudgets = newBudgets.map(b => b.id === monthlyBudget.id ? { ...b, currentSpent: b.currentSpent + tx.amount } : b);
        }
        if (tx.type === 'expense' && tx.budgetId) {
            newBudgets = newBudgets.map(b => b.id === tx.budgetId ? { ...b, currentSpent: b.currentSpent + tx.amount } : b);
        }
        
        // Auto-update goals only if it's explicitly linked as a contribution (expense)
        // Or if it's income linked to a goal (e.g. windfall saved)
        if (tx.goalId) {
             newGoals = newGoals.map(g => g.id === tx.goalId ? { ...g, currentSaved: g.currentSaved + tx.amount } : g);
        }

        return { ...prev, transactions: newTransactions, budgets: newBudgets, goals: newGoals };
    });
  }, [updateCurrentFinancialState]);
  
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let needsUpdate = false;
    let transactionsToAdd: Omit<Transaction, 'id'>[] = [];
    const updatedRecurring = recurringTransactions.map(rec => {
        let nextDueDate = new Date(rec.nextDueDate);
        let currentRec = {...rec};
        while (nextDueDate <= today) {
            needsUpdate = true;
            transactionsToAdd.push({
                amount: currentRec.amount, label: currentRec.label, type: currentRec.type,
                category: currentRec.category, budgetId: currentRec.budgetId, date: nextDueDate.toISOString(),
            });
            switch (currentRec.frequency) {
                case 'weekly': nextDueDate.setDate(nextDueDate.getDate() + 7); break;
                case 'monthly': nextDueDate.setMonth(nextDueDate.getMonth() + 1); break;
                case 'yearly': nextDueDate.setFullYear(nextDueDate.getFullYear() + 1); break;
            }
            currentRec.nextDueDate = nextDueDate.toISOString();
        }
        return currentRec;
    });

    if (needsUpdate) {
        updateCurrentFinancialState(prev => {
            let stateWithNewTxs = { ...prev };
            transactionsToAdd.forEach(tx => {
                const newTransaction = { ...tx, id: crypto.randomUUID() };
                stateWithNewTxs.transactions = [newTransaction, ...stateWithNewTxs.transactions];
            });
            return { ...stateWithNewTxs, recurringTransactions: updatedRecurring };
        });
    }
  }, [recurringTransactions, updateCurrentFinancialState]);

  useEffect(() => {
    const today = new Date();
    const updatedBudgets = budgets.map(budget => {
      if (budget.type === 'monthly' && budget.resetDate && new Date(budget.resetDate) < today) {
        const newResetDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        return { ...budget, currentSpent: 0, resetDate: newResetDate.toISOString() };
      }
      return budget;
    });
    if (JSON.stringify(updatedBudgets) !== JSON.stringify(budgets)) {
        updateCurrentFinancialState(prev => ({...prev, budgets: updatedBudgets}));
    }
  }, [budgets, updateCurrentFinancialState]);

  useEffect(() => {
    const calculatedBalance = transactions.reduce((acc, tx) => tx.type === 'income' ? acc + tx.amount : acc - tx.amount, 0);
    setBalance(calculatedBalance);
  }, [transactions]);

    const setActiveWidget = useCallback((widget: ActiveWidget) => {
        updateCurrentFinancialState(prev => ({...prev, activeWidget: widget, inspectedBudgetId: null, inspectedGoalId: null, inspectedReportId: null }));
    }, [updateCurrentFinancialState]);

    const setInspectedBudgetId = useCallback((budgetId: string | null) => {
        updateCurrentFinancialState(prev => ({ ...prev, inspectedBudgetId: budgetId, inspectedGoalId: null, inspectedReportId: null }));
    }, [updateCurrentFinancialState]);

    const setInspectedGoalId = useCallback((goalId: string | null) => {
        updateCurrentFinancialState(prev => ({ ...prev, inspectedGoalId: goalId, inspectedBudgetId: null, inspectedReportId: null }));
    }, [updateCurrentFinancialState]);
    
    const setInspectedReportId = useCallback((reportId: string | null) => {
        updateCurrentFinancialState(prev => ({ ...prev, inspectedReportId: reportId, inspectedBudgetId: null, inspectedGoalId: null }));
    }, [updateCurrentFinancialState]);

  const updateTransaction = useCallback((id: string, updates: Partial<Omit<Transaction, 'id'>>) => {
    updateCurrentFinancialState(prev => {
      const originalTx = prev.transactions.find(t => t.id === id);
      if (!originalTx) return prev;

      let newBudgets = [...prev.budgets];
      let newGoals = [...prev.goals];

      // Revert old transaction's impact
      if (originalTx.type === 'expense') {
        if (originalTx.budgetId) newBudgets = newBudgets.map(b => b.id === originalTx.budgetId ? { ...b, currentSpent: b.currentSpent - originalTx.amount } : b);
        const oldMonthlyBudget = newBudgets.find(b => b.type === 'monthly' && b.category === originalTx.category);
        if (oldMonthlyBudget) newBudgets = newBudgets.map(b => b.id === oldMonthlyBudget.id ? { ...b, currentSpent: Math.max(0, b.currentSpent - originalTx.amount) } : b);
      }
      if (originalTx.goalId) newGoals = newGoals.map(g => g.id === originalTx.goalId ? { ...g, currentSaved: g.currentSaved - originalTx.amount } : g);
      
      const updatedTx = { ...originalTx, ...updates };
      
      // Apply new transaction's impact
      if (updatedTx.type === 'expense') {
        if (updatedTx.budgetId) newBudgets = newBudgets.map(b => b.id === updatedTx.budgetId ? { ...b, currentSpent: b.currentSpent + updatedTx.amount } : b);
        const newMonthlyBudget = newBudgets.find(b => b.type === 'monthly' && b.category === updatedTx.category);
        if (newMonthlyBudget) newBudgets = newBudgets.map(b => b.id === newMonthlyBudget.id ? { ...b, currentSpent: b.currentSpent + updatedTx.amount } : b);
      }
      if (updatedTx.goalId) newGoals = newGoals.map(g => g.id === updatedTx.goalId ? { ...g, currentSaved: g.currentSaved + updatedTx.amount } : g);

      const newTransactions = prev.transactions
        .map(t => t.id === id ? updatedTx : t)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return { ...prev, transactions: newTransactions, budgets: newBudgets, goals: newGoals };
    });
  }, [updateCurrentFinancialState]);

  const deleteTransaction = useCallback((transactionId: string) => {
    updateCurrentFinancialState(prev => {
        const txToDelete = prev.transactions.find(tx => tx.id === transactionId);
        if (!txToDelete) return prev;

        let newBudgets = prev.budgets;
        if (txToDelete.type === 'expense' && txToDelete.budgetId) {
            newBudgets = newBudgets.map(b => b.id === txToDelete.budgetId ? { ...b, currentSpent: b.currentSpent - txToDelete.amount } : b);
        }
        const monthlyBudget = newBudgets.find(b => b.type === 'monthly' && b.category === txToDelete.category);
        if (txToDelete.type === 'expense' && monthlyBudget) {
            newBudgets = newBudgets.map(b => b.id === monthlyBudget.id ? { ...b, currentSpent: Math.max(0, b.currentSpent - txToDelete.amount) } : b);
        }

        let newGoals = prev.goals;
        if (txToDelete.goalId) {
            newGoals = newGoals.map(g => g.id === txToDelete.goalId ? { ...g, currentSaved: g.currentSaved - txToDelete.amount } : g);
        }

        const newTransactions = prev.transactions.filter(tx => tx.id !== transactionId);
        return {...prev, transactions: newTransactions, budgets: newBudgets, goals: newGoals };
    });
  }, [updateCurrentFinancialState]);
  
  const updateTransactionCategory = useCallback((transactionId: string, newCategory: string) => {
    updateTransaction(transactionId, { category: newCategory });
  }, [updateTransaction]);

  const createShoppingList = useCallback((name: string) => {
    updateCurrentFinancialState(prev => {
      const newList: ShoppingList = {
        id: crypto.randomUUID(),
        name,
        items: [],
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        shoppingLists: [...prev.shoppingLists, newList],
        activeShoppingListId: newList.id,
        activeWidget: ActiveWidget.SHOPPING_LIST,
      };
    });
  }, [updateCurrentFinancialState]);

  const deleteShoppingList = useCallback((listId: string) => {
    updateCurrentFinancialState(prev => {
      const newLists = prev.shoppingLists.filter(l => l.id !== listId);
      let newActiveId = prev.activeShoppingListId;
      if (newActiveId === listId) {
        newActiveId = newLists.length > 0 ? newLists[0].id : null;
      }
      return { ...prev, shoppingLists: newLists, activeShoppingListId: newActiveId };
    });
  }, [updateCurrentFinancialState]);

  const renameShoppingList = useCallback((listId: string, newName: string) => {
    updateCurrentFinancialState(prev => ({
      ...prev,
      shoppingLists: prev.shoppingLists.map(l => l.id === listId ? { ...l, name: newName } : l)
    }));
  }, [updateCurrentFinancialState]);
  
  const setActiveShoppingListId = useCallback((listId: string | null) => {
    updateCurrentFinancialState(prev => ({...prev, activeShoppingListId: listId }));
  }, [updateCurrentFinancialState]);

  const addShoppingItem = useCallback((item: Omit<ShoppingItem, 'id' | 'createdAt' | 'status' | 'actualAmount'>) => {
    const newItem: ShoppingItem = { 
        ...item, 
        id: crypto.randomUUID(), 
        createdAt: new Date().toISOString(), 
        status: 'pending' 
    };
    updateCurrentFinancialState(prev => {
        let targetListId = prev.activeShoppingListId;
        if (!targetListId && prev.shoppingLists.length > 0) {
            targetListId = prev.shoppingLists[prev.shoppingLists.length - 1].id;
        }

        if (targetListId) {
            const newLists = prev.shoppingLists.map(list => {
                if (list.id === targetListId) {
                    return { ...list, items: [...list.items, newItem] };
                }
                return list;
            });
            return { ...prev, shoppingLists: newLists, activeWidget: ActiveWidget.SHOPPING_LIST, activeShoppingListId: targetListId };
        } else {
            // No lists exist, create a new one
            const newList: ShoppingList = {
                id: crypto.randomUUID(),
                name: 'Shopping List',
                items: [newItem],
                createdAt: new Date().toISOString()
            };
            return { ...prev, shoppingLists: [newList], activeShoppingListId: newList.id, activeWidget: ActiveWidget.SHOPPING_LIST };
        }
    });
  }, [updateCurrentFinancialState]);

  const deleteShoppingItem = useCallback((listId: string, itemId: string) => {
    updateCurrentFinancialState(prev => ({
      ...prev,
      shoppingLists: prev.shoppingLists.map(list => {
        if (list.id === listId) {
          return { ...list, items: list.items.filter(i => i.id !== itemId) };
        }
        return list;
      })
    }));
  }, [updateCurrentFinancialState]);

  const addBudget = useCallback((budget: Omit<Budget, 'id' | 'currentSpent'>) => {
    const newBudget = { ...budget, id: crypto.randomUUID(), currentSpent: 0, type: 'event' as const };
    updateCurrentFinancialState(prev => ({ ...prev, budgets: [...prev.budgets, newBudget], activeWidget: ActiveWidget.BUDGETS }));
  }, [updateCurrentFinancialState]);

  const updateBudget = useCallback((id: string, updates: Partial<Omit<Budget, 'id' | 'currentSpent'>>) => {
    updateCurrentFinancialState(prev => ({
        ...prev,
        budgets: prev.budgets.map(b => b.id === id ? { ...b, ...updates } : b)
    }));
  }, [updateCurrentFinancialState]);

  const deleteBudget = useCallback((id: string) => {
    updateCurrentFinancialState(prev => {
        const newTransactions = prev.transactions.map(tx => tx.budgetId === id ? { ...tx, budgetId: undefined } : tx);
        const newBudgets = prev.budgets.filter(b => b.id !== id);
        return { ...prev, transactions: newTransactions, budgets: newBudgets, inspectedBudgetId: null, activeWidget: ActiveWidget.BUDGETS };
    });
  }, [updateCurrentFinancialState]);
  
  const addMonthlyBudget = useCallback((budget: Omit<Budget, 'id' | 'currentSpent' | 'name' | 'type'>) => {
    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const newBudget: Budget = { ...budget, id: crypto.randomUUID(), name: `${budget.category} Budget`, currentSpent: 0, type: 'monthly', resetDate: resetDate.toISOString() };
    updateCurrentFinancialState(prev => ({ ...prev, budgets: [...prev.budgets, newBudget], activeWidget: ActiveWidget.BUDGETS }));
  }, [updateCurrentFinancialState]);

  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'currentSaved' | 'createdAt'>) => {
    const newGoal = { ...goal, id: crypto.randomUUID(), currentSaved: 0, createdAt: new Date().toISOString() };
    updateCurrentFinancialState(prev => ({...prev, goals: [...prev.goals, newGoal], activeWidget: ActiveWidget.GOALS }));
  }, [updateCurrentFinancialState]);

  const updateGoal = useCallback((id: string, updates: Partial<Omit<Goal, 'id' | 'currentSaved'>>) => {
      updateCurrentFinancialState(prev => ({
          ...prev,
          goals: prev.goals.map(g => g.id === id ? { ...g, ...updates } : g)
      }));
  }, [updateCurrentFinancialState]);

  const deleteGoal = useCallback((id: string) => {
      updateCurrentFinancialState(prev => {
          const newTransactions = prev.transactions.map(tx => tx.goalId === id ? { ...tx, goalId: undefined } : tx);
          const newGoals = prev.goals.filter(g => g.id !== id);
          return { ...prev, transactions: newTransactions, goals: newGoals, inspectedGoalId: null, activeWidget: ActiveWidget.GOALS };
      });
  }, [updateCurrentFinancialState]);

  const addContributionToGoal = useCallback((goalId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    updateCurrentFinancialState(prev => ({...prev, goals: prev.goals.map(g => g.id === goalId ? { ...g, currentSaved: g.currentSaved + amount } : g), activeWidget: ActiveWidget.GOALS }));
    addTransaction({ amount, label: `Contribution to ${goal.name}`, type: 'expense', category: 'general', goalId, date: new Date().toISOString() });
  }, [goals, addTransaction, updateCurrentFinancialState]);

  const withdrawFromGoal = useCallback((goalId: string, amount: number) => {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;
      
      // 1. Update Goal: Decrease saved amount
      updateCurrentFinancialState(prev => ({
          ...prev,
          goals: prev.goals.map(g => g.id === goalId ? { ...g, currentSaved: Math.max(0, g.currentSaved - amount) } : g)
      }));

      // 2. Add Transaction: Income to wallet
      // We do NOT pass goalId here to avoid the automatic logic in addTransaction that might increment the goal again
      // We are handling the goal update manually above.
      addTransaction({
          amount,
          label: `Withdrawal from ${goal.name}`,
          type: 'income',
          category: 'income',
          date: new Date().toISOString()
      });
  }, [goals, addTransaction, updateCurrentFinancialState]);

  const addRecurringTransaction = useCallback((tx: Omit<RecurringTransaction, 'id'>) => {
    const newRecurring = { ...tx, id: crypto.randomUUID() };
    updateCurrentFinancialState(prev => ({...prev, recurringTransactions: [...prev.recurringTransactions, newRecurring], activeWidget: ActiveWidget.RECURRING }));
  }, [updateCurrentFinancialState]);
  
  const updateRecurringTransaction = useCallback((id: string, updates: Partial<Omit<RecurringTransaction, 'id'>>) => {
    updateCurrentFinancialState(prev => ({
        ...prev,
        recurringTransactions: prev.recurringTransactions.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  }, [updateCurrentFinancialState]);

  const deleteRecurringTransaction = useCallback((id: string) => {
    updateCurrentFinancialState(prev => ({...prev, recurringTransactions: prev.recurringTransactions.filter(tx => tx.id !== id)}));
  }, [updateCurrentFinancialState]);

  const purchaseShoppingItem = useCallback((listId: string, itemId: string, actualAmount: number) => {
      const list = shoppingLists.find(l => l.id === listId);
      const item = list?.items.find(i => i.id === itemId);
      if (item) {
        addTransaction({ amount: actualAmount, label: item.text, type: 'expense', category: 'shopping', date: new Date().toISOString() });
        updateCurrentFinancialState(prev => ({
          ...prev,
          shoppingLists: prev.shoppingLists.map(l => {
              if (l.id === listId) {
                  return { ...l, items: l.items.map(i => i.id === itemId ? { ...i, status: 'purchased', actualAmount } : i) };
              }
              return l;
          })
        }));
      }
  }, [shoppingLists, addTransaction, updateCurrentFinancialState]);
  
  const setPlannedIncome = useCallback((amount: number) => {
    updateCurrentFinancialState(prev => ({ ...prev, monthlyPlan: prev.monthlyPlan ? { ...prev.monthlyPlan, plannedIncome: amount } : prev.monthlyPlan }));
  }, [updateCurrentFinancialState]);

  const addPlannedContribution = useCallback((goalId: string, amount: number) => {
    updateCurrentFinancialState(prev => {
        if (!prev.monthlyPlan) return prev;
        const existing = prev.monthlyPlan.plannedContributions.find(c => c.goalId === goalId);
        const newContributions = existing 
            ? prev.monthlyPlan.plannedContributions.map(c => c.goalId === goalId ? { ...c, amount: c.amount + amount } : c)
            : [...prev.monthlyPlan.plannedContributions, { goalId, amount }];
        return {...prev, monthlyPlan: {...prev.monthlyPlan, plannedContributions: newContributions}, activeWidget: ActiveWidget.PLANNING};
    });
  }, [updateCurrentFinancialState]);

    const setBudgetingRule = useCallback((rule: BudgetingRule) => {
        updateCurrentFinancialState(prev => ({...prev, budgetingRule: rule}));
    }, [updateCurrentFinancialState]);
  
  const addSubCategory = useCallback((subCategory: Omit<SubCategory, 'id'>) => {
    const newSubCategory = { ...subCategory, id: crypto.randomUUID() };
    updateCurrentFinancialState(prev => ({...prev, subCategories: [...prev.subCategories, newSubCategory], activeWidget: ActiveWidget.TABLE_BUDGET}));
  }, [updateCurrentFinancialState]);

  const deleteSubCategory = useCallback((id: string) => {
    updateCurrentFinancialState(prev => ({...prev, subCategories: prev.subCategories.filter(sc => sc.id !== id)}));
  }, [updateCurrentFinancialState]);

  const updateSubCategory = useCallback((id: string, newAmount: number) => {
    updateCurrentFinancialState(prev => ({...prev, subCategories: prev.subCategories.map(sc => sc.id === id ? { ...sc, plannedAmount: newAmount } : sc)}));
  }, [updateCurrentFinancialState]);

  const startBudgetCreation = useCallback(() => {
    updateCurrentFinancialState(prev => ({...prev, activeWidget: ActiveWidget.NONE, budgetCreationState: { step: 'get_income', income: null, isGenerating: false }}));
  }, [updateCurrentFinancialState]);
  
  const cancelBudgetCreation = useCallback(() => {
    updateCurrentFinancialState(prev => ({...prev, budgetCreationState: { step: 'idle', income: null, isGenerating: false }}));
  }, [updateCurrentFinancialState]);

  const setBudgetIncome = useCallback((amount: number) => {
    updateCurrentFinancialState(prev => ({...prev, budgetCreationState: { ...prev.budgetCreationState, income: amount, step: 'get_method' }}));
  }, [updateCurrentFinancialState]);

  const generateBudgetFromMethod = useCallback(async (method: BudgetMethod, t: (key: string) => string) => {
    const { income } = budgetCreationState;
    if (!income) return;

    const createBudgetsFromSubcategories = (
      subcategories: Omit<SubCategory, 'id'>[],
      allTransactions: Transaction[]
    ): Budget[] => {
      const newMonthlyBudgetsMap = subcategories.reduce((acc, sub) => {
        const categoryId = sub.categoryId || 'general';
        acc[categoryId] = (acc[categoryId] || 0) + sub.plannedAmount;
        return acc;
      }, {} as Record<string, number>);
    
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    
      const currentMonthTransactions = allTransactions.filter(tx => new Date(tx.date) >= startOfMonth);
    
      return Object.entries(newMonthlyBudgetsMap).map(([category, limit]) => {
        const currentSpent = currentMonthTransactions
          .filter(tx => tx.type === 'expense' && tx.category === category)
          .reduce((sum, tx) => sum + tx.amount, 0);
    
        return {
          id: crypto.randomUUID(),
          name: `${category} Budget`, // TODO: better naming when category is custom
          limit,
          currentSpent,
          type: 'monthly',
          category,
          resetDate,
        };
      });
    };

    if (method === 'ai') {
        updateCurrentFinancialState(prev => ({...prev, budgetCreationState: {...prev.budgetCreationState, isGenerating: true }}));
        try {
            const recentTransactions = transactions.filter(tx => {
                const txDate = new Date(tx.date);
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                return tx.type === 'expense' && txDate > threeMonthsAgo;
            });

            if (recentTransactions.length < 10) {
                alert("Not enough transaction data for an AI suggestion. Please add more transactions or choose a manual method.");
                updateCurrentFinancialState(prev => ({...prev, budgetCreationState: {...prev.budgetCreationState, isGenerating: false }}));
                return;
            }
            const suggestedSubCategories = await suggestBudget(recentTransactions, income);
            const newMonthlyBudgets = createBudgetsFromSubcategories(suggestedSubCategories, transactions);
            
            updateCurrentFinancialState(prev => {
                const eventBudgets = prev.budgets.filter(b => b.type === 'event');
                return {
                    ...prev,
                    monthlyPlan: prev.monthlyPlan ? { ...prev.monthlyPlan, plannedIncome: income } : prev.monthlyPlan,
                    subCategories: suggestedSubCategories.map(sc => ({...sc, id: crypto.randomUUID()})),
                    budgetingRule: null,
                    budgets: [...eventBudgets, ...newMonthlyBudgets],
                    budgetCreationState: { step: 'idle', income: null, isGenerating: false },
                    activeWidget: ActiveWidget.BUDGETS,
                };
            });
        } catch (error) {
            console.error(error);
            alert("Failed to generate AI budget. Please try again or select another method.");
            updateCurrentFinancialState(prev => ({...prev, budgetCreationState: {...prev.budgetCreationState, isGenerating: false }}));
        }
    } else {
        updateCurrentFinancialState(prev => {
            const plan = prev.monthlyPlan ? { ...prev.monthlyPlan, plannedIncome: income } : prev.monthlyPlan;
            
            if (method === 'manual') {
                return {
                    ...prev,
                    monthlyPlan: plan,
                    subCategories: [], // Start with an empty table for manual
                    budgetingRule: null,
                    budgetCreationState: { step: 'idle', income: null, isGenerating: false },
                    activeWidget: ActiveWidget.TABLE_BUDGET,
                };
            }

            const ruleMap: Record<string, BudgetingRule> = {
                '50/30/20': { needs: 50, wants: 30, savings: 20 },
                '60/30/10': { needs: 60, wants: 30, savings: 10 },
                '80/20': { needs: 80, wants: 0, savings: 20 },
            }
            const rule = ruleMap[method] || ruleMap['50/30/20'];
            
            const generatedSubCategories = getDefaultSubCategories(income, rule, t);
            const newMonthlyBudgets = createBudgetsFromSubcategories(generatedSubCategories, prev.transactions);
            
            return {
                ...prev,
                monthlyPlan: plan,
                subCategories: generatedSubCategories.map(sc => ({ ...sc, id: crypto.randomUUID() })),
                budgetingRule: rule,
                budgets: [...prev.budgets.filter(b => b.type === 'event'), ...newMonthlyBudgets],
                budgetCreationState: { step: 'idle', income: null, isGenerating: false },
                activeWidget: ActiveWidget.TABLE_BUDGET, // Switch directly to table for editing
            };
        });
    }
  }, [budgetCreationState, updateCurrentFinancialState, transactions]);

  const applyRuleToSubCategories = useCallback((rule: BudgetingRule, t: (key: string) => string) => {
      // Use current plan income, if unavailable, check transactions? No, rely on plan.
      const income = monthlyPlan?.plannedIncome || 0;
      if (income === 0) return; // Or handle warning
      
      const newSubCats = getDefaultSubCategories(income, rule, t);
      
      updateCurrentFinancialState(prev => ({
          ...prev,
          subCategories: newSubCats.map(sc => ({ ...sc, id: crypto.randomUUID() })),
          budgetingRule: rule
      }));
  }, [monthlyPlan, updateCurrentFinancialState]);

  const scaleSubCategoriesToRule = useCallback((rule: BudgetingRule) => {
      const income = monthlyPlan?.plannedIncome || 0;
      if (income === 0) return;

      updateCurrentFinancialState(prev => {
          const currentSubs = [...prev.subCategories];
          const bucketTotals: Record<Bucket, number> = { needs: 0, wants: 0, savings: 0 };
          const bucketItems: Record<Bucket, number[]> = { needs: [], wants: [], savings: [] }; // indices

          // 1. Group and Sum
          currentSubs.forEach((sub, index) => {
              const category = prev.categories.find(c => c.id === sub.categoryId);
              // Fallback logic if category mapping fails, though it shouldn't
              const bucket = category ? category.bucket : 'wants'; 
              bucketTotals[bucket] += sub.plannedAmount;
              bucketItems[bucket].push(index);
          });

          // 2. Calculate Scaling Factors
          const targets = {
              needs: income * (rule.needs / 100),
              wants: income * (rule.wants / 100),
              savings: income * (rule.savings / 100),
          };

          const newSubs = [...currentSubs];

          (['needs', 'wants', 'savings'] as Bucket[]).forEach(bucket => {
              const currentTotal = bucketTotals[bucket];
              const targetTotal = targets[bucket];
              
              if (currentTotal > 0 && targetTotal > 0) {
                  const ratio = targetTotal / currentTotal;
                  bucketItems[bucket].forEach(index => {
                      newSubs[index] = {
                          ...newSubs[index],
                          plannedAmount: Math.round(newSubs[index].plannedAmount * ratio)
                      };
                  });
              }
          });

          return { ...prev, subCategories: newSubs, budgetingRule: rule };
      });
  }, [monthlyPlan, updateCurrentFinancialState]);

  const applyPlanToBudgets = useCallback(() => {
      updateCurrentFinancialState(prev => {
          const { subCategories, transactions, categories } = prev;
          
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const currentMonthTransactions = transactions.filter(tx => new Date(tx.date) >= startOfMonth);

          // Aggregate planned amounts by category
          const budgetMap: Record<string, number> = {};
          subCategories.forEach(sub => {
              const cat = sub.categoryId || 'general';
              budgetMap[cat] = (budgetMap[cat] || 0) + sub.plannedAmount;
          });
          
          const createdBudgets: Budget[] = Object.entries(budgetMap).map(([catId, limit]) => {
               const currentSpent = currentMonthTransactions
                  .filter(tx => tx.type === 'expense' && tx.category === catId)
                  .reduce((sum, tx) => sum + tx.amount, 0);
               
               // Find category name translation key or use ID
               const catObj = categories.find(c => c.id === catId);
               const name = catObj ? catObj.name : catId; // Note: name here is translation key usually
               
               return {
                   id: crypto.randomUUID(),
                   name: name, // This will be the category name (e.g. "Food & Dining")
                   limit: limit,
                   currentSpent: currentSpent,
                   type: 'monthly',
                   category: catId,
                   resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
               };
          });

          // Filter out OLD monthly budgets, keep events
          const eventBudgets = prev.budgets.filter(b => b.type === 'event');
          
          return {
              ...prev,
              budgets: [...eventBudgets, ...createdBudgets],
              activeWidget: ActiveWidget.BUDGETS // Switch to budgets view to show result
          };
      });
  }, [updateCurrentFinancialState]);

  const addDebt = useCallback((debt: Omit<Debt, 'id' | 'paidAmount' | 'status' | 'createdAt' | 'installments'>) => {
    let installments: Installment[] = [];
    if (debt.dueDate) {
        installments = generateInstallments(debt.totalAmount, debt.dueDate);
    }

    const newDebt: Debt = {
        ...debt,
        id: crypto.randomUUID(),
        paidAmount: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        installments
    };
    updateCurrentFinancialState(prev => ({ ...prev, debts: [...prev.debts, newDebt], activeWidget: ActiveWidget.DEBT }));
  }, [updateCurrentFinancialState]);

  const recordDebtPayment = useCallback((person: string, amount: number, type: 'payment' | 'repayment') => {
      updateCurrentFinancialState(prev => {
          const debtType = type === 'payment' ? 'debt' : 'loan';
          const targetDebt = prev.debts.find(d => d.person.toLowerCase() === person.toLowerCase() && d.type === debtType && d.status === 'active');
          
          if (targetDebt) {
              // Add transaction log
              const txLabel = type === 'payment' ? `Debt payment to ${person}` : `Repayment from ${person}`;
              const txType = type === 'payment' ? 'expense' : 'income';
              
              const newDebts = prev.debts.map(d => {
                  if (d.id === targetDebt.id) {
                      const newPaid = d.paidAmount + amount;
                      return { ...d, paidAmount: newPaid, status: newPaid >= d.totalAmount ? 'paid' : 'active' };
                  }
                  return d;
              });

              // Also add to transactions list
              // We need to call addTransaction logic here manually to avoid hook dependency loop or duplication
              const newTx: Transaction = {
                  id: crypto.randomUUID(),
                  date: new Date().toISOString(),
                  amount,
                  label: txLabel,
                  type: txType,
                  category: 'general'
              };
               // Recalculate balances
               const newTransactions = [newTx, ...prev.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
               
               return { ...prev, debts: newDebts, transactions: newTransactions };
          }
          return prev;
      });
  }, [updateCurrentFinancialState]);

  const markDebtAsPaid = useCallback((debtId: string) => {
      updateCurrentFinancialState(prev => ({
          ...prev,
          debts: prev.debts.map(d => d.id === debtId ? { ...d, status: 'paid', paidAmount: d.totalAmount, installments: d.installments.map(i => ({...i, isPaid: true})) } : d)
      }));
  }, [updateCurrentFinancialState]);

  const deleteDebt = useCallback((debtId: string) => {
      updateCurrentFinancialState(prev => ({
          ...prev,
          debts: prev.debts.filter(d => d.id !== debtId)
      }));
  }, [updateCurrentFinancialState]);
  
  const updateDebt = useCallback((id: string, updates: Partial<Omit<Debt, 'id' | 'createdAt'>>) => {
      updateCurrentFinancialState(prev => {
          return {
              ...prev,
              debts: prev.debts.map(d => {
                  if (d.id !== id) return d;
                  
                  // If due date changed, regenerate installments if they were auto-generated or empty
                  let newInstallments = d.installments;
                  if (updates.dueDate && updates.dueDate !== d.dueDate) {
                      // Simple logic: if date changes, regenerate plan based on remaining amount?
                      // Or simple total? Let's regenerate based on total for now, assuming user will tweak.
                      // Ideally we ask user, but for "Automatic Schedule" feature, we regenerate.
                      newInstallments = generateInstallments(d.totalAmount, updates.dueDate);
                  }

                  return { ...d, ...updates, installments: newInstallments };
              })
          };
      });
  }, [updateCurrentFinancialState]);
  
  const toggleDebtInstallment = useCallback((debtId: string, installmentId: string) => {
      updateCurrentFinancialState(prev => {
          const debt = prev.debts.find(d => d.id === debtId);
          if (!debt) return prev;

          const updatedInstallments = debt.installments.map(i => {
              if (i.id === installmentId) return { ...i, isPaid: !i.isPaid };
              return i;
          });

          // Recalculate total paid based on installments
          const newPaidAmount = updatedInstallments.filter(i => i.isPaid).reduce((sum, i) => sum + i.amount, 0);
          const newStatus = newPaidAmount >= debt.totalAmount ? 'paid' : 'active';

          return {
              ...prev,
              debts: prev.debts.map(d => d.id === debtId ? { ...d, installments: updatedInstallments, paidAmount: newPaidAmount, status: newStatus } : d)
          };
      });
  }, [updateCurrentFinancialState]);

  const updateDebtInstallment = useCallback((debtId: string, installmentId: string, newAmount: number) => {
      updateCurrentFinancialState(prev => {
          const debt = prev.debts.find(d => d.id === debtId);
          if (!debt) return prev;

          // 1. Update the specific installment
          const updatedInstallments = debt.installments.map(i => 
              i.id === installmentId ? { ...i, amount: newAmount } : i
          );

          // 2. Smart Adjustment: Distribute difference to REMAINING (future) installments
          // Find index of changed installment
          const changedIndex = debt.installments.findIndex(i => i.id === installmentId);
          const oldAmount = debt.installments[changedIndex].amount;
          const diff = oldAmount - newAmount; // Positive if we reduced payment (so we need to add to others), Negative if we increased.

          if (diff !== 0) {
              const remainingInstallmentsCount = updatedInstallments.length - 1 - changedIndex;
              if (remainingInstallmentsCount > 0) {
                  const adjustmentPerInstallment = diff / remainingInstallmentsCount;
                  for (let i = changedIndex + 1; i < updatedInstallments.length; i++) {
                      // Avoid negative amounts if possible, though simple math allows it.
                      updatedInstallments[i].amount += adjustmentPerInstallment;
                  }
              }
          }

          return {
              ...prev,
              debts: prev.debts.map(d => d.id === debtId ? { ...d, installments: updatedInstallments } : d)
          };
      });
  }, [updateCurrentFinancialState]);
  
  const addAlias = useCallback((key: string, command: string) => {
      updateCurrentFinancialState(prev => ({ ...prev, aliases: { ...prev.aliases, [key.toLowerCase()]: command } }));
  }, [updateCurrentFinancialState]);

  const deleteAlias = useCallback((key: string) => {
      updateCurrentFinancialState(prev => {
          const newAliases = { ...prev.aliases };
          delete newAliases[key];
          return { ...prev, aliases: newAliases };
      });
  }, [updateCurrentFinancialState]);

  const addCategory = useCallback((category: Omit<Category, 'id' | 'isCustom'>) => {
      const newCategory: Category = { ...category, id: crypto.randomUUID(), isCustom: true };
      updateCurrentFinancialState(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
  }, [updateCurrentFinancialState]);

  const deleteCategory = useCallback((id: string) => {
      updateCurrentFinancialState(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
  }, [updateCurrentFinancialState]);

  // Education Actions
  const markResourceRead = useCallback((id: string) => {
      updateCurrentFinancialState(prev => {
          const currentRead = prev.educationState?.readResourceIds || [];
          if(currentRead.includes(id)) return prev;
          
          return {
              ...prev,
              educationState: {
                  ...prev.educationState,
                  readResourceIds: [...currentRead, id]
              }
          };
      });
  }, [updateCurrentFinancialState]);

  const value: FinanceContextType = {
    userName, setUserName,
    userAvatar, setUserAvatar,
    aiPersona, setAiPersona,
    userProfile, updateUserProfile, // Added
    isPrivacyMode, togglePrivacyMode,
    transactions, addTransaction, updateTransaction, deleteTransaction, updateTransactionCategory,
    shoppingLists, createShoppingList, deleteShoppingList, renameShoppingList, activeShoppingListId, setActiveShoppingListId, addShoppingItem, deleteShoppingItem, purchaseShoppingItem,
    budgets, addBudget, updateBudget, deleteBudget, addMonthlyBudget,
    goals, addGoal, updateGoal, deleteGoal, addContributionToGoal, withdrawFromGoal,
    recurringTransactions, addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction,
    balance,
    activeWidget, setActiveWidget,
    commandInput, setCommandInput,
    inspectedBudgetId, setInspectedBudgetId,
    inspectedGoalId, setInspectedGoalId,
    inspectedReportId, setInspectedReportId,
    monthlyPlan, setPlannedIncome, addPlannedContribution,
    budgetingRule, setBudgetingRule,
    subCategories, addSubCategory, deleteSubCategory, updateSubCategory,
    budgetCreationState, startBudgetCreation, cancelBudgetCreation, setBudgetIncome, generateBudgetFromMethod, applyRuleToSubCategories, scaleSubCategoriesToRule, applyPlanToBudgets,
    conversations: appState.conversations, activeConversationId, currentConversation, createConversation, switchConversation, deleteConversation, renameConversation, autoRenameConversation,
    exportData, exportCsv, importData, resetCurrentConversation,
    debts, addDebt, recordDebtPayment, markDebtAsPaid, deleteDebt, updateDebt, toggleDebtInstallment, updateDebtInstallment,
    monthlyReports,
    aliases, addAlias, deleteAlias,
    categories, addCategory, deleteCategory,
    isSimulating, startSimulation, commitSimulation, cancelSimulation,
    isLiveAssistantOpen, setLiveAssistantOpen,
    isHelpOpen, setHelpOpen,
    duplicateConversation, archiveConversation,
    educationState, markResourceRead
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
