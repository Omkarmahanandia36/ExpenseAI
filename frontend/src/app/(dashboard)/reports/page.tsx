"use client";

import React from "react";
import { useFinance } from "@/context/FinanceContext";

export default function ReportsPage() {
  const { reports, isLoadingReports, expenses } = useFinance();

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

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "WARNING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "OPPORTUNITY":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "OPTIMIZATION":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const getMerchantCategory = (merchantName: string) => {
    const match = expenses.find(
      (e) => !e.deleted_at && e.merchant?.toLowerCase() === merchantName.toLowerCase()
    );
    return match?.category?.name || "Miscellaneous";
  };

  const getMerchantRecommendation = (merchant: string, total: number) => {
    const category = getMerchantCategory(merchant);
    const merchantLower = merchant.toLowerCase();
    const catLower = category.toLowerCase();
    const percent = reports ? ((total / reports.cash_flow.total_expense) * 100) : 0;
    
    const isSubscription = 
      merchantLower.includes("premium") || 
      merchantLower.includes("netflix") || 
      merchantLower.includes("spotify") || 
      merchantLower.includes("youtube") || 
      merchantLower.includes("prime") || 
      merchantLower.includes("icloud") || 
      merchantLower.includes("google one") ||
      catLower.includes("subscription") || 
      catLower.includes("utilities");
      
    if (isSubscription) {
      return {
        title: `Subscription Focus: ${merchant}`,
        desc: `Outflow to recurring subscription provider, ${merchant}, accounts for ${percent.toFixed(0)}% of all spending (${formatAmount(total, "INR")}). Fixed costs silently drain liquid capital over time.`,
        action: "Audit unused features, consolidate family bundles, or cancel underutilized tiers."
      };
    }
    
    if (
      catLower.includes("food") || 
      catLower.includes("dining") || 
      catLower.includes("restaurant") || 
      merchantLower.includes("starbucks") || 
      merchantLower.includes("zomato") || 
      merchantLower.includes("swiggy") ||
      merchantLower.includes("mcdonald")
    ) {
      return {
        title: `Dining Outlay Focus: ${merchant}`,
        desc: `Outflow to food vendor, ${merchant}, accounts for ${percent.toFixed(0)}% of total monthly outlays (${formatAmount(total, "INR")}). Convenience dining aggregates quickly into major leakage.`,
        action: "Transition 30% of dining expenditures to home prep or establish a strict weekly cap."
      };
    }
    
    if (
      catLower.includes("shopping") || 
      catLower.includes("retail") || 
      merchantLower.includes("amazon") || 
      merchantLower.includes("flipkart") || 
      merchantLower.includes("walmart") ||
      merchantLower.includes("target")
    ) {
      return {
        title: `Retail Spend Focus: ${merchant}`,
        desc: `Discretionary spending at retail channel, ${merchant}, accounts for ${percent.toFixed(0)}% of total spending (${formatAmount(total, "INR")}). Shopping patterns indicate impulse exposure.`,
        action: "Implement a 48-hour cool-off period before completing checkout on retail sites."
      };
    }
    
    if (
      catLower.includes("travel") || 
      catLower.includes("transport") || 
      catLower.includes("cab") || 
      merchantLower.includes("uber") || 
      merchantLower.includes("ola") || 
      merchantLower.includes("lyft")
    ) {
      return {
        title: `Transit Outlay Focus: ${merchant}`,
        desc: `Commute and ride-share outlays to ${merchant} have climbed to ${formatAmount(total, "INR")} (${percent.toFixed(0)}% of total outlays). High convenience ride-sharing reduces budget margins.`,
        action: "Audit transit logs, bundle local trips, or cross-compare active transit alternatives."
      };
    }
    
    return {
      title: `Counterparty Focus: ${merchant}`,
      desc: `Outflow to vendor counterparty ${merchant} accounts for ${percent.toFixed(0)}% of your spending budget (${formatAmount(total, "INR")}).`,
      action: "Evaluate subscription terms, loyalty memberships, or cheaper alternatives to reduce vendor dependency."
    };
  };

  const getCategoryRecommendation = (name: string, total: number, percent: number) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("food") || lowerName.includes("dining")) {
      return {
        desc: `Dining outlays in "${name}" account for a heavy ${percent.toFixed(0)}% of your expenses (${formatAmount(total, "INR")}). High dining concentration usually points to convenience spending.`,
        action: "Set a recurring weekly dining budget and batch prep meals to reclaim cash flow."
      };
    }
    if (lowerName.includes("shopping")) {
      return {
        desc: `Shopping and retail outlays in "${name}" stand at ${percent.toFixed(0)}% of your expenses (${formatAmount(total, "INR")}). High shopping outlays typically indicate discretionary overflow.`,
        action: "Set a hard cap on non-essential commerce. Try separating shopping from core needs."
      };
    }
    if (lowerName.includes("entertainment") || lowerName.includes("leisure")) {
      return {
        desc: `Entertainment and recreational outlays in "${name}" consume ${percent.toFixed(0)}% of your total budget (${formatAmount(total, "INR")}).`,
        action: "Evaluate subscription models, look for free local events, and place a monthly limit on leisure outlays."
      };
    }
    if (lowerName.includes("utilities") || lowerName.includes("bills")) {
      return {
        desc: `Core fixed utilities in "${name}" take up ${percent.toFixed(0)}% of your budget (${formatAmount(total, "INR")}). These are essential but can often be optimized.`,
        action: "Audit smart meter logs, switch off idle appliances, or look for lower-cost utility plans."
      };
    }
    
    return {
      desc: `Category exposure in "${name}" stands at a heavy ${percent.toFixed(0)}% of total monthly outlays (${formatAmount(total, "INR")}). This concentration creates budgeting fragility.`,
      action: `Establish a hard monthly budget ceiling for ${name} to mitigate category exposure.`
    };
  };

  const generateInsights = () => {
    if (!reports) return [];
    const list = [];
    
    // 1. Today vs Yesterday Comparison (Spend Velocity)
    const dailyTrend = reports.daily_trend || [];
    if (dailyTrend.length >= 2) {
      const todaySpend = dailyTrend[dailyTrend.length - 1]?.amount || 0;
      const yesterdaySpend = dailyTrend[dailyTrend.length - 2]?.amount || 0;
      
      if (todaySpend === 0 && yesterdaySpend === 0) {
        list.push({
          priority: "STABLE",
          tag: "VELOCITY",
          icon: "🌱",
          title: "Zero-Outlay Velocity Locked",
          desc: "You maintained a zero-spending trajectory over the past 48 hours. This helps preserve cash reserves and prevents impulse outlays.",
          action: "Sustain this baseline rate to maximize investable surplus."
        });
      } else if (todaySpend === 0) {
        list.push({
          priority: "OPTIMIZATION",
          tag: "VELOCITY",
          icon: "⚡",
          title: "Velocity Deceleration Achieved",
          desc: `Daily outlay decelerated to zero today, following an expense of ${formatAmount(yesterdaySpend, "INR")} yesterday. This shows immediate stabilization of cash outflow.`,
          action: "Lock in zero-spending days to balance high-spend periods."
        });
      } else if (yesterdaySpend === 0) {
        list.push({
          priority: "MONITOR",
          tag: "VELOCITY",
          icon: "📈",
          title: "Spending Velocity Resumption",
          desc: `Capital outflow registered at ${formatAmount(todaySpend, "INR")} today after maintaining a clean sheet yesterday. Velocity is currently normal.`,
          action: "Monitor ongoing spend vectors today to stay within daily limits."
        });
      } else if (todaySpend > yesterdaySpend) {
        const diffPercent = ((todaySpend - yesterdaySpend) / yesterdaySpend) * 100;
        list.push({
          priority: "WARNING",
          tag: "VELOCITY",
          icon: "⚠️",
          title: "Expense Acceleration Triggered",
          desc: `Daily spending velocity increased by ${diffPercent.toFixed(0)}% compared to yesterday (${formatAmount(yesterdaySpend, "INR")} vs ${formatAmount(todaySpend, "INR")}).`,
          action: "Assess today's transactions to ensure these are non-recurring capital outlays."
        });
      } else if (todaySpend < yesterdaySpend) {
        const diffPercent = ((yesterdaySpend - todaySpend) / yesterdaySpend) * 100;
        list.push({
          priority: "OPTIMIZATION",
          tag: "VELOCITY",
          icon: "✨",
          title: "Outflow Efficiency Gain",
          desc: `Outflows reduced by ${diffPercent.toFixed(0)}% today compared to yesterday (${formatAmount(todaySpend, "INR")} vs ${formatAmount(yesterdaySpend, "INR")}). This represents a highly efficient daily budget execution.`,
          action: "Sustain this baseline rate to exceed monthly net savings forecasts."
        });
      }
    }

    // 2. Savings Rate & Investment Insights (Gold/Mutual funds)
    const savingsRate = reports.cash_flow.savings_rate || 0;
    const netSavings = reports.cash_flow.net_savings || 0;

    if (savingsRate > 30) {
      list.push({
        priority: "OPPORTUNITY",
        tag: "CAPITAL GROWTH",
        icon: "👑",
        title: "Capital Allocation Opportunity",
        desc: `Your savings rate is at a highly optimal ${savingsRate.toFixed(0)}% (Net surplus: ${formatAmount(netSavings, "INR")}). Idle capital is losing purchasing power to inflation.`,
        action: "Deploy 15% of surplus into liquid digital gold assets and 25% into diversified index mutual funds."
      });
    } else if (savingsRate > 0) {
      list.push({
        priority: "OPTIMIZATION",
        tag: "CAPITAL GROWTH",
        icon: "💰",
        title: "Micro-Investment Potential",
        desc: `Your current savings rate is ${savingsRate.toFixed(0)}% (Net surplus: ${formatAmount(netSavings, "INR")}). While positive, capital compounding is not yet optimized.`,
        action: "Set up a weekly automated SIP allocating 5% of net surplus into gold to establish an inflation hedge."
      });
    } else {
      list.push({
        priority: "CRITICAL",
        tag: "CAPITAL GROWTH",
        icon: "🚨",
        title: "Capital Depletion Warning",
        desc: `Net outflows exceed inflows (Savings Rate: ${savingsRate.toFixed(0)}%). Your capital is currently deflating, which threatens long-term financial security.`,
        action: "Audit high-frequency subscription models and dining-out variables immediately to restore cash flow surplus."
      });
    }

    // 3. Exposure Concentration (Category Breakdown)
    const categories = reports.category_breakdown || [];
    if (categories.length > 0) {
      const topCat = categories[0];
      const percent = reports.cash_flow.total_expense > 0 ? (topCat.total / reports.cash_flow.total_expense) * 100 : 0;
      if (percent > 40) {
        const rec = getCategoryRecommendation(topCat.name, topCat.total, percent);
        list.push({
          priority: "WARNING",
          tag: "RISK EXPOSURE",
          icon: "📊",
          title: `Over-Concentration in ${topCat.name}`,
          desc: rec.desc,
          action: rec.action
        });
      } else {
        list.push({
          priority: "STABLE",
          tag: "RISK EXPOSURE",
          icon: "🛡️",
          title: "Balanced Outlay Distribution",
          desc: `Your highest spending category (${topCat.name}) accounts for ${percent.toFixed(0)}% of total outlays. This is well-distributed, reducing systemic budget risk.`,
          action: "Continue monitoring category variance to prevent category drift."
        });
      }
    }

    // 4. Counterparty Focus (Top Merchant Analysis)
    const merchants = reports.top_merchants || [];
    if (merchants.length > 0) {
      const topMerchant = merchants[0];
      const rec = getMerchantRecommendation(topMerchant.merchant, topMerchant.total);
      list.push({
        priority: "OPTIMIZATION",
        tag: "COUNTERPARTY FOCUS",
        icon: "🏢",
        title: rec.title,
        desc: rec.desc,
        action: rec.action
      });
    }

    return list;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {isLoadingReports || !reports ? (
        <div className="py-24 text-center text-zinc-500 text-sm">Calculating reports...</div>
      ) : (
        <>
          {/* AI-Powered Financial Insights Section */}
          <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="mb-6">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-amber-400">💡</span> Wealth Advisor Insights
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Real-time capital analysis and optimization recommendations</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {generateInsights().map((insight, idx) => (
                <div 
                  key={idx} 
                  className={`p-5 rounded-2xl border bg-zinc-950/50 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 ${
                    insight.priority === "CRITICAL" 
                      ? "border-rose-500/10 hover:border-rose-500/30 hover:bg-rose-500/[0.02]" 
                      : insight.priority === "WARNING" 
                      ? "border-amber-500/10 hover:border-amber-500/30 hover:bg-amber-500/[0.02]" 
                      : insight.priority === "OPPORTUNITY" 
                      ? "border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02]" 
                      : insight.priority === "OPTIMIZATION" 
                      ? "border-sky-500/10 hover:border-sky-500/30 hover:bg-sky-500/[0.02]" 
                      : "border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/[0.02]"
                  }`}
                >
                  <div>
                    {/* Badge row */}
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm">{insight.icon}</span>
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">{insight.tag}</span>
                        <span className={`text-[10px] px-2.5 py-0.5 border rounded-full font-extrabold tracking-wider ${getPriorityStyle(insight.priority)}`}>
                          {insight.priority}
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="text-sm font-extrabold text-zinc-150 tracking-wide">{insight.title}</h4>
                    <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed">{insight.desc}</p>
                  </div>
                  
                  {/* Action recommendation */}
                  <div className="mt-4 pt-3 border-t border-zinc-900/60 flex items-start gap-2 text-xs">
                    <span className="text-amber-400 shrink-0 font-bold">🎯 Recommendation:</span>
                    <span className="text-zinc-200 leading-normal">{insight.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
