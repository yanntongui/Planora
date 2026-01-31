
import { UserProfile, Transaction, Budget, Debt, Goal, EducationalLevel, FinancialStressLevel } from '../types';

/**
 * Calculates the "Financial Maturity Score" based on feature usage and data completeness.
 * Range: 0-100
 */
function calculateMaturityScore(
    transactions: Transaction[],
    budgets: Budget[],
    goals: Goal[],
    debts: Debt[]
): number {
    let score = 0;

    // 1. Tracking Basics (Max 30)
    if (transactions.length > 5) score += 10;
    if (transactions.length > 20) score += 10;
    if (transactions.length > 50) score += 10;

    // 2. Planning (Max 30)
    if (budgets.length > 0) score += 15;
    if (budgets.some(b => b.type === 'monthly')) score += 15;

    // 3. Future Orientation (Max 20)
    if (goals.length > 0) score += 10;
    if (goals.some(g => g.currentSaved > 0)) score += 10;

    // 4. Debt Management (Max 20)
    // Either no debt OR tracking debt actively
    const hasDebt = debts.some(d => d.type === 'debt' && d.status === 'active');
    if (!hasDebt) {
        score += 20; // Debt free is mature
    } else {
        score += 10; // Tracking debt is responsible
        if (transactions.some(t => t.label.toLowerCase().includes('debt') || t.label.toLowerCase().includes('dette'))) {
            score += 10; // Making payments
        }
    }

    return Math.min(100, score);
}

/**
 * Calculates "Budget Discipline Score" based on adherence to set limits.
 * Range: 0-100
 */
function calculateDisciplineScore(budgets: Budget[]): number {
    if (budgets.length === 0) return 50; // Neutral start

    let totalScore = 0;
    let count = 0;

    budgets.forEach(b => {
        if (b.limit === 0) return;
        const adherence = (b.currentSpent / b.limit);
        
        if (adherence <= 1) {
            // Perfect: 100. Good: 90-100
            totalScore += 100 - (adherence * 10); // Slight penalty for getting close to 100%? No, staying under is good.
            // Actually, let's simplify: Staying under is 100.
            totalScore += 100;
        } else {
            // Over budget
            const overage = adherence - 1; // e.g. 0.2 for 120%
            const penalty = Math.min(100, overage * 100); // 20% over = 20 pts penalty
            totalScore += (100 - penalty);
        }
        count++;
    });

    if (count === 0) return 50;
    return Math.round(totalScore / count);
}

/**
 * Calculates "Stability Index" based on debt ratio and consistency.
 * Range: 0-100
 */
function calculateStabilityIndex(transactions: Transaction[], debts: Debt[], goals: Goal[]): number {
    let score = 50; // Base

    // Debt Ratio Impact
    const totalDebt = debts.filter(d => d.type === 'debt' && d.status === 'active').reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
    const totalSavings = goals.reduce((sum, g) => sum + g.currentSaved, 0);

    if (totalDebt === 0) score += 20;
    else if (totalSavings > totalDebt) score += 10;
    else score -= 10;

    // Income Consistency (Simple heuristic: look for 'income' transactions in different months)
    const incomeTxs = transactions.filter(t => t.type === 'income');
    const uniqueMonths = new Set(incomeTxs.map(t => t.date.substring(0, 7))).size;
    
    if (uniqueMonths >= 3) score += 20;
    if (uniqueMonths >= 6) score += 10;

    return Math.max(0, Math.min(100, score));
}

/**
 * Infers Financial Stress Level
 */
function inferStressLevel(stability: number, discipline: number, debts: Debt[]): FinancialStressLevel {
    const hasOverdueDebt = debts.some(d => {
        if (!d.dueDate || d.status === 'paid') return false;
        return new Date(d.dueDate) < new Date();
    });

    if (hasOverdueDebt || stability < 30) return 'high';
    if (discipline < 50 || stability < 60) return 'medium';
    return 'low';
}

/**
 * Infers Educational Level for Content Recommendation
 */
function inferEducationalLevel(maturity: number): EducationalLevel {
    if (maturity < 40) return 'beginner';
    if (maturity < 80) return 'intermediate';
    return 'advanced';
}

/**
 * Main function to recalculate the entire profile based on current data.
 */
export const recalculateProfile = (
    currentProfile: UserProfile,
    transactions: Transaction[],
    budgets: Budget[],
    goals: Goal[],
    debts: Debt[]
): UserProfile => {
    
    const maturity = calculateMaturityScore(transactions, budgets, goals, debts);
    const discipline = calculateDisciplineScore(budgets);
    const stability = calculateStabilityIndex(transactions, debts, goals);
    
    const stress = inferStressLevel(stability, discipline, debts);
    const eduLevel = inferEducationalLevel(maturity);

    // Identify top spending category
    const expensesByCategory: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.category || 'general';
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + t.amount;
    });
    
    let topCategory = null;
    let maxAmount = 0;
    Object.entries(expensesByCategory).forEach(([cat, amount]) => {
        if (amount > maxAmount) {
            maxAmount = amount;
            topCategory = cat;
        }
    });

    return {
        ...currentProfile,
        metrics: {
            financialMaturityScore: maturity,
            budgetDisciplineScore: discipline,
            stabilityIndex: stability,
            monthlyProgress: 0, // Requires historical data comparing months, placeholder for now
        },
        inferred: {
            stressLevel: stress,
            educationalLevel: eduLevel,
            topSpendingCategory: topCategory
        },
        lastUpdated: new Date().toISOString()
    };
};
