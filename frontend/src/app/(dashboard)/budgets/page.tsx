"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";

export default function BudgetsPage() {
  const {
    budgets,
    categories,
    handleCreateBudget,
    handleDeleteBudget,
  } = useFinance();

  const [budgetForm, setBudgetForm] = useState({
    category_id: "",
    budget_amount: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleCreateBudget(budgetForm);
    if (success) {
      setBudgetForm({
        category_id: "",
        budget_amount: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
    }
  };

  const formatAmount = (amount: number, currency = "INR") => {
    const safeAmount = amount || 0;
    if (currency === "INR") {
      return `₹${safeAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (currency === "USD") {
      return `$${safeAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${safeAmount.toFixed(2)} ${currency}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-zinc-100 mb-6">Setup Category Budget</h3>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">Select Category</label>
            <select
              value={budgetForm.category_id}
              onChange={(e) => setBudgetForm({ ...budgetForm, category_id: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:outline-none"
              required
            >
              <option value="">Choose Category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">Monthly Limit (INR)</label>
            <input
              type="number"
              step="0.01"
              required
              value={budgetForm.budget_amount}
              onChange={(e) => setBudgetForm({ ...budgetForm, budget_amount: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:outline-none"
              placeholder="₹10,000"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] text-sm"
            >
              Save Budget Limit
            </button>
          </div>
        </form>
      </div>

      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl">
        <h3 className="text-base font-bold text-zinc-100 mb-6">Budgets vs Actual Monthly Spending</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((b) => {
            const percent = Math.min((b.spent_amount / b.budget_amount) * 100, 100);
            const isOver = b.spent_amount > b.budget_amount;
            return (
              <div key={b.id} className="p-5 bg-zinc-950/40 border border-zinc-850 rounded-2xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200">{b.category?.name || b.category_id}</h4>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Month: {b.month}/{b.year}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteBudget(b.id)}
                    className="text-xs text-zinc-650 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Spent: <b className="text-zinc-200">{formatAmount(b.spent_amount, "INR")}</b></span>
                    <span className="text-zinc-400">Limit: <b className="text-zinc-200">{formatAmount(b.budget_amount, "INR")}</b></span>
                  </div>
                  
                  <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-rose-500" : percent > 75 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${percent}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500">{percent.toFixed(0)}% consumed</span>
                    {isOver && <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider animate-pulse">Over Budget!</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {budgets.length === 0 && (
            <p className="text-xs text-zinc-600 col-span-2 py-4 text-center">No category budget limits configured.</p>
          )}
        </div>
      </div>
    </div>
  );
}
