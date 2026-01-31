
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import SparklesIcon from '../icons/SparklesIcon';
import SendIcon from '../icons/SendIcon';
import LoaderIcon from '../icons/LoaderIcon';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
  role: 'user' | 'model';
  content: string;
  sources?: { uri: string; title: string }[];
};

const ChatBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isModel = message.role === 'model';
  return (
    <div className={`flex flex-col ${isModel ? 'items-start' : 'items-end'}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`px-4 py-2 rounded-2xl max-w-sm whitespace-pre-wrap text-sm ${
          isModel
            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-none'
            : 'bg-purple-600 text-white rounded-br-none'
        }`}
      >
        {message.content}
      </motion.div>
      {message.sources && message.sources.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800"
          >
              <p className="font-semibold mb-1 uppercase tracking-wider text-[10px]">Sources vérifiées :</p>
              <ul className="space-y-1">
                  {message.sources.map((source, idx) => (
                      <li key={idx}>
                          <a 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline truncate block flex items-center gap-1"
                          >
                              <span className="w-1 h-1 bg-blue-500 rounded-full flex-shrink-0"></span>
                              <span className="truncate">{source.title || new URL(source.uri).hostname}</span>
                          </a>
                      </li>
                  ))}
              </ul>
          </motion.div>
      )}
    </div>
  );
};

const InsightsWidget: React.FC = () => {
  const { transactions, budgets, goals, budgetingRule, monthlyPlan, debts, userName, aiPersona, userProfile } = useFinance();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userInput, setUserInput] = useState('');
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Smart Context Aggregation
  const getAggregatedContext = () => {
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);

      // Monthly aggregation
      const monthlyStats: Record<string, Record<string, number>> = {};
      
      transactions.forEach(tx => {
          const date = new Date(tx.date);
          if (date >= sixMonthsAgo && tx.type === 'expense') {
              const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              if (!monthlyStats[monthKey]) monthlyStats[monthKey] = {};
              const cat = tx.category || 'general';
              monthlyStats[monthKey][cat] = (monthlyStats[monthKey][cat] || 0) + tx.amount;
          }
      });

      return JSON.stringify({
          userProfile: { name: userName, ...userProfile.metrics, ...userProfile.inferred },
          monthlySpendingHistory: monthlyStats,
          recentTransactions: transactions.slice(0, 20).map(tx => ({ 
              amount: tx.amount, 
              label: tx.label, 
              category: tx.category, 
              date: tx.date.split('T')[0],
              type: tx.type
          })),
          activeBudgets: budgets.map(b => ({ name: b.name, limit: b.limit, currentSpent: b.currentSpent, type: b.type })),
          financialGoals: goals.map(g => ({ name: g.name, target: g.target, currentSaved: g.currentSaved, targetDate: g.targetDate })),
          budgetingMethod: budgetingRule ? `Rule: ${budgetingRule.needs}/${budgetingRule.wants}/${budgetingRule.savings}` : "No specific rule set",
          monthlyPlanSummary: monthlyPlan ? { plannedIncome: monthlyPlan.plannedIncome, plannedSavings: monthlyPlan.plannedContributions.reduce((s,c) => s+c.amount, 0) } : null,
          debts: debts.map(d => ({ type: d.type, person: d.person, amount: d.totalAmount, status: d.status }))
      });
  };

  useEffect(() => {
    const initializeChat = async () => {
      let apiKey = '';
      try {
        apiKey = process.env.API_KEY || '';
      } catch (e) {
        console.error("Environment variable access failed");
      }

      if (!apiKey) {
        setError(t('insights.errorApiKey'));
        setIsLoading(false);
        return;
      }

      if (transactions.length < 3) {
        setError(t('insights.notEnoughData'));
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError('');
      
      try {
        const ai = new GoogleGenAI({ apiKey });
        const financialContext = getAggregatedContext();
        
        let toneInstruction = "Benevolent, non-judgmental, reassuring.";
        let forbidden = `"bad", "error", "failure", "wrong"`;
        
        if (aiPersona === 'strict') {
            toneInstruction = "Direct, disciplined, military-style coaching. Focus on discipline and facts. Use short sentences.";
            forbidden = `"excuse", "maybe", "try"`;
        } else if (aiPersona === 'humorous') {
            toneInstruction = "Witty, sarcastic but helpful, fun. Use financial puns and light-hearted jokes to soften the blow of spending.";
            forbidden = ``; 
        }

        const systemInstruction = `
You are Planora's AI Financial Coach & Intelligence Assistant.
Your role is twofold:
1. **Personal Financial Coach**: Analyze data, anticipate risks, propose improvements based on the user's computed profile.
2. **Financial Intelligence Assistant**: Answer educational questions, explain concepts, present neutral market trends.

**CRITICAL BEHAVIORAL PRINCIPLES (MUST FOLLOW):**
- **Tone**: ${toneInstruction}
- **Profile Awareness**: The user has a calculated profile:
    - Maturity: ${userProfile.metrics.financialMaturityScore}/100 (Adapt complexity accordingly).
    - Stress: ${userProfile.inferred.stressLevel} (Be extra gentle if high).
    - Learning Style: ${userProfile.learningStyle} (Visual? Action-oriented?).
- **FORBIDDEN WORDS**: ${forbidden}.
- **Pedagogy**: Explain concepts BEFORE recommending actions.
- **Proactivity**: Only intervene if useful. Max 3 recommendations at a time.
- **Neutrality**: NO specific investment advice (e.g., "buy Tesla stock"). NO financial promises (e.g., "you will be rich").
- **Disclaimer**: If discussing investments/markets, strictly state: "This information is general and does not constitute personal financial advice."

**RESPONSE STRUCTURES (STRICTLY ADHERE TO THESE):**

**A. For Coaching/Recommendations (Analysis):**
1. **Observation**: Clear statement of fact based on user data.
2. **Importance**: Why it matters for their financial health.
3. **Suggestion**: Concrete improvement or adjustment.
4. **Action (Optional)**: A specific step (e.g., "Try creating a budget for dining").

**B. For Educational Answers (Q&A):**
1. **Definition**: Simple explanation of the concept.
2. **Importance**: Why it matters generally.
3. **Example**: Concrete example.
4. **Personal Link**: Connect it to the user's actual data if possible.
5. **Soft Suggestion (Optional)**.

**CONTEXT DATA:**
${financialContext}

**LANGUAGE:**
Respond in ${language === 'fr' ? 'French' : 'English'}.
`;

        chatRef.current = ai.chats.create({ 
            model: 'gemini-3-flash-preview',
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: systemInstruction,
            }
        });

        // Initial proactive analysis "Conseil du jour"
        const initialPrompt = language === 'fr' 
            ? "Analyse brièvement ma situation actuelle et donne-moi un 'Conseil du jour' structuré." 
            : "Briefly analyze my current situation and give me a structured 'Tip of the Day'.";

        const initialResponse = await chatRef.current.sendMessageStream({ message: initialPrompt });
        
        setIsLoading(false);
        setMessages(prev => [...prev, { role: 'model', content: '' }]);

        let fullText = '';
        let sources: { uri: string; title: string }[] = [];

        for await (const chunk of initialResponse) {
          const c = chunk as GenerateContentResponse;
          const newText = c.text || '';
          fullText += newText;
          
          if (c.candidates?.[0]?.groundingMetadata?.groundingChunks) {
              const chunks = c.candidates[0].groundingMetadata.groundingChunks;
              chunks.forEach((gc: any) => {
                  if (gc.web?.uri) {
                      const title = gc.web.title || new URL(gc.web.uri).hostname;
                      if (!sources.some(s => s.uri === gc.web.uri)) {
                          sources.push({ uri: gc.web.uri, title });
                      }
                  }
              });
          }

          setMessages(prev => {
            const updatedMessages = [...prev];
            const lastIdx = updatedMessages.length - 1;
            updatedMessages[lastIdx] = { 
                ...updatedMessages[lastIdx], 
                content: fullText,
                sources: sources.length > 0 ? sources : undefined
            };
            return updatedMessages;
          });
        }
      } catch (err) {
        console.error("Gemini API error:", err);
        setError(t('insights.errorFetching'));
        setIsLoading(false);
      }
    };

    initializeChat();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !chatRef.current || isLoading) return;

    const userMessage: Message = { role: 'user', content: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const responseStream = await chatRef.current.sendMessageStream({ message: userInput });
      setIsLoading(false);
      setMessages(prev => [...prev, { role: 'model', content: '' }]);
      
      let fullText = '';
      let sources: { uri: string; title: string }[] = [];

      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        const newText = c.text || '';
        fullText += newText;

        if (c.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            const chunks = c.candidates[0].groundingMetadata.groundingChunks;
            chunks.forEach((gc: any) => {
                if (gc.web?.uri) {
                    const title = gc.web.title || new URL(gc.web.uri).hostname;
                    if (!sources.some(s => s.uri === gc.web.uri)) {
                        sources.push({ uri: gc.web.uri, title });
                    }
                }
            });
        }

        setMessages(prev => {
            const updatedMessages = [...prev];
            const lastIdx = updatedMessages.length - 1;
            updatedMessages[lastIdx] = { 
                ...updatedMessages[lastIdx], 
                content: fullText,
                sources: sources.length > 0 ? sources : undefined
            };
            return updatedMessages;
        });
      }
    } catch (err) {
        console.error("Gemini API error:", err);
        setError(t('insights.errorFetching'));
        setIsLoading(false);
    }
  };
  
  const renderContent = () => {
    if (transactions.length < 3) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <SparklesIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-2" />
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">{t('insights.notEnoughData')}</p>
        </div>
      );
    }
    
    if (error) {
        return <p className="text-center text-red-500 dark:text-red-400 text-sm p-4">{error}</p>;
    }
    
    if (messages.length === 0 && isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <LoaderIcon className="w-8 h-8 mx-auto animate-spin text-purple-500" />
          <p className="mt-4 text-zinc-500 dark:text-zinc-400 text-sm animate-pulse">{t('insights.loading')}</p>
        </div>
      );
    }

    return (
      <>
        <div className="flex-grow space-y-4 p-4 overflow-y-auto overflow-x-hidden h-64 no-scrollbar">
          <AnimatePresence>
            {messages.map((msg, index) => (
              <ChatBubble key={index} message={msg} />
            ))}
          </AnimatePresence>
          {isLoading && messages.length > 0 && (
            <div className="flex justify-start">
                <span className="px-4 py-2 rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-bl-none text-xs animate-pulse">...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="p-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 rounded-b-lg">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={t('insights.chatPlaceholder')}
            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-zinc-900 dark:text-zinc-100"
          />
          <button type="submit" disabled={isLoading || !userInput.trim()} className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 dark:disabled:bg-purple-800/50 disabled:cursor-not-allowed transition-colors">
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </>
    );
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col h-[28rem] shadow-sm">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 p-4 pb-2 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <SparklesIcon className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
        {t('insights.title')}
      </h3>
      {renderContent()}
    </div>
  );
};

export default InsightsWidget;
