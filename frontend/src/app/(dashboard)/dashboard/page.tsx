"use client";

import React from "react";
import { useFinance } from "@/context/FinanceContext";

export default function DashboardPage() {
  const {
    expenses,
    incomes,
    accounts,
    budgets,
    chatInput,
    setChatInput,
    isChatLoading,
    lastParsedExpense,
    chatError,
    handleParseExpense,
  } = useFinance();

  // Helper formats
  const formatAmount = (amount: number, currency: string) => {
    const safeAmount = amount || 0;
    if (currency === "INR") {
      return `₹${safeAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (currency === "USD") {
      return `$${safeAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${safeAmount.toFixed(2)} ${currency}`;
  };

  const getTotalExpensesINR = () => {
    return expenses
      .filter((e) => e.currency === "INR")
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const getTotalIncomeINR = () => {
    return incomes
      .filter((i) => i.currency === "INR")
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const getNetBalanceINR = () => {
    return getTotalIncomeINR() - getTotalExpensesINR();
  };

  const onParseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleParseExpense(chatInput);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Quick stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-colors duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Spending (INR)</span>
          <p className="text-3xl font-extrabold text-emerald-400 tracking-tight mt-2">{formatAmount(getTotalExpensesINR(), "INR")}</p>
          <div className="text-[10px] text-zinc-500 mt-2">Parsed from bot chats & SMS</div>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/40 transition-colors duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Income (INR)</span>
          <p className="text-3xl font-extrabold text-indigo-400 tracking-tight mt-2">{formatAmount(getTotalIncomeINR(), "INR")}</p>
          <div className="text-[10px] text-zinc-500 mt-2">Salary, Freelance, Dividends</div>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition-colors duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Net Balance (INR)</span>
          <p className={`text-3xl font-extrabold tracking-tight mt-2 ${getNetBalanceINR() >= 0 ? "text-teal-400" : "text-rose-400"}`}>
            {formatAmount(getNetBalanceINR(), "INR")}
          </p>
          <div className="text-[10px] text-zinc-500 mt-2">Cash Flow Surplus/Deficit</div>
        </div>
      </div>

      {/* AI conversational logging engine box */}
      <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-950 border border-zinc-800/85 p-6 md:p-8 rounded-2xl relative">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-2xl">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            AI Expense Logger Chatbot
          </h3>
          <p className="text-xs text-zinc-400 mt-1 mb-6">
            Log transactions instantly. Try sending things like: 
            <code className="text-emerald-400 bg-zinc-900/80 px-2 py-0.5 rounded ml-1 border border-zinc-800 font-mono">"Spent ₹150 for auto ride today in Chandigarh"</code> or 
            <code className="text-indigo-400 bg-zinc-900/80 px-2 py-0.5 rounded ml-1 border border-zinc-800 font-mono">"Rs.15000 paid for monthly rent from SBI Savings"</code>
          </p>

          <form onSubmit={onParseSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isChatLoading}
              className="flex-1 bg-zinc-950 border border-zinc-850 hover:border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all rounded-xl px-5 py-3.5 text-sm text-zinc-200 focus:outline-none"
              placeholder="SBI debited Rs 180 at Zomato today at 1:45 PM..."
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="sm:w-36 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {isChatLoading ? "Parsing..." : "Parse & Log"}
            </button>
          </form>

          {chatError && <p className="text-red-400 text-xs mt-3.5">{chatError}</p>}

          {lastParsedExpense && (
            <div className="mt-6 p-5 bg-zinc-950/80 border border-emerald-500/30 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/25 border-l border-b border-emerald-500/30 text-[10px] font-bold text-emerald-400 rounded-bl-lg uppercase tracking-wide">
                AI Categorized
              </div>
              <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5 mb-3 text-emerald-400">
                Logged Transaction Successfully!
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Category</span>
                  <span className="text-xs font-bold text-zinc-300 truncate block">{lastParsedExpense.category ? lastParsedExpense.category.name : "Miscellaneous"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Amount</span>
                  <span className="text-xs font-extrabold text-emerald-400 block">{formatAmount(lastParsedExpense.amount, lastParsedExpense.currency)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Account</span>
                  <span className="text-xs font-bold text-zinc-300 truncate block">{lastParsedExpense.account ? lastParsedExpense.account.name : "Cash"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Merchant</span>
                  <span className="text-xs font-bold text-zinc-300 truncate block">{lastParsedExpense.merchant || "N/A"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick overview grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-zinc-300 mb-4">Bank Accounts Summary</h3>
          <div className="space-y-3">
            {accounts.slice(0, 3).map((a) => (
              <div key={a.id} className="flex justify-between items-center p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl">
                <span className="text-xs font-semibold text-zinc-300">{a.name} ({a.type})</span>
                <span className="text-xs font-extrabold text-emerald-400">{formatAmount(a.balance, "INR")}</span>
              </div>
            ))}
            {accounts.length === 0 && <p className="text-xs text-zinc-650">No accounts registered yet.</p>}
          </div>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-zinc-300 mb-4">Current Budgets Status</h3>
          <div className="space-y-4">
            {budgets.slice(0, 2).map((b) => {
              const percent = Math.min((b.spent_amount / b.budget_amount) * 100, 100);
              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-semibold">{b.category_id}</span>
                    <span className="text-zinc-400">{formatAmount(b.spent_amount, "INR")} / {formatAmount(b.budget_amount, "INR")}</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${percent > 90 ? "bg-rose-500" : percent > 75 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
            {budgets.length === 0 && <p className="text-xs text-zinc-650">No category budgets set for this month.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
