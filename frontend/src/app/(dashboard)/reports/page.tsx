"use client";

import React from "react";
import { useFinance } from "@/context/FinanceContext";

export default function ReportsPage() {
  const { reports, isLoadingReports } = useFinance();

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
      {isLoadingReports || !reports ? (
        <div className="py-24 text-center text-zinc-500 text-sm">Calculating reports...</div>
      ) : (
        <>
          {/* Reports Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/80">
              <span className="text-xs font-semibold text-zinc-500 uppercase">Cash Flow Surplus</span>
              <p className="text-2xl font-extrabold text-teal-400 mt-2">{formatAmount(reports.cash_flow.net_savings, "INR")}</p>
            </div>
            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/80">
              <span className="text-xs font-semibold text-zinc-500 uppercase">Savings Rate</span>
              <p className="text-2xl font-extrabold text-indigo-400 mt-2">{reports.cash_flow.savings_rate.toFixed(1)}%</p>
            </div>
            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/80">
              <span className="text-xs font-semibold text-zinc-500 uppercase">Total Income</span>
              <p className="text-2xl font-bold text-zinc-200 mt-2">{formatAmount(reports.cash_flow.total_income, "INR")}</p>
            </div>
            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/80">
              <span className="text-xs font-semibold text-zinc-500 uppercase">Total Expenses</span>
              <p className="text-2xl font-bold text-zinc-200 mt-2">{formatAmount(reports.cash_flow.total_expense, "INR")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category Spending Breakdown */}
            <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/80">
              <h3 className="text-sm font-bold text-zinc-200 mb-6">Spending by Category</h3>
              {reports.category_breakdown.length === 0 ? (
                <p className="text-xs text-zinc-650 text-center py-6">No records found.</p>
              ) : (
                <div className="space-y-4">
                  {reports.category_breakdown.map((row: any) => {
                    const percent = reports.cash_flow.total_expense > 0 
                      ? (row.total / reports.cash_flow.total_expense) * 100 
                      : 0;
                    return (
                      <div key={row.name} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-300 flex items-center gap-1.5">
                            <span>{row.icon}</span>
                            <span>{row.name}</span>
                          </span>
                          <span className="text-zinc-400 font-medium">
                            {formatAmount(row.total, "INR")} ({percent.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: row.color }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/80">
              <h3 className="text-sm font-bold text-zinc-200 mb-6">Spending by Payment Method</h3>
              <div className="space-y-3">
                {reports.payment_breakdown.map((row: any) => (
                  <div key={row.method} className="flex justify-between items-center p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl">
                    <span className="text-xs font-semibold capitalize text-zinc-300">{row.method.replace("_", " ")}</span>
                    <span className="text-xs font-extrabold text-indigo-400">{formatAmount(row.total, "INR")}</span>
                  </div>
                ))}
                {reports.payment_breakdown.length === 0 && (
                  <p className="text-xs text-zinc-650 text-center py-4">No transactions logged.</p>
                )}
              </div>
            </div>

            {/* Top Merchants */}
            <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/80">
              <h3 className="text-sm font-bold text-zinc-200 mb-6">Top Merchants</h3>
              <div className="space-y-3">
                {reports.top_merchants.map((row: any) => (
                  <div key={row.merchant} className="flex justify-between items-center p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl">
                    <span className="text-xs font-semibold text-zinc-300">{row.merchant}</span>
                    <span className="text-xs font-extrabold text-emerald-400">{formatAmount(row.total, "INR")}</span>
                  </div>
                ))}
                {reports.top_merchants.length === 0 && (
                  <p className="text-xs text-zinc-650 text-center py-4">No merchant statistics found.</p>
                )}
              </div>
            </div>

            {/* Daily spending trends */}
            <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/80 flex flex-col">
              <h3 className="text-sm font-bold text-zinc-200 mb-4">Daily Spending (Last 30 Days)</h3>
              <div className="flex-1 flex items-end gap-1 h-36 border-b border-l border-zinc-800 p-2">
                {reports.daily_trend.map((day: any) => {
                  const maxVal = Math.max(...reports.daily_trend.map((d: any) => d.amount)) || 1;
                  const heightPercent = (day.amount / maxVal) * 100;
                  return (
                    <div
                      key={day.date}
                      className="flex-1 bg-gradient-to-t from-emerald-500/80 to-teal-400 rounded-t-sm hover:from-emerald-400 group relative cursor-pointer"
                      style={{ height: `${Math.max(heightPercent, 2)}%` }}
                    >
                      {/* Hover tooltip */}
                      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-200 p-1.5 rounded shadow-lg whitespace-nowrap z-20">
                        <p className="font-bold">{day.date}</p>
                        <p className="text-emerald-400 font-extrabold">{formatAmount(day.amount, "INR")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 mt-2">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
