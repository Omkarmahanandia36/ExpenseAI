"use client";

import React from "react";
import { useFinance } from "@/context/FinanceContext";

export default function ExpensesPage() {
  const { token, expenses, fetchExpenses, handleDeleteExpense } = useFinance();

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
    <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-zinc-100">Expenses Log</h3>
        <button
          onClick={() => token && fetchExpenses(token)}
          className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        {expenses.length === 0 ? (
          <div className="py-16 text-center text-zinc-600 text-sm">No expenses logged. Parse one via chat!</div>
        ) : (
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs text-zinc-500 uppercase border-b border-zinc-800/60 bg-zinc-900/20">
              <tr>
                <th className="py-3.5 px-6">Merchant & Info</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Account</th>
                <th className="py-3.5 px-6">Payment Mode</th>
                <th className="py-3.5 px-6">Source</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="py-4 px-6 font-semibold">
                    <div>
                      <p className="text-zinc-200 font-bold">{e.merchant || "N/A"}</p>
                      <p className="text-xs text-zinc-500">{e.description || "No description"}</p>
                      {e.location && <span className="text-[10px] text-zinc-650 block mt-0.5">📍 {e.location}</span>}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-bold text-emerald-400">{formatAmount(e.amount, e.currency)}</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full">
                      {e.category ? e.category.name : "Miscellaneous"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-zinc-400 text-xs">{e.account ? e.account.name : "Cash"}</td>
                  <td className="py-4 px-6 text-xs capitalize">{e.payment_method.replace("_", " ")}</td>
                  <td className="py-4 px-6 text-xs">{e.created_via}</td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleDeleteExpense(e.id)}
                      className="text-zinc-600 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10"
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
  );
}
