import { supabase } from './supabase';
import { Transaction, Budget, Goal, ShoppingList, ShoppingItem, RecurringTransaction, Debt, Installment, SubCategory, MonthlyReport, UserProfile, Category, Conversation } from '../types';

// User Profile
export const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
    return { data, error };
};

export const upsertUserProfile = async (profile: Partial<UserProfile> & { id: string }) => {
    const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profile)
        .select()
        .single();
    return { data, error };
};

// Conversations
export const fetchConversations = async (userId: string) => {
    const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');
    return { data, error };
};

export const createConversation = async (conversation: Partial<Conversation>) => {
    const { data, error } = await supabase
        .from('conversations')
        .insert(conversation)
        .select()
        .single();
    return { data, error };
};

export const updateConversation = async (id: string, updates: Partial<Conversation>) => {
    const { data, error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    return { data, error };
};

export const deleteConversation = async (id: string) => {
    const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);
    return { error };
};

// Transactions
export const fetchTransactions = async (conversationId: string) => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('date', { ascending: false });
    return { data, error };
};

export const createTransaction = async (transaction: Omit<Transaction, 'id'> & { conversation_id: string, user_id: string }) => {
    const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();
    return { data, error };
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    return { data, error };
};

export const deleteTransaction = async (id: string) => {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
    return { error };
};

// Budgets
export const fetchBudgets = async (conversationId: string) => {
    const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('conversation_id', conversationId);
    return { data, error };
};

export const createBudget = async (budget: Omit<Budget, 'id'> & { conversation_id: string, user_id: string }) => {
    const { data, error } = await supabase
        .from('budgets')
        .insert(budget)
        .select()
        .single();
    return { data, error };
};

export const updateBudget = async (id: string, updates: Partial<Budget>) => {
    const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    return { data, error };
};

export const deleteBudget = async (id: string) => {
    const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);
    return { error };
};

// Goals
export const fetchGoals = async (conversationId: string) => {
    const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('conversation_id', conversationId);
    return { data, error };
};

export const createGoal = async (goal: Omit<Goal, 'id'> & { conversation_id: string, user_id: string }) => {
    const { data, error } = await supabase
        .from('goals')
        .insert(goal)
        .select()
        .single();
    return { data, error };
};

export const updateGoal = async (id: string, updates: Partial<Goal>) => {
    const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    return { data, error };
};

export const deleteGoal = async (id: string) => {
    const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);
    return { error };
};

// Helper to batch fetch all financial data for a conversation
export const fetchFinancialData = async (conversationId: string) => {
    const [
        transactions,
        budgets,
        goals,
        recurring,
        shoppingLists,
        debts,
        subCategories,
        reports,
        categories
    ] = await Promise.all([
        fetchTransactions(conversationId),
        fetchBudgets(conversationId),
        fetchGoals(conversationId),
        supabase.from('recurring_transactions').select('*').eq('conversation_id', conversationId),
        supabase.from('shopping_lists').select('*, items:shopping_items(*)').eq('conversation_id', conversationId),
        supabase.from('debts').select('*, installments(*)').eq('conversation_id', conversationId),
        supabase.from('sub_categories').select('*').eq('conversation_id', conversationId),
        supabase.from('monthly_reports').select('*').eq('conversation_id', conversationId),
        supabase.from('categories').select('*') // Categories might be global or user-specific
    ]);

    return {
        transactions: transactions.data || [],
        budgets: budgets.data || [],
        goals: goals.data || [],
        recurringTransactions: recurring.data || [],
        shoppingLists: shoppingLists.data || [],
        debts: debts.data || [],
        subCategories: subCategories.data || [],
        monthlyReports: reports.data || [],
        categories: categories.data || []
    };
};
