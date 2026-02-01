import { GoogleGenAI, Type } from '@google/genai';
import { Transaction, SubCategory } from '../types';

const API_KEY = process.env.API_KEY;

const CATEGORY_IDS = [
  'foodAndDining', 'transport', 'shopping', 'entertainment',
  'billsAndUtilities', 'health', 'income', 'general'
];

export const suggestBudget = async (
  transactions: Transaction[],
  income: number
): Promise<Omit<SubCategory, 'id'>[]> => {
  if (!API_KEY) {
    console.error("API key is not available for budget suggestion.");
    throw new Error("API key not configured.");
  }

  if (transactions.length === 0) {
    console.warn("No transactions to analyze for budget suggestion.");
    return [];
  }

  // Use 'as any' if the type doesn't yet include dangerouslyAllowBrowser in this version
  const ai = new GoogleGenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true
  } as any);

  const transactionData = transactions
    .filter(t => t.type === 'expense')
    .map(t => ({ amount: t.amount, label: t.label, category: t.category, date: t.date.split('T')[0] }));

  const prompt = `
    Based on the provided monthly income of ${income} and the following list of past expense transactions, generate a realistic and sensible monthly budget.

    Your task is to:
    1. Analyze the spending habits from the transactions.
    2. Create a list of budget sub-categories with a planned amount for each.
    3. The total of all planned amounts MUST NOT exceed the monthly income.
    4. Assign each sub-category to one of the valid 'categoryId' values.
    5. Provide a diverse range of sub-categories based on the transactions (e.g., 'Rent', 'Groceries', 'Internet Bill', 'Gas', 'Movies', 'Restaurants').
    6. If there are savings-related transactions (e.g. contribution to goals), create a 'Savings' or 'Investments' sub-category under the 'general' category.
    
    Transactions:
    ${JSON.stringify(transactionData.slice(0, 50))}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "A descriptive name for the sub-category (e.g., 'Groceries', 'Rent')."
              },
              plannedAmount: {
                type: Type.NUMBER,
                description: "The suggested monthly budget amount for this sub-category."
              },
              categoryId: {
                type: Type.STRING,
                description: "The parent category ID.",
                enum: CATEGORY_IDS
              }
            },
            required: ["name", "plannedAmount", "categoryId"]
          }
        },
      },
    });

    const suggestedCategories = JSON.parse(response.text.trim()) as Omit<SubCategory, 'id'>[];

    // Ensure total doesn't exceed income
    let totalPlanned = suggestedCategories.reduce((sum, cat) => sum + cat.plannedAmount, 0);
    if (totalPlanned > income) {
      // Simple scaling down if AI overshoots.
      const scalingFactor = income / totalPlanned;
      return suggestedCategories.map(cat => ({
        ...cat,
        plannedAmount: Math.floor(cat.plannedAmount * scalingFactor)
      }));
    }

    return suggestedCategories;

  } catch (error) {
    console.error("Error generating budget with AI:", error);
    throw new Error("Failed to generate AI budget suggestion.");
  }
};
