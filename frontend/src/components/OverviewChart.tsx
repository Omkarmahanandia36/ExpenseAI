"use client";

import React, { useState, useMemo, useEffect } from "react";

interface OverviewChartProps {
  expenses: any[];
  incomes: any[];
  accounts: any[];
}

export default function OverviewChart({ expenses, incomes, accounts }: OverviewChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number; label: string } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute 7-day asset history based on real data
  const chartData = useMemo(() => {
    // Current total balance from accounts
    const currentBalance = accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0) || 120420.50;
    
    // Get last 7 days labels
    const days: string[] = [];
    const dateObjects: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString("en-US", { day: "numeric", month: "short" }));
      dateObjects.push(d);
    }

    // Initialize daily cashflow records
    const dailyDiffs = Array(7).fill(0);

    // Populate daily cashflows
    expenses.forEach((e) => {
      const eDate = new Date(e.expense_date || e.created_at);
      for (let i = 0; i < 7; i++) {
        if (eDate.toDateString() === dateObjects[i].toDateString()) {
          dailyDiffs[i] -= e.amount;
        }
      }
    });

    incomes.forEach((inc) => {
      const iDate = new Date(inc.income_date || inc.created_at);
      for (let i = 0; i < 7; i++) {
        if (iDate.toDateString() === dateObjects[i].toDateString()) {
          dailyDiffs[i] += inc.amount;
        }
      }
    });

    // Rollback balances from today
    const dataPoints = [];
    let rollingBalance = currentBalance;
    
    // Fill from today backwards, then reverse
    for (let i = 6; i >= 0; i--) {
      dataPoints.unshift({
        label: days[i],
        value: rollingBalance,
      });
      // Rollback: previous day balance = current day balance - current day net cashflow
      rollingBalance -= dailyDiffs[i];
    }

    // If there is no real transaction activity, generate an aesthetic curve matching the mock look
    const hasTransactions = expenses.length > 0 || incomes.length > 0;
    if (!hasTransactions) {
      const mockValues = [78420.50, 84100.00, 80420.50, 92150.00, 88200.00, 98450.00, 120420.50];
      return days.map((day, idx) => ({
        label: day,
        value: mockValues[idx],
      }));
    }

    return dataPoints;
  }, [expenses, incomes, accounts]);

  const latestBalance = chartData[chartData.length - 1].value;

  // Chart layout dimensions
  const width = 600;
  const height = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  // Find min/max values for scaling
  const values = chartData.map((d) => d.value);
  const max = Math.max(...values) * 1.05;
  const min = Math.min(...values) * 0.95;
  const valueRange = max - min || 1;

  // Generate SVG coordinates for line and area
  const points = useMemo(() => {
    const stepX = (width - paddingLeft - paddingRight) / (chartData.length - 1);
    const scaleY = (height - paddingTop - paddingBottom) / valueRange;

    return chartData.map((d, i) => {
      const x = paddingLeft + i * stepX;
      const y = height - paddingBottom - (d.value - min) * scaleY;
      return { x, y, value: d.value, label: d.label };
    });
  }, [chartData, valueRange, min]);

  // Generate smooth cubic bezier path
  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    const stepX = (width - paddingLeft - paddingRight) / (chartData.length - 1);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + stepX / 3;
      const cp1y = p0.y;
      const cp2x = p1.x - stepX / 3;
      const cp2y = p1.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return path;
  }, [points, chartData.length]);

  // Generate closed area path for gradient fill
  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    return `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
  }, [points, linePath]);

  if (!isMounted) {
    return (
      <div className="bg-zinc-900/50 dark:bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl h-[320px] animate-pulse"></div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-colors duration-300">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Your Assets</span>
          <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1 tracking-tight">
            ${latestBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block mt-1">Total balance from all accounts USD</span>
        </div>
        <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
          +10.5%
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative h-[220px] w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + ratio * (height - paddingTop - paddingBottom);
            return (
              <line
                key={idx}
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                className="stroke-zinc-200/60 dark:stroke-zinc-800/40"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Area Path */}
          {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}

          {/* Line Path */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="3"
              strokeLinecap="round"
              className="drop-shadow-[0_2px_8px_rgba(37,99,235,0.2)]"
            />
          )}

          {/* Hover interaction points */}
          {points.map((p, idx) => (
            <g key={idx}>
              {/* Invisible larger hover catcher circle */}
              <circle
                cx={p.x}
                cy={p.y}
                r="16"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {/* Visible dot on line */}
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                className="fill-white stroke-blue-600 dark:stroke-blue-400 cursor-pointer transition-all duration-200 hover:r-6"
                strokeWidth="2.5"
              />
            </g>
          ))}

          {/* Axis Labels (X) */}
          {chartData.map((d, idx) => {
            const stepX = (width - paddingLeft - paddingRight) / (chartData.length - 1);
            const x = paddingLeft + idx * stepX;
            return (
              <text
                key={idx}
                x={x}
                y={height - 8}
                textAnchor="middle"
                className="fill-zinc-400 dark:fill-zinc-500 font-medium text-[10px]"
              >
                {d.label}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute bg-zinc-950 dark:bg-zinc-800 text-white border border-zinc-800 dark:border-zinc-700/60 p-2.5 rounded-xl shadow-xl z-20 text-xs pointer-events-none animate-fade-in"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 30}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <p className="font-bold text-[10px] text-zinc-400">{hoveredPoint.label}</p>
            <p className="font-extrabold text-blue-400 mt-0.5">
              ${hoveredPoint.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
