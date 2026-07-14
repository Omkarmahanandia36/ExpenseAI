"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";

export default function IncomesPage() {
  const {
    accounts,
    incomes,
    handleCreateIncome,
    handleDeleteIncome,
  } = useFinance();

  const [incomeForm, setIncomeForm] = useState({
    amount: "",
    currency: "INR",
    category: "Salary",
    account_id: "",
    description: "",
    income_date: new Date().toISOString().split("T")[0],
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleCreateIncome(incomeForm);
    if (success) {
      setIncomeForm({
        amount: "",
        currency: "INR",
        category: "Salary",
        account_id: "",
        description: "",
        income_date: new Date().toISOString().split("T")[0],
      });
    }
  };

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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-zinc-100 mb-6">Log New Income Transaction</h3>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">Amount</label>
            <input
              type="number"
              step="0.01"
              required
              value={incomeForm.amount}
              onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:outline-none"
              placeholder="₹50,000"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">Income Category</label>
            <select
              value={incomeForm.category}
              onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:outline-none"
            >
              {["Salary", "Freelancing", "Business Income", "Rental Income", "Dividends", "Interest", "Cashback", "Refunds", "Gifts Received", "Investments", "Bonus", "Scholarship", "Pension", "Other Income"].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">Account Deposited</label>
            <select
              value={incomeForm.account_id}
              onChange={(e) => setIncomeForm({ ...incomeForm, account_id: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:outline-none"
            >
              <option value="">Cash (No Account)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name} ({formatAmount(acc.balance, "INR")})</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-zinc-400 mb-2">Description</label>
            <input
              type="text"
              value={incomeForm.description}
              onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:outline-none"
              placeholder="Monthly paycheck deposition..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">Income Date</label>
            <input
              type="date"
              required
              value={incomeForm.income_date}
              onChange={(e) => setIncomeForm({ ...incomeForm, income_date: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:outline-none"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              className="py-3 px-8 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] text-sm"
            >
              Add Income Log
            </button>
          </div>
        </form>
      </div>

      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl">
        <h3 className="text-base font-bold text-zinc-100 mb-4">Income History Logs</h3>
        <div className="overflow-x-auto">
          {incomes.length === 0 ? (
            <p className="text-zinc-600 text-xs py-4 text-center">No income logs created yet.</p>
          ) : (
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="text-xs text-zinc-500 uppercase border-b border-zinc-800/60 bg-zinc-900/20">
                <tr>
                  <th className="py-3.5 px-6">Income Source / Category</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Deposited Account</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {incomes.map((inc) => (
                  <tr key={inc.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4 px-6 font-semibold">
                      <div>
                        <p className="text-zinc-200 font-bold">{inc.category}</p>
                        <p className="text-xs text-zinc-500">{inc.description || "No description"}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-indigo-400">{formatAmount(inc.amount, inc.currency)}</td>
                    <td className="py-4 px-6 text-xs text-zinc-400">{inc.account ? inc.account.name : "Cash"}</td>
                    <td className="py-4 px-6 text-xs text-zinc-500">{inc.income_date}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDeleteIncome(inc.id)}
                        className="text-zinc-650 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
