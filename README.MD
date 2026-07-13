<div align="center">

# 💰 ExpenseAI

### Track your money by chatting.

**The AI-powered personal finance assistant that lives in Telegram**

No forms. No dropdowns. No friction — just text what you spent, and let AI handle the rest.

<br>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Telegram Bot](https://img.shields.io/badge/Telegram-Bot%20API-26A5E4?logo=telegram&logoColor=white)](https://core.telegram.org/bots)
![Status](https://img.shields.io/badge/status-MVP%20in%20development-orange)

**[Features](#-core-features) · [Architecture](#-product-architecture) · [Tech Stack](#-technology-stack) · [Roadmap](#-roadmap) · [Contributing](#-contributing)**

⭐ **Star this repo to follow along as ExpenseAI goes from MVP to launch.**

</div>

<br>

---

## 📋 Table of Contents

- [Vision](#-vision)
- [The Problem](#-the-problem)
- [The Solution](#-the-solution)
- [See It In Action](#-see-it-in-action)
- [Target Audience](#-target-audience)
- [Core Features](#-core-features)
- [Technology Stack](#-technology-stack)
- [Product Architecture](#-product-architecture)
- [AI Pipeline](#-ai-pipeline)
- [Database](#-database)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Roadmap](#-roadmap)
- [Design Principles](#-design-principles)
- [Security](#-security)
- [Success Metrics](#-success-metrics)
- [Future Vision](#-future-vision)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Vision

ExpenseAI is an AI-powered SaaS product that lets people manage their personal finances through natural conversation.

Instead of opening an app, filling out a form, picking a category, and manually saving a transaction, users just send a message:

> "Spent $18.50 at Starbucks."

ExpenseAI understands the transaction, categorizes it, stores it securely, updates the dashboard, and surfaces AI-powered financial insights — automatically.

## ❗ The Problem

Traditional expense trackers all fail the same way: **people stop using them.**

The typical workflow looks like this:

1. Open the app
2. Tap "Add Expense"
3. Enter the amount
4. Choose a category
5. Select a payment method
6. Save

Six steps, every single time — for a habit that only sticks if it happens dozens of times a month. Most people give up within a week.

## 💡 The Solution

ExpenseAI combines AI, chat, and analytics into one experience that removes the friction entirely:

| 🐢 Traditional apps | ⚡ ExpenseAI |
|---|---|
| Open app → tap → form → category → save | Send a text message |
| 6+ taps per expense | 1 message |
| Manual categorization | AI-powered auto-categorization |
| Static, backward-looking reports | Conversational, real-time insights |
| Another app to remember to open | Lives inside Telegram, which is already open |

Four pieces make it work together:

- 🤖 **AI** — understands free-form text and extracts structured data
- 💬 **Telegram** — a zero-install interface people already have open
- 📊 **Analytics** — a real dashboard running behind the scenes
- ☁️ **Cloud** — synced, secure, and accessible anywhere

## 💬 See It In Action

A real conversation looks like this:

```
👤 You        Spent $18.50 at Starbucks
🤖 ExpenseAI  ✅ Logged — $18.50 → Food & Drink (Starbucks) · Today

👤 You        Where am I spending too much this month?
🤖 ExpenseAI  📊 Dining is up 34% vs last month — $412 across 19 orders.
              Want me to set a budget alert?

👤 You        Can I save $500 this month?
🤖 ExpenseAI  💡 Cut dining out by half and cancel 2 unused
              subscriptions — that gets you to $540.
```

## 🎯 Target Audience

Built for people who already live in chat apps:

- 💻 Freelancers
- 🌐 Remote workers
- 🎓 Students
- 👨‍💻 Developers
- ✈️ Digital nomads
- 👔 Young professionals
- 💬 Anyone who prefers chat-based workflows over forms

**Primary market:** 🇺🇸 United States

## ⭐ Core Features

### 🤖 AI Expense Logging

Send a message the way you'd text a friend:

- "Spent $18 at Starbucks"
- "Paid $65 for electricity"
- "Uber cost me $24 yesterday"
- "Bought groceries for $120"

ExpenseAI automatically extracts:

| Field | Example |
|---|---|
| Amount | $18.00 |
| Merchant | Starbucks |
| Category | Food & Drink |
| Date | Today / Yesterday / custom |
| Currency | USD |
| Payment Method | Card / Cash / UPI |
| Notes | Free-text context |

### 📱 Telegram Bot

- Natural language expense logging
- Conversational AI chat about your spending
- On-demand reports
- Budget reminders
- Weekly summaries

### 📊 Dashboard

At a glance:

- Total, monthly, and weekly spending
- Budget status
- Expense trends
- Category distribution
- Full spending history
- AI-generated insights

Ask it anything:

- "Where am I spending too much?"
- "How much did I spend on coffee?"
- "Compare this month with last month."
- "Can I save $500?"
- "Predict next month's expenses."

### 📈 Reports

**Generate:** Daily · Weekly · Monthly · Yearly
**Export:** CSV · PDF

### 💰 Budget Tracking

- Monthly budgets
- Budget alerts
- Spending progress bars
- Remaining balance at a glance

## 🔧 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js, TypeScript, Tailwind CSS, shadcn/ui, React Query, Recharts |
| **Backend** | FastAPI, SQLAlchemy, Alembic, Pydantic |
| **Database** | PostgreSQL, Supabase |
| **AI** | Groq API |
| **Bot** | Telegram Bot API via `aiogram` |
| **Auth** | JWT · OAuth *(planned)* |
| **Deployment** | Vercel (frontend) · Railway (backend) · Supabase (database) |

## 🏗 Product Architecture

```mermaid
flowchart TD
    A["Next.js Dashboard"] --> B["REST API"]
    B --> C["FastAPI Backend"]
    C --> D["Telegram Bot"]
    C --> E["AI Engine"]
    C --> F["Dashboard Service"]
    D --> G[("PostgreSQL Database")]
    E --> G
    F --> G
```

The dashboard and Telegram bot both talk to one FastAPI backend, which fans out to the AI engine and shares a single PostgreSQL database — so an expense logged via chat shows up on the dashboard instantly, and vice versa.

## 🧠 AI Pipeline

```mermaid
flowchart TD
    A["User Message"] --> B["Rule-Based Parser"]
    B --> C{"Need AI?"}
    C -->|No| D["Save Expense Directly"]
    C -->|Yes| E["Groq API"]
    E --> F["Structured JSON"]
    F --> G["Validation"]
    G --> H[("Database")]
    D --> H
    H --> I["Dashboard Updated"]
    H --> J["Telegram Reply"]
```

The rule-based parser handles obvious, well-formatted messages instantly. Anything ambiguous gets escalated to Groq for structured extraction — keeping the bot fast *and* affordable at scale.

## 🗄 Database

**Core entities**

| Entity | Purpose |
|---|---|
| Users | Account & profile data |
| Expenses | Individual transactions |
| Categories | Expense classification |
| Budgets | Monthly spending limits |
| AI Conversations | Chat history & context |

**Planned entities:** `Goals` · `Income` · `Notifications` · `Receipts` · `Subscriptions`

## 📁 Project Structure

```
expense-ai/
├── frontend/          # Next.js dashboard
├── backend/           # FastAPI application
├── bot/               # Telegram bot (aiogram)
├── docs/              # Documentation
├── docker/            # Container configs
├── tests/             # Test suites
├── README.md
└── LICENSE
```

## 🏁 Getting Started

Standard local setup for the current stack — adjust scripts as the monorepo takes shape.

**Prerequisites:** Python 3.11+, Node.js 18+, PostgreSQL, a [Telegram bot token](https://core.telegram.org/bots#botfather), and a [Groq API key](https://console.groq.com/).

```bash
# 1. Clone the repo
git clone https://github.com/Omkarmahanandia36/expense-ai.git
cd expense-ai

# 2. Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload

# 3. Telegram bot
cd ../bot
pip install -r requirements.txt
python bot.py

# 4. Frontend
cd ../frontend
npm install
npm run dev
```

**Environment variables** (`.env`):

```env
DATABASE_URL=postgresql://user:password@localhost:5432/expenseai
GROQ_API_KEY=your_groq_api_key
TELEGRAM_BOT_TOKEN=your_bot_token
JWT_SECRET=your_jwt_secret
```

## 🛣 Roadmap

### MVP — *current focus*
- [ ] User Authentication
- [ ] Telegram Bot
- [ ] AI Expense Logging
- [ ] Dashboard
- [ ] Expense CRUD
- [ ] Charts
- [ ] Reports
- [ ] Budget Tracking
- [ ] AI Insights

### v1.0
- [ ] Receipt OCR
- [ ] Voice Logging
- [ ] Smart Search
- [ ] Spending Goals
- [ ] Notifications

### v2.0
- [ ] Income Tracking
- [ ] Savings Tracking
- [ ] Net Worth
- [ ] Subscription Detection
- [ ] Recurring Expenses
- [ ] Calendar View

### v3.0
- [ ] Family Accounts
- [ ] Business Accounts
- [ ] Teams
- [ ] Browser Extension
- [ ] Mobile Apps
- [ ] AI Forecasting

## 🎨 Design Principles

- Simplicity first
- AI only when needed
- Privacy by design
- Fast response time
- Clean user experience
- Mobile friendly
- API first
- Scalable architecture

## 🔐 Security

- JWT authentication
- Password hashing
- HTTPS everywhere
- Rate limiting
- Input validation
- Secure secrets management
- Database encryption (where supported)

## 📊 Success Metrics

Metrics we'll track post-launch:

- Daily & Weekly Active Users
- Expenses logged
- AI extraction accuracy
- User retention
- Average session time
- Dashboard visits

## 🔮 Future Vision

ExpenseAI is designed to evolve beyond an expense tracker into a full financial companion:

- AI Financial Coach
- Smart Budget Planner
- Investment Tracking
- Goal Planning
- Subscription Management
- Shared Family Accounts
- Business Expense Management
- Mobile Applications
- Public API

## 🤝 Contributing

Contributions are welcome! Please open an issue before submitting major changes so the approach can be discussed first.

## 📄 License

Licensed under the [MIT License](LICENSE).

---

<div align="center">

**ExpenseAI** — Track your money by chatting.

Built with ❤️ using FastAPI, Next.js, Telegram Bot API, and Groq.

[GitHub](https://github.com/Omkarmahanandia36) · [Email](mailto:omkarmahanandia@gmail.com)

</div>
