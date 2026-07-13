# Product Requirements Document (PRD) - ExpenseAI MVP

## 1. Executive Summary
* **Product Name**: ExpenseAI
* **Tagline**: Track your money by chatting.
* **Mission**: An AI-powered personal finance SaaS enabling users to log expenses naturally through Telegram while managing and analyzing their finances from a modern web dashboard.

---

## 2. Vision & Problem Statement
* **Vision**: Become the easiest and most intelligent personal finance assistant by replacing manual expense entry with conversational AI.
* **Problem**: Traditional expense trackers suffer from low retention because opening apps, filling forms, selecting categories, and saving are tedious.
* **Solution**: Enable natural language logging: "Spent $18 at Starbucks yesterday" logs the merchant, category, amount, currency, and date instantly.

---

## 3. Core Features & Scope
* **Website Authentication**: Secure register, login, session management (JWT & refresh tokens).
* **Telegram Integration**: Secure account linking (Telegram accounts owned by website users), `/start`, `/help`, `/stats`, `/report`, `/settings` commands.
* **Expense CRUD**: Add, edit, delete, search, and filter expenses with soft deletion.
* **Category Management**: System default categories and custom user-defined categories with icons/colors.
* **Budgets**: Monthly budgets with cached spending totals to optimize reads.
* **AI Parser Pipeline**: Rule-based parsing first, falling back to Groq API for structured extraction, saving raw messages for retry/audit.
* **Web Dashboard**: Overview, expenses history, budgets status, reports (PDF/CSV export), and AI chat assistant.

---

## 4. Technical Stack
* **Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn/ui, React Query, Recharts.
* **Backend**: FastAPI, SQLAlchemy, Alembic, Pydantic, PostgreSQL.
* **Bot**: Telegram Bot API via `aiogram`.
* **AI**: Groq API (or equivalent fallback provider).
