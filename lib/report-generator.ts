
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, MonthlyReport, SubCategory, Category, ReportCategoryBreakdown, AiPersona } from "../types";

export const generateMonthlyReportData = async (
    month: number, // 0-11
    year: number,
    transactions: Transaction[],
    subCategories: SubCategory[], // From the plan
    categories: Category[],
    persona: AiPersona,
    language: 'en' | 'fr'
): Promise<MonthlyReport> => {
    
    // 1. Data Aggregation
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
    
    const monthTransactions = transactions.filter(tx => {
        const d = new Date(tx.date);
        return d >= startOfMonth && d <= endOfMonth;
    });

    const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const netSavings = income - expenses;
    const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

    // Breakdown Logic
    // Group transactions by category
    const actualsByCategory: Record<string, number> = {};
    monthTransactions.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.category || 'general';
        actualsByCategory[cat] = (actualsByCategory[cat] || 0) + t.amount;
    });

    // Merge with planned amounts from subCategories
    // First, group planned amounts by category
    const plannedByCategory: Record<string, number> = {};
    subCategories.forEach(sub => {
        plannedByCategory[sub.categoryId] = (plannedByCategory[sub.categoryId] || 0) + sub.plannedAmount;
    });

    // Create the union of all categories involved (planned OR actual)
    const allCategoryIds = new Set([...Object.keys(actualsByCategory), ...Object.keys(plannedByCategory)]);
    
    const breakdown: ReportCategoryBreakdown[] = Array.from(allCategoryIds).map(catId => {
        const planned = plannedByCategory[catId] || 0;
        const actual = actualsByCategory[catId] || 0;
        const diff = planned - actual;
        
        let status: 'ok' | 'warning' | 'over' = 'ok';
        if (actual > planned && planned > 0) {
            const percentOver = (actual / planned) - 1;
            status = percentOver > 0.1 ? 'over' : 'warning';
        } else if (planned === 0 && actual > 0) {
            status = 'over'; // Unplanned expense
        }

        return { categoryId: catId, planned, actual, difference: diff, status };
    });

    // 2. AI Analysis Generation
    const apiKey = process.env.API_KEY;
    let analysis = {
        executiveSummary: "Analysis unavailable (API Key missing)",
        behavioralAnalysis: "Analysis unavailable",
        coachingTips: ["Check your budget settings."]
    };

    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            
            // Prepare context for AI
            const contextData = {
                period: `${month + 1}/${year}`,
                income,
                expenses,
                netSavings,
                savingsRate,
                topExpenses: breakdown.sort((a,b) => b.actual - a.actual).slice(0, 5),
                worstOverBudget: breakdown.filter(b => b.difference < 0).sort((a,b) => a.difference - b.difference).slice(0, 3),
                persona
            };

            const prompt = `
            You are an expert financial analyst and coach. Generate a monthly financial report for a user based on the provided data.
            
            **User Persona**: ${persona} (Adjust tone accordingly: benevolent=gentle, strict=direct/military, humorous=witty/sarcastic).
            **Language**: ${language}
            **Data**: ${JSON.stringify(contextData)}

            **Requirements**:
            1. **Executive Summary**: A concise paragraph summarizing the financial health of the month.
            2. **Behavioral Analysis**: Analyze spending habits. Point out positives and risk zones. Compare to general good practices.
            3. **Coaching Tips**: Provide exactly 3 actionable, concrete tips for next month based on the data.

            Return JSON matching the schema.
            `;

            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            executiveSummary: { type: Type.STRING },
                            behavioralAnalysis: { type: Type.STRING },
                            coachingTips: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["executiveSummary", "behavioralAnalysis", "coachingTips"]
                    }
                }
            });

            if (response.text) {
                let cleanText = response.text.trim();
                // Remove markdown code blocks if present (common issue with some models)
                if (cleanText.startsWith('```json')) {
                    cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                } else if (cleanText.startsWith('```')) {
                    cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }
                analysis = JSON.parse(cleanText);
            }

        } catch (e) {
            console.error("Report generation AI failed", e);
        }
    }

    return {
        id: `${year}-${String(month + 1).padStart(2, '0')}`,
        month: new Date(year, month).toLocaleString(language, { month: 'long' }),
        year,
        generatedAt: new Date().toISOString(),
        totalIncome: income,
        totalExpenses: expenses,
        netSavings,
        savingsRate,
        breakdown,
        executiveSummary: analysis.executiveSummary,
        behavioralAnalysis: analysis.behavioralAnalysis,
        coachingTips: analysis.coachingTips,
        status: 'final'
    };
};
