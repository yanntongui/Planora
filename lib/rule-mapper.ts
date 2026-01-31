
import { BudgetingRule, SubCategory } from '../types';

type Bucket = 'needs' | 'wants' | 'savings';

const categoryToBucketMap: { [category: string]: Bucket } = {
  'billsAndUtilities': 'needs',
  'transport': 'needs',
  'health': 'needs',
  'foodAndDining': 'needs', // Moving food to needs
  
  'shopping': 'wants',
  'entertainment': 'wants',
  'general': 'wants',
  
  'income': 'wants',
};

/**
 * Maps user-friendly category names to system category IDs.
 * Supports both English and French inputs.
 */
const userInputToCategoryIdMap: { [userInput: string]: string } = {
    // English
    'housing': 'billsAndUtilities',
    'bills': 'billsAndUtilities',
    'utilities': 'billsAndUtilities',
    'transportation': 'transport',
    'food': 'foodAndDining',
    'dining': 'foodAndDining',
    'leisure': 'entertainment',
    'fun': 'entertainment',
    'savings': 'general', // Savings are goal-based
    // French
    'logement': 'billsAndUtilities',
    'factures': 'billsAndUtilities',
    'alimentation': 'foodAndDining',
    'nourriture': 'foodAndDining',
    'loisirs': 'entertainment',
    'épargne': 'general'
};

export const getBucketForCategory = (category: string): Bucket => {
  return categoryToBucketMap[category] || 'wants';
};

export const mapUserInputToCategoryId = (userInput: string): string | null => {
    const lowerInput = userInput.toLowerCase();
    
    // Direct match
    if (userInputToCategoryIdMap[lowerInput]) {
        return userInputToCategoryIdMap[lowerInput];
    }
    
    // Check if it's already a valid categoryId
    if (Object.keys(categoryToBucketMap).includes(lowerInput)) {
        return lowerInput;
    }

    return null;
}

// Hierarchical configuration for sub-category generation
const SUB_CATEGORY_DISTRIBUTION = {
    needs: [
        { key: 'budgetCreation.subCatRent', percent: 0.40, categoryId: 'billsAndUtilities' },
        { key: 'budgetCreation.subCatFood', percent: 0.25, categoryId: 'foodAndDining' },
        { key: 'budgetCreation.subCatTransport', percent: 0.20, categoryId: 'transport' },
        { key: 'budgetCreation.subCatHealth', percent: 0.15, categoryId: 'health' },
    ],
    wants: [
        { key: 'budgetCreation.subCatDining', percent: 0.40, categoryId: 'foodAndDining' },
        { key: 'budgetCreation.subCatShopping', percent: 0.30, categoryId: 'shopping' },
        { key: 'budgetCreation.subCatEntertainment', percent: 0.30, categoryId: 'entertainment' },
    ],
    savings: [
        { key: 'budgetCreation.subCatSavings', percent: 1.00, categoryId: 'general' },
    ]
};

export const getDefaultSubCategories = (income: number, rule: BudgetingRule, t: (key: string) => string): Omit<SubCategory, 'id'>[] => {
    const needsAmount = income * (rule.needs / 100);
    const wantsAmount = income * (rule.wants / 100);
    const savingsAmount = income * (rule.savings / 100);

    const subCategories: Omit<SubCategory, 'id'>[] = [];

    // Helper to distribute amount into subcategories
    const distribute = (totalAmount: number, items: typeof SUB_CATEGORY_DISTRIBUTION['needs']) => {
        items.forEach(item => {
            const amount = Math.floor(totalAmount * item.percent);
            if (amount > 0) {
                subCategories.push({
                    name: t(item.key),
                    plannedAmount: amount,
                    categoryId: item.categoryId
                });
            }
        });
    };

    if (rule.needs > 0) distribute(needsAmount, SUB_CATEGORY_DISTRIBUTION.needs);
    if (rule.wants > 0) distribute(wantsAmount, SUB_CATEGORY_DISTRIBUTION.wants);
    if (rule.savings > 0) distribute(savingsAmount, SUB_CATEGORY_DISTRIBUTION.savings);
    
    return subCategories;
};
