
export interface Transaction {
  id: string;
  date: string;
  amount: number;
  label: string;
  type: 'expense' | 'income';
  category: string;
  budgetId?: string;
  goalId?: string;
  receiptImage?: string; // Base64 string of the receipt
}

export interface ShoppingItem {
  id: string;
  text: string;
  plannedAmount: number;
  actualAmount?: number;
  status: 'pending' | 'purchased';
  createdAt: string;
}

export interface ShoppingList {
    id: string;
    name: string;
    items: ShoppingItem[];
    createdAt: string;
}

export interface Budget {
  id:string;
  name: string;
  limit: number;
  currentSpent: number;
  type: 'event' | 'monthly';
  category?: string;
  resetDate?: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  currentSaved: number;
  createdAt: string;
  targetDate?: string;
}

export type Frequency = 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
    id: string;
    label: string;
    amount: number;
    category: string;
    frequency: Frequency;
    nextDueDate: string;
    budgetId?: string;
    type: 'expense' | 'income';
}

export interface Installment {
    id: string;
    date: string;
    amount: number;
    isPaid: boolean;
}

export interface Debt {
    id: string;
    type: 'debt' | 'loan'; 
    person: string;
    totalAmount: number;
    paidAmount: number;
    status: 'active' | 'paid';
    createdAt: string;
    dueDate?: string;
    installments: Installment[]; 
}

export interface PlannedGoalContribution {
    goalId: string;
    amount: number;
}

export interface MonthlyPlan {
    month: string; // YYYY-MM format
    plannedIncome: number;
    plannedContributions: PlannedGoalContribution[];
}

export interface BudgetingRule {
    needs: number; // percentage
    wants: number; // percentage
    savings: number; // percentage
}

export interface SubCategory {
    id: string;
    name: string;
    plannedAmount: number;
    categoryId: string; // e.g., 'billsAndUtilities'
}

export type BudgetCreationStep = 'idle' | 'get_income' | 'get_method';
export type BudgetMethod = '50/30/20' | '60/30/10' | '80/20' | 'manual' | 'ai';
export interface BudgetCreationState {
    step: BudgetCreationStep;
    income: number | null;
    isGenerating?: boolean;
}

export enum ActiveWidget {
  NONE,
  SHOPPING_LIST,
  BUDGETS,
  GOALS,
  GRAPH,
  INSIGHTS,
  RECURRING,
  PLANNING,
  RULE_BASED_BUDGET,
  TABLE_BUDGET,
  DEBT,
  FORECAST,
  REPORTS,
  EDUCATION,
  PROFILE
}

export interface Conversation {
  id: string;
  name: string;
  createdAt: string;
  status: 'active' | 'archived';
}

export type Bucket = 'needs' | 'wants' | 'savings';

export interface Category {
    id: string;
    name: string; // Translation key or raw name
    bucket: Bucket;
    isCustom: boolean;
}

export type AiPersona = 'benevolent' | 'strict' | 'humorous';

export interface ReportCategoryBreakdown {
    categoryId: string;
    planned: number;
    actual: number;
    difference: number;
    status: 'ok' | 'warning' | 'over';
}

export interface MonthlyReport {
    id: string; // YYYY-MM
    month: string;
    year: number;
    generatedAt: string;
    
    // Financial Data Snapshot
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    
    // Detailed Breakdown
    breakdown: ReportCategoryBreakdown[];
    
    // AI Generated Analysis
    executiveSummary: string;
    behavioralAnalysis: string;
    coachingTips: string[];
    
    status: 'final';
}

// Education Types
export type EducationalLevel = 'beginner' | 'intermediate' | 'advanced';
export type EducationalCategory = 'basics' | 'budgeting' | 'saving' | 'debt' | 'events' | 'psychology';

export interface EducationalResource {
    id: string;
    titleKey: string; // Translation key
    descriptionKey: string;
    contentKey: string; // Markdown content translation key
    category: EducationalCategory;
    level: EducationalLevel;
    readTimeMinutes: number;
    actionCommand?: string; // e.g., "create goal"
}

export interface GlossaryTerm {
    termKey: string;
    definitionKey: string;
}

export interface EducationState {
    readResourceIds: string[];
    activePathId: string | null;
}

// --- INTELLIGENT PROFILE TYPES ---

export type RiskTolerance = 'low' | 'medium' | 'high';
export type LearningStyle = 'visual' | 'text' | 'action';
export type FinancialStressLevel = 'low' | 'medium' | 'high';

export interface UserProfile {
    // Declarative (User controlled)
    financialMethod: BudgetMethod | 'custom';
    riskTolerance: RiskTolerance;
    learningStyle: LearningStyle;
    primaryGoal?: string; // e.g. "debt_free", "save_house", "invest"
    
    // Behavioral & Inferred (System Calculated)
    metrics: {
        financialMaturityScore: number; // 0-100
        budgetDisciplineScore: number; // 0-100 (Adherence to plans)
        stabilityIndex: number; // 0-100 (Savings/Debt ratio, consistency)
        monthlyProgress: number; // % change in net worth or savings
    };
    
    inferred: {
        stressLevel: FinancialStressLevel;
        educationalLevel: EducationalLevel;
        topSpendingCategory: string | null;
    };
    
    lastUpdated: string;
}

