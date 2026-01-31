-- Planora Database Schema for Supabase
-- This schema supports all financial data models for the Planora application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & PROFILES
-- ============================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL DEFAULT 'Utilisateur',
  user_avatar TEXT DEFAULT '👤',
  ai_persona TEXT DEFAULT 'benevolent' CHECK (ai_persona IN ('benevolent', 'strict', 'humorous')),
  is_privacy_mode BOOLEAN DEFAULT FALSE,
  
  -- User Profile Intelligence
  financial_method TEXT DEFAULT 'custom',
  risk_tolerance TEXT DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
  learning_style TEXT DEFAULT 'visual' CHECK (learning_style IN ('visual', 'text', 'action')),
  primary_goal TEXT,
  
  -- Metrics
  financial_maturity_score INTEGER DEFAULT 0 CHECK (financial_maturity_score BETWEEN 0 AND 100),
  budget_discipline_score INTEGER DEFAULT 0 CHECK (budget_discipline_score BETWEEN 0 AND 100),
  stability_index INTEGER DEFAULT 0 CHECK (stability_index BETWEEN 0 AND 100),
  monthly_progress INTEGER DEFAULT 0,
  
  -- Inferred data
  stress_level TEXT DEFAULT 'low' CHECK (stress_level IN ('low', 'medium', 'high')),
  educational_level TEXT DEFAULT 'beginner' CHECK (educational_level IN ('beginner', 'intermediate', 'advanced')),
  top_spending_category TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONVERSATIONS (Budgets/Scenarios)
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  category_key TEXT NOT NULL, -- e.g., 'foodAndDining'
  name TEXT NOT NULL,
  bucket TEXT NOT NULL CHECK (bucket IN ('needs', 'wants', 'savings')),
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount DECIMAL(12, 2) NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  category TEXT NOT NULL,
  
  budget_id UUID,
  goal_id UUID,
  receipt_image TEXT, -- Base64 or URL
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_conversation ON public.transactions(conversation_id);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date DESC);

-- ============================================
-- BUDGETS
-- ============================================

CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  limit_amount DECIMAL(12, 2) NOT NULL,
  current_spent DECIMAL(12, 2) DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('event', 'monthly')),
  category TEXT,
  reset_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budgets_conversation ON public.budgets(conversation_id);
CREATE INDEX idx_budgets_user ON public.budgets(user_id);

-- ============================================
-- GOALS
-- ============================================

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  target DECIMAL(12, 2) NOT NULL,
  current_saved DECIMAL(12, 2) DEFAULT 0,
  target_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_conversation ON public.goals(conversation_id);
CREATE INDEX idx_goals_user ON public.goals(user_id);

-- ============================================
-- RECURRING TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  label TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  next_due_date TIMESTAMPTZ NOT NULL,
  budget_id UUID,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recurring_conversation ON public.recurring_transactions(conversation_id);
CREATE INDEX idx_recurring_user ON public.recurring_transactions(user_id);

-- ============================================
-- SHOPPING LISTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shopping_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  
  text TEXT NOT NULL,
  planned_amount DECIMAL(12, 2) NOT NULL,
  actual_amount DECIMAL(12, 2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'purchased')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shopping_items_list ON public.shopping_items(shopping_list_id);

-- ============================================
-- DEBTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('debt', 'loan')),
  person TEXT NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paid')),
  due_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  
  date TIMESTAMPTZ NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_debts_conversation ON public.debts(conversation_id);
CREATE INDEX idx_debts_user ON public.debts(user_id);
CREATE INDEX idx_installments_debt ON public.installments(debt_id);

-- ============================================
-- SUB-CATEGORIES (for budgeting rules)
-- ============================================

CREATE TABLE IF NOT EXISTS public.sub_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  planned_amount DECIMAL(12, 2) NOT NULL,
  category_id TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subcategories_conversation ON public.sub_categories(conversation_id);

