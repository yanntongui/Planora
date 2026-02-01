
import { GoogleGenAI, Type } from '@google/genai';
import { ActiveWidget, Frequency, BudgetingRule, Debt } from '../types';

type AiParsedTransaction = {
  type: 'expense' | 'income';
  amount: number;
  label: string;
  date?: string;
  category: string;
};

export type ParsedCommand =
  | { action: 'ADD_TRANSACTION'; payload: Omit<AiParsedTransaction, 'category'> & { category?: string; receiptImage?: string } }
  | { action: 'ADD_SHOPPING_ITEM'; payload: { text: string; plannedAmount: number } }
  | { action: 'CREATE_SHOPPING_LIST'; payload: { name: string } }
  | { action: 'ADD_BUDGET'; payload: { name: string; limit: number; type: 'event' | 'monthly' } }
  | { action: 'ADD_MONTHLY_BUDGET'; payload: { category: string; limit: number } }
  | { action: 'ADD_GOAL'; payload: { name: string; target: number, targetDate?: string } }
  | { action: 'ADD_CONTRIBUTION'; payload: { amount: number; goalName: string } }
  | { action: 'WITHDRAW_FROM_GOAL'; payload: { amount: number; goalName: string } }
  | { action: 'ADD_RECURRING_TRANSACTION'; payload: { amount: number; label: string; frequency: Frequency, type: 'expense' | 'income' } }
  | { action: 'SHOW_WIDGET'; payload: { widget: ActiveWidget } }
  | { action: 'SET_PLANNED_INCOME'; payload: { amount: number } }
  | { action: 'ADD_PLANNED_CONTRIBUTION'; payload: { amount: number; goalName: string } }
  | { action: 'SET_BUDGETING_RULE'; payload: BudgetingRule }
  | { action: 'ADD_SUB_CATEGORY'; payload: { name: string; amount: number; category: string } }
  | { action: 'START_BUDGET_CREATION', payload: {} }
  | { action: 'ADD_DEBT', payload: Omit<Debt, 'id' | 'paidAmount' | 'status' | 'createdAt' | 'installments'> }
  | { action: 'RECORD_DEBT_PAYMENT', payload: { person: string; amount: number; type: 'payment' | 'repayment' } }
  | { action: 'ADD_ALIAS'; payload: { key: string; command: string } }
  | { action: 'START_SIMULATION'; payload: { command?: string } }
  | { action: 'OPEN_HELP'; payload: {} }
  | { action: 'UNKNOWN'; payload: {} };

async function parseWithAI(input: string): Promise<ParsedCommand> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API key is not available.");
    return { action: 'UNKNOWN', payload: {} };
  }
  const ai = new GoogleGenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  } as any);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().split('T')[0];
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following user input to extract financial transaction details. Determine if it's an 'expense' or 'income'. Extract the amount, a concise label, and categorize it. Parse this text: "${input}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['expense', 'income'], description: 'Type of the transaction.' },
            amount: { type: Type.NUMBER, description: 'The numerical amount of the transaction.' },
            label: { type: Type.STRING, description: 'A concise description of the transaction.' },
            category: { type: Type.STRING, description: `The most appropriate category. Choose one of these exact values: 'foodAndDining', 'transport', 'shopping', 'entertainment', 'billsAndUtilities', 'health', 'income', 'general'.` },
            date: { type: Type.STRING, nullable: true, description: `The date in YYYY-MM-DD format. If the user says "yesterday", use ${yesterdayISO}. If no date is mentioned, this field should be null.` }
          },
          required: ["type", "amount", "label", "category"]
        },
      },
    });
    const parsedJson = JSON.parse(response.text.trim()) as AiParsedTransaction;
    if (parsedJson.amount && parsedJson.label && parsedJson.type) {
      return { action: 'ADD_TRANSACTION', payload: parsedJson };
    }
    return { action: 'UNKNOWN', payload: {} };
  } catch (error) {
    console.error("Error parsing with AI:", error);
    return { action: 'UNKNOWN', payload: {} };
  }
}

/**
 * Safely evaluates a simple math expression string.
 * Supports +, -, *, /, (, ).
 * Returns NaN if invalid.
 */
function safeMathEval(expression: string): number {
  try {
    // Remove everything except numbers and math operators
    const cleanExpr = expression.replace(/[^0-9\+\-\*\/\.\(\)\s]/g, '');
    if (!cleanExpr.trim()) return NaN;
    // Function constructor is safer than eval, but still requires care.
    // We strictly filtered input so it should be fine.
    return new Function(`return (${cleanExpr})`)();
  } catch (e) {
    return NaN;
  }
}

