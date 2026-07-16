"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";

export default function AccountsPage() {
  const {
    accounts,
    handleCreateAccount,
    handleDeleteAccount,
  } = useFinance();

  const [accountForm, setAccountForm] = useState({
    name: "",
    type: "savings",
    balance: "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleCreateAccount(accountForm);
    if (success) {
      setAccountForm({
        name: "",
        type: "savings",
        balance: "",
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
        <h3 className="text-lg font-bold text-zinc-100 mb-6">Create Bank Account / Wallet</h3>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">Account Name</label>
            <input
              type="text"
              required
              value={accountForm.name}
              onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:outline-none"
              placeholder="e.g. SBI Savings, HDFC Card"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">Account Type</label>
            <select
              value={accountForm.type}
              onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:outline-none"
            >
              {["savings", "credit_card", "wallet", "cash", "other"].map((type) => (
                <option key={type} value={type}>{type.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">Starting Balance (INR)</label>
            <input
              type="number"
              step="0.01"
              required
              value={accountForm.balance}
              onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:outline-none"
              placeholder="₹0.00"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              className="py-3 px-8 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] text-sm"
            >
              Register Account
            </button>
          </div>
        </form>
      </div>

      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl">
        <h3 className="text-base font-bold text-zinc-100 mb-4">Active Accounts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accounts.map((a) => (
            <div key={a.id} className="p-5 bg-zinc-950/40 border border-zinc-850 rounded-2xl flex flex-col justify-between hover:border-emerald-500/20 transition-all duration-300">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-md font-bold uppercase">{a.type}</span>
                  <button
                    onClick={() => handleDeleteAccount(a.id)}
                    className="text-xs text-zinc-650 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
                <h4 className="text-base font-bold text-zinc-200">{a.name}</h4>
              </div>
              <div className="mt-6 border-t border-zinc-900 pt-4 flex justify-between items-center">
                <span className="text-xs text-zinc-500">Live Balance</span>
                <span className="text-lg font-extrabold text-emerald-400">{formatAmount(a.balance, "INR")}</span>
              </div>
            </div>
          ))}
          {accounts.length === 0 && (
            <p className="text-xs text-zinc-650 col-span-3 py-4 text-center">No active accounts configured yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
