"use client";

import React, { useState, useMemo, useEffect } from "react";

interface BudgetPieChartProps {
  budgets: any[];
}

export default function BudgetPieChart({ budgets }: BudgetPieChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Format currency helpers
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

  // Group budgets by category name
  const budgetData = useMemo(() => {
    const map: { [key: string]: { name: string; amount: number; color: string; icon: string } } = {};
    let total = 0;
    budgets.forEach((b) => {
      const catName = b.category?.name || "Miscellaneous";
      const catColor = b.category?.color || "#808080";
      const catIcon = b.category?.icon || "📦";
      if (!map[catName]) {
        map[catName] = { name: catName, amount: 0, color: catColor, icon: catIcon };
      }
      map[catName].amount += b.budget_amount;
      total += b.budget_amount;
    });

    const items = Object.values(map).sort((a, b) => b.amount - a.amount);
    return { items, total };
  }, [budgets]);

  const hasBudgets = budgets.length > 0;

  // Use real data or premium mock data if no budgets exist yet
  const displayData = useMemo(() => {
    if (!hasBudgets) {
      const mockItems = [
        { name: "Housing", amount: 15000, color: "#3357FF", icon: "🏠" },
        { name: "Food & Dining", amount: 10000, color: "#FF5733", icon: "🍽️" },
        { name: "Transportation", amount: 5000, color: "#33FF57", icon: "🚗" },
        { name: "Shopping", amount: 4000, color: "#FF33F3", icon: "🛒" },
        { name: "Entertainment", amount: 3000, color: "#33FF99", icon: "🎉" },
      ];
      const total = mockItems.reduce((sum, item) => sum + item.amount, 0);
      return { items: mockItems, total };
    }
    return budgetData;
  }, [hasBudgets, budgetData]);

  // Radius, circumference, and offsets
  const r = 70;
  const circumference = 2 * Math.PI * r;

  // Calculate cumulative percentages for correct segment positioning (rotation)
  const cumulativePercents = useMemo(() => {
    let sum = 0;
    const arr = [0];
    for (let i = 0; i < displayData.items.length - 1; i++) {
      sum += displayData.items[i].amount / displayData.total;
      arr.push(sum);
    }
    return arr;
  }, [displayData]);

  if (!isMounted) {
    return (
      <div className="bg-zinc-900/50 dark:bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl h-[320px] animate-pulse"></div>
    );
  }

  // Hovered item details
  const activeItem = hoveredIdx !== null ? displayData.items[hoveredIdx] : null;
  const activePercent = activeItem ? (activeItem.amount / displayData.total) * 100 : 0;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-colors duration-300 flex flex-col h-full justify-between">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {hasBudgets ? "Budget Allocation" : "Budget Allocation (Demo)"}
            </span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              Limits by Category
            </h3>
          </div>
        </div>

        {/* Donut and Center Text */}
        <div className="flex justify-center items-center my-6 relative">
          <svg width="180" height="180" viewBox="0 0 200 200" className="transform rotate-0 overflow-visible">
            {displayData.items.map((item, idx) => {
              const percent = item.amount / displayData.total;
              const strokeLength = percent * circumference;
              const rotation = -90 + cumulativePercents[idx] * 360;
              const isHovered = hoveredIdx === idx;

              return (
                <circle
                  key={item.name}
                  cx="100"
                  cy="100"
                  r={70} // Keep radius constant so segment length is proportional to budget limit
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isHovered ? 24 : 18}
                  strokeDasharray={`${strokeLength} ${circumference}`}
                  strokeDashoffset={0}
                  transform={`rotate(${rotation} 100 100)`}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Absolute Center Label */}
          <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none text-center p-4">
            {activeItem ? (
              <>
                <span className="text-[18px] mb-0.5">{activeItem.icon}</span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider truncate max-w-[110px]">
                  {activeItem.name}
                </span>
                <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {formatAmount(activeItem.amount, "INR")}
                </span>
                <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full mt-1">
                  {activePercent.toFixed(1)}%
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Total Budget
                </span>
                <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
                  {formatAmount(displayData.total, "INR")}
                </span>
                <span className="text-[9px] text-zinc-500 mt-1">
                  {displayData.items.length} Categories
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Legend */}
      <div className="space-y-2 mt-4 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
        {displayData.items.map((item, idx) => {
          const isHovered = hoveredIdx === idx;
          const percent = (item.amount / displayData.total) * 100;
          return (
            <div
              key={item.name}
              className={`flex justify-between items-center p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                isHovered ? "bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/40" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40 border border-transparent"
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0"
                  style={{ backgroundColor: `${item.color}15`, color: item.color, border: `1px solid ${item.color}30` }}
                >
                  {item.icon}
                </span>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                  {item.name}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 block">
                  {formatAmount(item.amount, "INR")}
                </span>
                <span className="text-[10px] text-zinc-500 block">
                  {percent.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