export const parseCommand = async (input: string, language: 'en' | 'fr'): Promise<ParsedCommand> => {
  const cleanInput = input.trim().toLowerCase();
  const isFrench = language === 'fr';
  let match;

  const keywords = {
    monthly_budget_cmd: isFrench ? ['budget mensuel', 'monthly budget'] : ['monthly budget', 'budget mensuel'],
    list: isFrench ? ['liste', 'list'] : ['list'],
    budgets: isFrench ? ['budgets', 'budget'] : ['budgets', 'budget'],
    goals: isFrench ? ['objectifs', 'objectif', 'goals', 'goal'] : ['goals', 'goal', 'objectifs', 'objectif'],
    graph: isFrench ? ['graphique', 'graph', 'chart'] : ['graph', 'chart', 'graphique'],
    forecast: isFrench ? ['prévision', 'projection', 'forecast', 'avenir'] : ['forecast', 'projection', 'future'],
    reports: isFrench ? ['rapports', 'rapport', 'reports', 'report'] : ['reports', 'report', 'rapports', 'rapport'],
    insights: isFrench ? ['aperçus', 'analyser', 'insights', 'analyze'] : ['insights', 'analyze', 'aperçus', 'analyser'],
    recurring: isFrench ? ['récurrents', 'abonnements', 'recurring', 'subscriptions'] : ['recurring', 'subscriptions', 'récurrents', 'abonnements'],
    plan: isFrench ? ['plan', 'planification', 'planning'] : ['plan', 'planning', 'planification'],
    rule: isFrench ? ['règle', 'règle budget', 'rule', 'budget rule'] : ['rule', 'budget rule', 'règle', 'règle budget'],
    table: isFrench ? ['tableau', 'tableau budget', 'table', 'budget table'] : ['table', 'budget table', 'tableau', 'tableau budget'],
    debt: isFrench ? ['dette', 'prêt', 'dettes', 'prêts', 'debt', 'loan', 'debts'] : ['debt', 'loan', 'debts', 'dette', 'prêt', 'dettes', 'prêts'],
    clear: isFrench ? ['effacer', 'cacher', 'clear', 'hide'] : ['clear', 'hide', 'effacer', 'cacher'],
    simulate: isFrench ? ['simuler', 'simulate', 'simulation', 'sim', 'what if', 'et si'] : ['simulate', 'simulation', 'sim', 'what if'],
    help: isFrench ? ['aide', 'help', 'commandes', 'commands'] : ['help', 'commands', 'aide'],
    education: isFrench ? ['éducation', 'apprendre', 'cours', 'education', 'learn'] : ['education', 'learn', 'course'],
    profile: isFrench ? ['profil', 'profile', 'mon profil', 'my profile'] : ['profile', 'my profile', 'me'],

    debt_from_for: { debt: isFrench ? ['dette'] : ['debt'], from: isFrench ? ['de'] : ['from'], for: isFrench ? ['pour'] : ['for'] },
    loan_to_for: { loan: isFrench ? ['prêt'] : ['loan'], to: isFrench ? ['à'] : ['to'], for: isFrench ? ['pour'] : ['for'] },
    pay_to: { pay: isFrench ? ['payer'] : ['pay'], to: isFrench ? ['à'] : ['to'] },
    receive_from: { receive: isFrench ? ['recevoir'] : ['receive'], from: isFrench ? ['de'] : ['from'] },
    create_list: { create: isFrench ? ['créer', 'creer'] : ['create'], list: isFrench ? ['liste'] : ['list'] },
    plan_subcategory_for: { plan: isFrench ? ['planifier'] : ['plan'], subcategory: isFrench ? ['sous-catégorie'] : ['subcategory'], for: isFrench ? ['pour'] : ['for'] },
    set_rule: { set: isFrench ? ['définir'] : ['set'], rule: isFrench ? ['règle'] : ['rule'] },
    plan_income: { plan: isFrench ? ['planifier'] : ['plan'], income: isFrench ? ['revenu'] : ['income'] },
    plan_save_for: { plan: isFrench ? ['planifier'] : ['plan'], save: isFrench ? ['épargne'] : ['save'], for: isFrench ? ['pour'] : ['for'] },
    monthly_budget: { monthly: isFrench ? ['mensuel'] : ['monthly'], budget: ['budget'] },
    every: { every: isFrench ? ['chaque'] : ['every'], week: isFrench ? ['semaine'] : ['week'], month: isFrench ? ['mois'] : ['month'], year: isFrench ? ['an'] : ['year'] },
    save_for: { save: isFrench ? ['épargner'] : ['save'], for: isFrench ? ['pour'] : ['for'] },
    withdraw_from: { withdraw: isFrench ? ['retirer', 'utiliser'] : ['withdraw', 'use'], from: isFrench ? ['de'] : ['from'] },
    goal_by: { goal: isFrench ? ['objectif'] : ['goal'], by: isFrench ? ['pour le', 'd\'ici'] : ['by'] },
    income: { in: isFrench ? ['revenu', 'in', '+'] : ['in', '+'] },
  };

  // Help command
  if (keywords.help.includes(cleanInput)) return { action: 'OPEN_HELP', payload: {} };

  if (keywords.monthly_budget_cmd.includes(cleanInput)) return { action: 'START_BUDGET_CREATION', payload: {} };
  if (keywords.list.includes(cleanInput)) return { action: 'SHOW_WIDGET', payload: { widget: ActiveWidget.SHOPPING_LIST } };
  if (keywords.budgets.includes(cleanInput)) return { action: 'SHOW_WIDGET', payload: { widget: ActiveWidget.BUDGETS } };
  if (keywords.goals.includes(cleanInput)) return { action: 'SHOW_WIDGET', payload: { widget: ActiveWidget.GOALS } };
  if (keywords.graph.includes(cleanInput)) return { action: 'SHOW_WIDGET', payload: { widget: ActiveWidget.GRAPH } };
  if (keywords.forecast.includes(cleanInput)) return { action: 'SHOW_WIDGET', payload: { widget: ActiveWidget.FORECAST } };
  if (keywords.reports.includes(cleanInput)) return { action: 'SHOW_WIDGET', payload: { widget: ActiveWidget.REPORTS } };
  if (keywords.insights.includes(cleanInput)) return { action: 'SHOW_WIDGET', payload: { widget: ActiveWidget.INSIGHTS } };
  if (keywords.recurring.includes(cleanInput)) return { action: 'SHOW_WIDGET', payload: { widget: ActiveWidget.RECURRING } };
  if (keywords.plan.includes(cleanInput)) return { action: 'SHOW_WIDGET', payload: { widget: ActiveWidget.PLANNING } };
  if (keywords.rule.includes(cleanInput)) return { action: 'SHOW_WIDGET', payload: { widget: ActiveWidget.RULE_BASED_BUDGET } };
  if (keywords.table.includes(cleanInput)) return { action: 'SHOW_WIDGET', payload: { widget: ActiveWidget.TABLE_BUDGET } };
  if (keywords.debt.includes(cleanInput)) return { action: 'SHOW_WIDGET', payload: { widget: ActiveWidget.DEBT } };
  if (keywords.education.includes(cleanInput)) return { action: 'SHOW_WIDGET', payload: { widget: ActiveWidget.EDUCATION } };
  if (keywords.profile.includes(cleanInput)) return { action: 'SHOW_WIDGET', payload: { widget: ActiveWidget.PROFILE } };
  if (keywords.clear.includes(cleanInput)) return { action: 'SHOW_WIDGET', payload: { widget: ActiveWidget.NONE } };

  // Simulation: "simulate" or "simulate [command]"
  // This needs to be checked early
  const simulateRegex = new RegExp(`^(${keywords.simulate.join('|')})(?:\\s+(.+))?$`, 'i');
  match = input.trim().match(simulateRegex);
  if (match) {
    return { action: 'START_SIMULATION', payload: { command: match[2] } };
  }

  // Alias creation command: "alias [key] [command]"
  const aliasRegex = /^alias\s+(\w+)\s+(.+)$/i;
  match = input.trim().match(aliasRegex);
  if (match) return { action: 'ADD_ALIAS', payload: { key: match[1], command: match[2] } };

  const debtRegex = new RegExp(`^(${keywords.debt_from_for.debt.join('|')})\\s+(${keywords.debt_from_for.from.join('|')})\\s+(.+?)\\s+(\\d+(?:\\.\\d{1,2})?)(?:\\s+(${keywords.debt_from_for.for.join('|')})\\s+(.+))?$`, 'i');
  match = input.trim().match(debtRegex);
  if (match) return { action: 'ADD_DEBT', payload: { type: 'debt', person: match[3], totalAmount: parseFloat(match[4]) } };

  const loanRegex = new RegExp(`^(${keywords.loan_to_for.loan.join('|')})\\s+(${keywords.loan_to_for.to.join('|')})\\s+(.+?)\\s+(\\d+(?:\\.\\d{1,2})?)(?:\\s+(${keywords.loan_to_for.for.join('|')})\\s+(.+))?$`, 'i');
  match = input.trim().match(loanRegex);
  if (match) return { action: 'ADD_DEBT', payload: { type: 'loan', person: match[3], totalAmount: parseFloat(match[4]) } };

  const payDebtRegex = new RegExp(`^(${keywords.pay_to.pay.join('|')})\\s+(\\d+(?:\\.\\d{1,2})?)\\s+(${keywords.pay_to.to.join('|')})\\s+(.+)`, 'i');
  match = input.trim().match(payDebtRegex);
  if (match) return { action: 'RECORD_DEBT_PAYMENT', payload: { amount: parseFloat(match[2]), person: match[4], type: 'payment' } };

  const receiveRepaymentRegex = new RegExp(`^(${keywords.receive_from.receive.join('|')})\\s+(\\d+(?:\\.\\d{1,2})?)\\s+(${keywords.receive_from.from.join('|')})\\s+(.+)`, 'i');
  match = input.trim().match(receiveRepaymentRegex);
  if (match) return { action: 'RECORD_DEBT_PAYMENT', payload: { amount: parseFloat(match[2]), person: match[4], type: 'repayment' } };

  const createListRegex = new RegExp(`^(${keywords.create_list.create.join('|')})\\s+(${keywords.create_list.list.join('|')})\\s+(.+)`, 'i');
  match = input.trim().match(createListRegex);
  if (match) return { action: 'CREATE_SHOPPING_LIST', payload: { name: match[3] } };

  const subCategoryRegex = new RegExp(`^(${keywords.plan_subcategory_for.plan.join('|')})\\s+(${keywords.plan_subcategory_for.subcategory.join('|')})\\s+(.+?)\\s+(\\d+(?:\\.\\d{1,2})?)\\s+(${keywords.plan_subcategory_for.for.join('|')})\\s+(.+)`, 'i');
  match = input.trim().match(subCategoryRegex);
  if (match) return { action: 'ADD_SUB_CATEGORY', payload: { name: match[3], amount: parseFloat(match[4]), category: match[6] } };

  const setRuleRegex = new RegExp(`^(${keywords.set_rule.set.join('|')})\\s+(${keywords.set_rule.rule.join('|')})\\s+(\\d{1,2})\\/(\\d{1,2})\\/(\\d{1,2})`, 'i');
  match = cleanInput.match(setRuleRegex);
  if (match) {
    const [_, __, ___, needs, wants, savings] = match.map(Number);
    if (needs + wants + savings === 100) return { action: 'SET_BUDGETING_RULE', payload: { needs, wants, savings } };
  }

  const planIncomeRegex = new RegExp(`^(${keywords.plan_income.plan.join('|')})\\s+(${keywords.plan_income.income.join('|')})\\s+(\\d+(?:\\.\\d{1,2})?)`, 'i');
  match = input.trim().match(planIncomeRegex);
  if (match) return { action: 'SET_PLANNED_INCOME', payload: { amount: parseFloat(match[3]) } };

  const planSaveRegex = new RegExp(`^(${keywords.plan_save_for.plan.join('|')})\\s+(${keywords.plan_save_for.save.join('|')})\\s+(\\d+(?:\\.\\d{1,2})?)\\s+(${keywords.plan_save_for.for.join('|')})\\s+(.+)`, 'i');
  match = input.trim().match(planSaveRegex);
  if (match) return { action: 'ADD_PLANNED_CONTRIBUTION', payload: { amount: parseFloat(match[3]), goalName: match[5] } };

  const monthlyBudgetRegex = new RegExp(`^(${keywords.monthly_budget.monthly.join('|')})\\s+(${keywords.monthly_budget.budget.join('|')})\\s+(\\w+)\\s+(\\d+(?:\\.\\d{1,2})?)`, 'i');
  match = input.trim().match(monthlyBudgetRegex);
  if (match) {
    const categoryAliasMap: { [key: string]: string } = { food: 'foodAndDining', transportation: 'transport', bills: 'billsAndUtilities', alimentation: 'foodAndDining', factures: 'billsAndUtilities' };
    const categoryInput = match[3].toLowerCase();
    const category = categoryAliasMap[categoryInput] || categoryInput;
    return { action: 'ADD_MONTHLY_BUDGET', payload: { category, limit: parseFloat(match[4]) } };
  }

  const recurringRegex = new RegExp(`^(${keywords.every.every.join('|')})\\s+(${keywords.every.week.join('|')}|${keywords.every.month.join('|')}|${keywords.every.year.join('|')})\\s+(\\d+(?:\\.\\d{1,2})?)\\s+(.+)`, 'i');
  match = input.trim().match(recurringRegex);
  if (match) {
    const freqInput = match[2].toLowerCase();
    const frequency = freqInput === keywords.every.week[0] ? 'weekly' : freqInput === keywords.every.month[0] ? 'monthly' : 'yearly';
    const isIncome = ['salary', 'paycheck', 'salaire'].some(kw => match[4].toLowerCase().includes(kw));
    return { action: 'ADD_RECURRING_TRANSACTION', payload: { amount: parseFloat(match[3]), label: match[4], frequency, type: isIncome ? 'income' : 'expense' } };
  }

  const contributionRegex = new RegExp(`^(${keywords.save_for.save.join('|')})\\s+(\\d+(?:\\.\\d{1,2})?)\\s+(${keywords.save_for.for.join('|')})\\s+(.+)`, 'i');
  match = input.trim().match(contributionRegex);
  if (match) return { action: 'ADD_CONTRIBUTION', payload: { amount: parseFloat(match[2]), goalName: match[4] } };

  const withdrawRegex = new RegExp(`^(${keywords.withdraw_from.withdraw.join('|')})\\s+(\\d+(?:\\.\\d{1,2})?)\\s+(${keywords.withdraw_from.from.join('|')})\\s+(.+)`, 'i');
  match = input.trim().match(withdrawRegex);
  if (match) return { action: 'WITHDRAW_FROM_GOAL', payload: { amount: parseFloat(match[2]), goalName: match[4] } };

  const shoppingRegex = /^\+\s(.+?)\s(\d+(?:\.\d{1,2})?)$/;
  match = input.trim().match(shoppingRegex);
  if (match) return { action: 'ADD_SHOPPING_ITEM', payload: { text: match[1], plannedAmount: parseFloat(match[2]) } };

  const goalRegex = new RegExp(`^(${keywords.goal_by.goal.join('|')})\\s+(?:\"(.*?)\"|(\\S+))\\s+(\\d+(?:\\.\\d{1,2})?)(?:\\s+(${keywords.goal_by.by.join('|')})\\s+(\\d{1,2}\\/\\d{4}|\\d{4}-\\d{2}-\\d{2}))?`, 'i');
  match = input.trim().match(goalRegex);
  if (match) {
    const name = match[2] || match[3];
    const target = parseFloat(match[4]);
    let targetDate;
    if (match[6]) {
      const dateParts = match[6].split(/[\/-]/);
      if (dateParts.length === 2) { // MM/YYYY
        const [month, year] = dateParts.map(Number);
        targetDate = new Date(year, month, 0).toISOString(); // Last day of the month
      } else { // YYYY-MM-DD
        targetDate = new Date(match[6]).toISOString();
      }
    }
    return { action: 'ADD_GOAL', payload: { name, target, targetDate } };
  }

  const escapedIncomeKeywords = keywords.income.in.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const incomeRegex = new RegExp(`^(${escapedIncomeKeywords.join('|')})\\s?(\\d+(?:\\.\\d{1,2})?)\\s+(.+)`, 'i');
  match = input.trim().match(incomeRegex);
  if (match) return { action: 'ADD_TRANSACTION', payload: { type: 'income', amount: parseFloat(match[2]), label: match[3] } };

  const budgetRegex = /^budget\s(.+?)\s(\d+(?:\.\d{1,2})?)/i;
  match = input.trim().match(budgetRegex);
  if (match) return { action: 'ADD_BUDGET', payload: { name: match[1], limit: parseFloat(match[2]), type: 'event' } };

  // Improved Expense Regex to capture math expressions
  // Matches: <amount or math expr> <label>
  // e.g., "10.50 coffee", "10+5 lunch", "5*3 tickets"
  const expenseRegex = /^([\d\+\-\*\/\.\(\)\s]+)\s+(.+)/;
  match = input.trim().match(expenseRegex);
  if (match) {
    const amountPart = match[1];
    const labelPart = match[2];

    // Attempt to evaluate math
    const evaluatedAmount = safeMathEval(amountPart);

    if (!isNaN(evaluatedAmount) && evaluatedAmount > 0) {
      // Regex to capture budget tag including Unicode characters (accents) and hyphens
      const budgetTagRegex = /#([\w\u00C0-\uFFFF-]+)/;
      const budgetMatch = labelPart.match(budgetTagRegex);
      const budgetName = budgetMatch ? budgetMatch[1] : undefined;
      const finalLabel = budgetName ? labelPart.replace(budgetTagRegex, '').trim() : labelPart;
      return { action: 'ADD_TRANSACTION', payload: { type: 'expense', amount: evaluatedAmount, label: budgetName ? `${finalLabel} #${budgetName}` : finalLabel } };
    }
  }

  return await parseWithAI(input);
};
