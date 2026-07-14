-- ExpenseAI Database Schema (MVP v1.0)
-- Target Database: PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Custom Types (Enums)
-- ==========================================

CREATE TYPE account_status_type AS ENUM (
    'active',
    'suspended',
    'deleted'
);

CREATE TYPE theme_type AS ENUM (
    'light',
    'dark',
    'system'
);

CREATE TYPE payment_method_type AS ENUM (
    'cash',
    'debit_card',
    'credit_card',
    'bank_transfer',
    'upi',
    'paypal',
    'apple_pay',
    'google_pay',
    'other'
);

CREATE TYPE created_via_type AS ENUM (
    'telegram',
    'website',
    'receipt',
    'voice',
    'api'
);

CREATE TYPE ai_status_type AS ENUM (
    'pending',
    'parsed',
    'failed',
    'manual_review'
);

-- ==========================================
-- 2. Tables
-- ==========================================

-- 1️⃣ users (Master Table)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    profile_picture TEXT,
    account_status account_status_type DEFAULT 'active' NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2️⃣ telegram_accounts
CREATE TABLE telegram_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    telegram_user_id BIGINT UNIQUE NOT NULL,
    telegram_username VARCHAR(255),
    telegram_first_name VARCHAR(255),
    telegram_last_name VARCHAR(255),
    chat_id BIGINT NOT NULL,
    bot_started BOOLEAN DEFAULT FALSE NOT NULL,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 3️⃣ user_sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(100),
    ip_address INET,
    refresh_token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 🔟 discord_accounts
CREATE TABLE discord_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    discord_user_id VARCHAR(100) UNIQUE NOT NULL,
    discord_username VARCHAR(255),
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 11️⃣ slack_accounts
CREATE TABLE slack_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slack_user_id VARCHAR(100) UNIQUE NOT NULL,
    slack_team_id VARCHAR(100) NOT NULL,
    slack_username VARCHAR(255),
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 12️⃣ link_tokens
CREATE TABLE link_tokens (
    token VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);


-- 4️⃣ user_settings
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(5) DEFAULT 'USD' NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL,
    language VARCHAR(20) DEFAULT 'en' NOT NULL,
    theme theme_type DEFAULT 'system' NOT NULL,
    weekly_report BOOLEAN DEFAULT TRUE NOT NULL,
    monthly_report BOOLEAN DEFAULT TRUE NOT NULL,
    budget_alerts BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5️⃣ categories (Default categories have user_id = NULL)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(10),
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6️⃣ expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(5) DEFAULT 'USD' NOT NULL,
    merchant VARCHAR(255),
    description TEXT,
    payment_method payment_method_type DEFAULT 'cash' NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_via created_via_type DEFAULT 'website' NOT NULL,
    ai_confidence DECIMAL(3,2) CHECK (ai_confidence BETWEEN 0.00 AND 1.00),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL -- Soft Delete
);

-- 7️⃣ budgets
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    budget_amount DECIMAL(10,2) NOT NULL,
    spent_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL, -- Cached spending
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(user_id, category_id, month, year)
);

-- 8️⃣ ai_chat_history
CREATE TABLE ai_chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    response TEXT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    tokens_used INT,
    response_time_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 9️⃣ expense_raw_messages
CREATE TABLE expense_raw_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source created_via_type DEFAULT 'telegram' NOT NULL,
    raw_message TEXT NOT NULL,
    parsed_json JSONB,
    status ai_status_type DEFAULT 'pending' NOT NULL,
    processing_time INT, -- in ms
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==========================================
-- 3. Indexes for Optimized Performance
-- ==========================================

-- users Indexes
CREATE INDEX idx_users_email ON users(email);

-- telegram_accounts Indexes
CREATE INDEX idx_telegram_user_id ON telegram_accounts(telegram_user_id);
CREATE INDEX idx_telegram_chat_id ON telegram_accounts(chat_id);

-- expenses Indexes
CREATE INDEX idx_expenses_user_id ON expenses(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_category_id ON expenses(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_merchant ON expenses(merchant) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_created_at ON expenses(created_at) WHERE deleted_at IS NULL;

-- budgets Indexes
CREATE INDEX idx_budgets_user_year_month ON budgets(user_id, year, month);

-- user_sessions Indexes
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

-- discord_accounts Indexes
CREATE INDEX idx_discord_user_id ON discord_accounts(discord_user_id);

-- slack_accounts Indexes
CREATE INDEX idx_slack_user_id ON slack_accounts(slack_user_id);

-- link_tokens Indexes
CREATE INDEX idx_link_tokens_token ON link_tokens(token);

-- expense_raw_messages Indexes
CREATE INDEX idx_expense_raw_messages_user_id_status ON expense_raw_messages(user_id, status);

-- ==========================================
-- 4. Triggers to Automate updated_at
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