-- ============================================
-- MONTHLY REPORTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.monthly_reports (
  id TEXT PRIMARY KEY, -- Format: YYYY-MM
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  
  total_income DECIMAL(12, 2) DEFAULT 0,
  total_expenses DECIMAL(12, 2) DEFAULT 0,
  net_savings DECIMAL(12, 2) DEFAULT 0,
  savings_rate DECIMAL(5, 2) DEFAULT 0,
  
  executive_summary TEXT,
  behavioral_analysis TEXT,
  coaching_tips JSONB, -- Array of tips
  breakdown JSONB, -- Category breakdown
  
  status TEXT DEFAULT 'final',
  
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_conversation ON public.monthly_reports(conversation_id);
CREATE INDEX idx_reports_user ON public.monthly_reports(user_id);

-- ============================================
-- EDUCATION STATE
-- ============================================

CREATE TABLE IF NOT EXISTS public.education_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  read_resource_ids JSONB DEFAULT '[]'::jsonb,
  active_path_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ============================================
-- ALIASES (Command shortcuts)
-- ============================================

CREATE TABLE IF NOT EXISTS public.aliases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  key TEXT NOT NULL,
  command TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, key)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aliases ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Conversations Policies
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Budgets Policies
CREATE POLICY "Users can view own budgets" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budgets" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Goals Policies
CREATE POLICY "Users can view own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

-- Recurring Transactions Policies
CREATE POLICY "Users can view own recurring transactions" ON public.recurring_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recurring transactions" ON public.recurring_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring transactions" ON public.recurring_transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring transactions" ON public.recurring_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Shopping Lists Policies
CREATE POLICY "Users can view own shopping lists" ON public.shopping_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own shopping lists" ON public.shopping_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping lists" ON public.shopping_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping lists" ON public.shopping_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Shopping Items Policies (via shopping list)
CREATE POLICY "Users can view own shopping items" ON public.shopping_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      WHERE shopping_lists.id = shopping_items.shopping_list_id
      AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own shopping items" ON public.shopping_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      WHERE shopping_lists.id = shopping_items.shopping_list_id
      AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own shopping items" ON public.shopping_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      WHERE shopping_lists.id = shopping_items.shopping_list_id
      AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own shopping items" ON public.shopping_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      WHERE shopping_lists.id = shopping_items.shopping_list_id
      AND shopping_lists.user_id = auth.uid()
    )
  );

-- Debts Policies
CREATE POLICY "Users can view own debts" ON public.debts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own debts" ON public.debts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts" ON public.debts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debts" ON public.debts
  FOR DELETE USING (auth.uid() = user_id);

-- Installments Policies (via debt)
CREATE POLICY "Users can view own installments" ON public.installments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.debts
      WHERE debts.id = installments.debt_id
      AND debts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own installments" ON public.installments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.debts
      WHERE debts.id = installments.debt_id
      AND debts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own installments" ON public.installments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.debts
      WHERE debts.id = installments.debt_id
      AND debts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own installments" ON public.installments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.debts
      WHERE debts.id = installments.debt_id
      AND debts.user_id = auth.uid()
    )
  );

-- Sub-categories Policies
CREATE POLICY "Users can view own sub-categories" ON public.sub_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sub-categories" ON public.sub_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sub-categories" ON public.sub_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sub-categories" ON public.sub_categories
  FOR DELETE USING (auth.uid() = user_id);

-- Monthly Reports Policies
CREATE POLICY "Users can view own monthly reports" ON public.monthly_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own monthly reports" ON public.monthly_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly reports" ON public.monthly_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly reports" ON public.monthly_reports
  FOR DELETE USING (auth.uid() = user_id);

-- Categories Policies
CREATE POLICY "Users can view own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- Education Progress Policies
CREATE POLICY "Users can view own education progress" ON public.education_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own education progress" ON public.education_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own education progress" ON public.education_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Aliases Policies
CREATE POLICY "Users can view own aliases" ON public.aliases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own aliases" ON public.aliases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own aliases" ON public.aliases
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_transactions_updated_at BEFORE UPDATE ON public.recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_items_updated_at BEFORE UPDATE ON public.shopping_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON public.debts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_categories_updated_at BEFORE UPDATE ON public.sub_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_progress_updated_at BEFORE UPDATE ON public.education_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA SEED
-- ============================================

-- Insert default categories (global, no user_id)
INSERT INTO public.categories (category_key, name, bucket, is_custom, user_id) VALUES
  ('foodAndDining', 'Food & Dining', 'needs', FALSE, NULL),
  ('transport', 'Transport', 'needs', FALSE, NULL),
  ('shopping', 'Shopping', 'wants', FALSE, NULL),
  ('entertainment', 'Entertainment', 'wants', FALSE, NULL),
  ('billsAndUtilities', 'Bills & Utilities', 'needs', FALSE, NULL),
  ('health', 'Health', 'needs', FALSE, NULL),
  ('income', 'Income', 'wants', FALSE, NULL),
  ('general', 'General', 'wants', FALSE, NULL)
ON CONFLICT DO NOTHING;