export type FinanceContextType = {
  // Current Conversation State
  userName: string;
  userAvatar: string;
  aiPersona: AiPersona;
  userProfile: UserProfile; // NEW
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
  debts: Debt[];
  monthlyReports: MonthlyReport[];
  aliases: Record<string, string>;
  balance: number;
  activeWidget: ActiveWidget;
  budgetCreationState: BudgetCreationState;
  inspectedBudgetId: string | null;
  inspectedGoalId: string | null;
  inspectedReportId: string | null;
  categories: Category[];
  
  // Education State
  educationState: EducationState;
  markResourceRead: (id: string) => void;
  
  // UI State
  commandInput: string;
  setCommandInput: (input: string | ((prev: string) => string)) => void;
  isLiveAssistantOpen: boolean;
  setLiveAssistantOpen: (isOpen: boolean) => void;
  isHelpOpen: boolean;
  setHelpOpen: (isOpen: boolean) => void;
  
  // Simulation State
  isSimulating: boolean;

  // Conversation Management State
  conversations: Conversation[];
  activeConversationId: string | null;
  currentConversation: Conversation | undefined;

  // Actions
  setUserName: (name: string) => void;
  setUserAvatar: (emoji: string) => void;
  setAiPersona: (persona: AiPersona) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void; // NEW
  togglePrivacyMode: () => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (transactionId: string) => void;
  updateTransactionCategory: (transactionId: string, newCategory: string) => void;
  addShoppingItem: (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'status' | 'actualAmount'>) => void;
  deleteShoppingItem: (listId: string, itemId: string) => void;
  purchaseShoppingItem: (listId: string, itemId: string, actualAmount: number) => void;
  createShoppingList: (name: string) => void;
  deleteShoppingList: (listId: string) => void;
  renameShoppingList: (listId: string, newName: string) => void;
  setActiveShoppingListId: (listId: string | null) => void;
  addBudget: (budget: Omit<Budget, 'id' | 'currentSpent'>) => void;
  updateBudget: (id: string, updates: Partial<Omit<Budget, 'id' | 'currentSpent'>>) => void;
  deleteBudget: (id: string) => void;
  addMonthlyBudget: (budget: Omit<Budget, 'id' | 'currentSpent' | 'name' | 'type'>) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'currentSaved' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Omit<Goal, 'id' | 'currentSaved'>>) => void;
  deleteGoal: (id: string) => void;
  addContributionToGoal: (goalId: string, amount: number) => void;
  withdrawFromGoal: (goalId: string, amount: number) => void;
  addRecurringTransaction: (tx: Omit<RecurringTransaction, 'id'>) => void;
  updateRecurringTransaction: (id: string, updates: Partial<Omit<RecurringTransaction, 'id'>>) => void;
  deleteRecurringTransaction: (id: string) => void;
  setActiveWidget: (widget: ActiveWidget) => void;
  setInspectedBudgetId: (budgetId: string | null) => void;
  setInspectedGoalId: (goalId: string | null) => void;
  setInspectedReportId: (reportId: string | null) => void;
  setPlannedIncome: (amount: number) => void;
  addPlannedContribution: (goalId: string, amount: number) => void;
  setBudgetingRule: (rule: BudgetingRule) => void;
  addSubCategory: (subCategory: Omit<SubCategory, 'id'>) => void;
  deleteSubCategory: (id: string) => void;
  updateSubCategory: (id: string, newAmount: number) => void;
  startBudgetCreation: () => void;
  cancelBudgetCreation: () => void;
  setBudgetIncome: (amount: number) => void;
  generateBudgetFromMethod: (method: BudgetMethod, t: (key: string) => string) => void;
  applyRuleToSubCategories: (rule: BudgetingRule, t: (key: string) => string) => void;
  scaleSubCategoriesToRule: (rule: BudgetingRule) => void;
  applyPlanToBudgets: () => void;
  addDebt: (debt: Omit<Debt, 'id' | 'paidAmount' | 'status' | 'createdAt' | 'installments'>) => void;
  recordDebtPayment: (person: string, amount: number, type: 'payment' | 'repayment') => void;
  markDebtAsPaid: (debtId: string) => void;
  deleteDebt: (debtId: string) => void;
  updateDebt: (id: string, updates: Partial<Omit<Debt, 'id' | 'createdAt'>>) => void;
  toggleDebtInstallment: (debtId: string, installmentId: string) => void;
  updateDebtInstallment: (debtId: string, installmentId: string, newAmount: number) => void;
  exportData: () => void;
  exportCsv: () => void;
  importData: (jsonString: string) => boolean;
  resetCurrentConversation: () => void;
  addAlias: (key: string, command: string) => void;
  deleteAlias: (key: string) => void;
  
  // Category Actions
  addCategory: (category: Omit<Category, 'id' | 'isCustom'>) => void;
  deleteCategory: (id: string) => void;
  
  // Simulation Actions
  startSimulation: () => void;
  commitSimulation: () => void;
  cancelSimulation: () => void;

  // Conversation Actions
  createConversation: () => void;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newName: string) => void;
  autoRenameConversation: (id: string) => Promise<string | null>;
  duplicateConversation: (id: string) => void;
  archiveConversation: (id: string) => void;
};

export type Currency = 'USD' | 'EUR' | 'XOF';

export type LanguageContextType = {
  language: 'en' | 'fr';
  setLanguage: (language: 'en' | 'fr') => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  locale: string;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
};

export interface ToastAction {
    label: string;
    onClick: () => void;
}

export type ToastContextType = {
  showToast: (message: string, action?: ToastAction) => void;
};
