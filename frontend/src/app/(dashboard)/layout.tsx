"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FinanceProvider, useFinance } from "@/context/FinanceContext";
import ThemeToggle from "@/components/ThemeToggle";
import ExpenseChatbot from "@/components/ExpenseChatbot";


function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, handleLogout, connectedAccounts } = useFinance();

  // Redirect to landing if no token is found in localStorage/state
  useEffect(() => {
    const savedToken = localStorage.getItem("expense_ai_token");
    if (!savedToken && !token) {
      router.push("/");
    }
  }, [token, router]);

  // If not logged in yet, show a loading placeholder
  if (!token && typeof window !== "undefined" && !localStorage.getItem("expense_ai_token")) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Redirecting to login...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-950 text-zinc-100 font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-indigo-500/5 to-transparent rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-emerald-500/5 to-transparent rounded-full blur-[150px] pointer-events-none"></div>

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-zinc-900/50 backdrop-blur-xl border-b md:border-b-0 md:border-r border-zinc-800/80 flex flex-col flex-shrink-0 z-10">
        <div className="p-6 flex items-center gap-3 border-b border-zinc-800/80">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">ExpenseAI</h1>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">SaaS Dashboard</span>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-5 border-b border-zinc-800/60 bg-zinc-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-emerald-400 border border-zinc-700">
                {user.full_name[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate text-zinc-200">{user.full_name}</p>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "overview", href: "/overview", label: "Overview", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" },
            { id: "expenses", href: "/expenses", label: "Expenses", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2 2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
            { id: "income", href: "/income", label: "Incomes", icon: "M12 4v16m8-8H4" },
            { id: "budgets", href: "/budgets", label: "Budgets", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            { id: "accounts", href: "/accounts", label: "Accounts", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
            { id: "reports", href: "/reports", label: "Reports & Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            { id: "channels", href: "/channels", label: "Linked Bots", icon: "M8.684 10.742l3.417-3.417m0 0l3.417 3.417m-3.417-3.417v12.917m-3.39-13.684a4 4 0 015.38 0M17 12v.01M17 16v.01M17 20v.01M7 12v.01M7 16v.01M7 20v.01" },
          ].map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <button
                key={tab.id}
                onClick={() => router.push(tab.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border-l-2 border-emerald-500"
                    : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}></path>
                </svg>
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-zinc-800/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-800/40 hover:bg-zinc-800 hover:text-white text-zinc-400 rounded-xl text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full z-10">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100 capitalize">
              {pathname.replace("/", "") === "overview" ? "Dashboard Overview" : pathname.replace("/", "")}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Production-ready finance control center.</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Cloud Storage Connected
            </div>
          </div>
        </header>

        {children}
      </main>

      {/* Floating Chat Widget */}
      <ExpenseChatbot />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <FinanceProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </FinanceProvider>
  );
}
