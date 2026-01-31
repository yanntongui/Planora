import { supabase } from './supabase';
import { initialFinancialState } from '../context/FinanceContext'; // We might need to export this if not already
import { Transaction, Budget, Goal, RecurringTransaction, ShoppingList, Debt, SubCategory } from '../types';

export const exportLocalStorageData = () => {
    const rawState = localStorage.getItem('prompt-finance-state');
    if (!rawState) return null;
    return JSON.parse(rawState);
};

export const migrateToSupabase = async (userId: string, onProgress: (msg: string) => void) => {
    const localData = exportLocalStorageData();
    if (!localData) {
        onProgress("No local data found.");
        return;
    }

    const { financialData, conversations } = localData;

    // 1. Migrate Conversations
    for (const conv of conversations) {
        onProgress(`Migrating budget: ${conv.name}...`);

        // Upsert conversation
        const { data: convData, error: convError } = await supabase
            .from('conversations')
            .upsert({
                id: conv.id,
                user_id: userId,
                name: conv.name,
                status: conv.status,
                created_at: conv.createdAt
            })
            .select()
            .single();

        if (convError) {
            console.error("Error migrating conversation", conv.name, convError);
            continue;
        }

        const data = financialData[conv.id];
        if (!data) continue;

        // 2. Migrate Transactions
        if (data.transactions && data.transactions.length > 0) {
            onProgress(`Migrating ${data.transactions.length} transactions for ${conv.name}...`);
            const txs = data.transactions.map((t: Transaction) => ({
                id: t.id,
                conversation_id: conv.id,
                user_id: userId,
                date: t.date,
                amount: t.amount,
                label: t.label,
                type: t.type,
                category: t.category,
                budget_id: t.budgetId,
                goal_id: t.goalId,
                receipt_image: t.receiptImage
            }));
            const { error: txError } = await supabase.from('transactions').upsert(txs);
            if (txError) console.error("Error migrating transactions", txError);
        }

        // 3. Migrate Budgets
        if (data.budgets && data.budgets.length > 0) {
            onProgress(`Migrating ${data.budgets.length} budgets...`);
            const budgets = data.budgets.map((b: Budget) => ({
                id: b.id,
                conversation_id: conv.id,
                user_id: userId,
                name: b.name,
                limit_amount: b.limit,
                current_spent: b.currentSpent,
                type: b.type,
                category: b.category,
                reset_date: b.resetDate
            }));
            await supabase.from('budgets').upsert(budgets);
        }

        // 4. Migrate Goals
        if (data.goals && data.goals.length > 0) {
            onProgress(`Migrating ${data.goals.length} goals...`);
            const goals = data.goals.map((g: Goal) => ({
                id: g.id,
                conversation_id: conv.id,
                user_id: userId,
                name: g.name,
                target: g.target,
                current_saved: g.currentSaved,
                target_date: g.targetDate
            }));
            await supabase.from('goals').upsert(goals);
        }

        // 5. Migrate Recurring Transactions
        if (data.recurringTransactions && data.recurringTransactions.length > 0) {
            const recurring = data.recurringTransactions.map((r: RecurringTransaction) => ({
                id: r.id,
                conversation_id: conv.id,
                user_id: userId,
                label: r.label,
                amount: r.amount,
                category: r.category,
                frequency: r.frequency,
                next_due_date: r.nextDueDate,
                budget_id: r.budgetId,
                type: r.type
            }));
            await supabase.from('recurring_transactions').upsert(recurring);
        }

        // 6. Migrate Debts
        if (data.debts && data.debts.length > 0) {
            const debts = data.debts.map((d: Debt) => ({
                id: d.id,
                conversation_id: conv.id,
                user_id: userId,
                type: d.type,
                person: d.person,
                total_amount: d.totalAmount,
                paid_amount: d.paidAmount,
                status: d.status,
                due_date: d.dueDate
            }));
            await supabase.from('debts').upsert(debts);

            // Migrate Installments
            for (const d of data.debts) {
                if (d.installments && d.installments.length > 0) {
                    const installments = d.installments.map((i: any) => ({
                        id: i.id,
                        debt_id: d.id,
                        date: i.date,
                        amount: i.amount,
                        is_paid: i.isPaid
                    }));
                    await supabase.from('installments').upsert(installments);
                }
            }
        }

        // 7. Migrate SubCategories
        if (data.subCategories && data.subCategories.length > 0) {
            const subs = data.subCategories.map((s: SubCategory) => ({
                id: s.id,
                conversation_id: conv.id,
                user_id: userId,
                name: s.name,
                planned_amount: s.plannedAmount,
                category_id: s.categoryId
            }));
            await supabase.from('sub_categories').upsert(subs);
        }
    }

    // 8. Migrate User Attributes (Profile)
    // Try to find the last active conversation to get user name
    const activeId = localData.activeConversationId;
    if (activeId && localData.financialData[activeId]) {
        const lastData = localData.financialData[activeId];
        await supabase.from('user_profiles').upsert({
            id: userId,
            user_name: lastData.userName || 'Utilisateur',
            user_avatar: lastData.userAvatar || '👤',
            ai_persona: lastData.aiPersona || 'benevolent',
            is_privacy_mode: lastData.isPrivacyMode,
            updated_at: new Date().toISOString()
        });
    }

    onProgress("Migration completed successfully!");
};
