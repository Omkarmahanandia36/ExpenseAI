"use client";

import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000/api/v1";

export default function Home() {
  // Authentication State
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ full_name: "", email: "", password: "" });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<
    "overview" | "expenses" | "incomes" | "budgets" | "accounts" | "reports" | "channels"
  >("overview");

  // Core Data States
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [reports, setReports] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);

  // Loading States
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [isLoadingIncomes, setIsLoadingIncomes] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // AI Logger Chatbot State
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [lastParsedExpense, setLastParsedExpense] = useState<any | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  // Creation Form States
  const [accountForm, setAccountForm] = useState({ name: "", type: "savings", balance: "" });
  const [incomeForm, setIncomeForm] = useState({
    amount: "",
    currency: "INR",
    category: "Salary",
    account_id: "",
    description: "",
    income_date: new Date().toISOString().split("T")[0],
  });
  const [budgetForm, setBudgetForm] = useState({
    category_id: "",
    budget_amount: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  // Link Token State
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [linkPlatform, setLinkPlatform] = useState<string | null>(null);
  const [linkTokenTimeLeft, setLinkTokenTimeLeft] = useState(0);

  // Load token on startup
  useEffect(() => {
    const savedToken = localStorage.getItem("expense_ai_token");
    if (savedToken) {
      setToken(savedToken);
      fetchUserData(savedToken);
    }
  }, []);

  // Timer for link token countdown
  useEffect(() => {
    if (linkTokenTimeLeft <= 0) return;
    const timer = setTimeout(() => {
      setLinkTokenTimeLeft(linkTokenTimeLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [linkTokenTimeLeft]);

  // Fetch all core user data
  const fetchUserData = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        // Load initial entities
        fetchExpenses(authToken);
        fetchIncomes(authToken);
        fetchAccounts(authToken);
        fetchBudgets(authToken);
        fetchReports(authToken);
        fetchCategories(authToken);
        fetchConnectedAccounts(authToken);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  const fetchExpenses = async (authToken: string) => {
    setIsLoadingExpenses(true);
    try {
      const response = await fetch(`${API_URL}/expenses`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  const fetchIncomes = async (authToken: string) => {
    setIsLoadingIncomes(true);
    try {
      const response = await fetch(`${API_URL}/incomes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIncomes(data);
      }
    } catch (err) {
      console.error("Error fetching incomes:", err);
    } finally {
      setIsLoadingIncomes(false);
    }
  };

  const fetchAccounts = async (authToken: string) => {
    setIsLoadingAccounts(true);
    try {
      const response = await fetch(`${API_URL}/accounts`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const fetchBudgets = async (authToken: string) => {
    setIsLoadingBudgets(true);
    try {
      const response = await fetch(`${API_URL}/budgets`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBudgets(data);
      }
    } catch (err) {
      console.error("Error fetching budgets:", err);
    } finally {
      setIsLoadingBudgets(false);
    }
  };

  const fetchReports = async (authToken: string) => {
    setIsLoadingReports(true);
    try {
      const response = await fetch(`${API_URL}/reports/dashboard`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const fetchCategories = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/expenses`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        const catsMap: { [key: string]: any } = {};
        data.forEach((exp: any) => {
          if (exp.category) {
            catsMap[exp.category.id] = exp.category;
          }
        });
        setCategories(Object.values(catsMap));
      }
    } catch (err) {
      console.error("Error categories load:", err);
    }
  };

  const fetchConnectedAccounts = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/link/accounts`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setConnectedAccounts(data);
      }
    } catch (err) {
      console.error("Error fetching connected accounts:", err);
    }
  };

  // Auth Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login/json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("expense_ai_token", data.access_token);
        setToken(data.access_token);
        fetchUserData(data.access_token);
      } else {
        setAuthError(data.detail || "Incorrect email or password.");
      }
    } catch (err) {
      setAuthError("Failed to connect to the authentication server.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });
      const data = await response.json();
      if (response.ok) {
        const loginRes = await fetch(`${API_URL}/auth/login/json`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: registerForm.email, password: registerForm.password }),
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          localStorage.setItem("expense_ai_token", loginData.access_token);
          setToken(loginData.access_token);
          fetchUserData(loginData.access_token);
        } else {
          setAuthMode("login");
        }
      } else {
        setAuthError(data.detail || "Registration failed. Try a different email.");
      }
    } catch (err) {
      setAuthError("Failed to connect to the server.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("expense_ai_token");
    setToken(null);
    setUser(null);
    setExpenses([]);
    setIncomes([]);
    setAccounts([]);
    setBudgets([]);
    setReports(null);
    setConnectedAccounts([]);
    setLinkToken(null);
    setLastParsedExpense(null);
  };

  // AI Parsing Handler
  const handleParseExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !token) return;
    setIsChatLoading(true);
    setChatError(null);
    setLastParsedExpense(null);
    try {
      const response = await fetch(`${API_URL}/expenses/parse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ raw_message: chatInput, source: "website" }),
      });
      const data = await response.json();
      if (response.ok) {
        setLastParsedExpense(data);
        setChatInput("");
        fetchExpenses(token);
        fetchAccounts(token);
        fetchReports(token);
      } else {
        setChatError(data.detail || "Could not parse message. Try formatting it differently.");
      }
    } catch (err) {
      setChatError("Network error. Failed to reach parsing engine.");
    } finally {
      setIsChatLoading(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/expenses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchExpenses(token);
        fetchAccounts(token);
        fetchReports(token);
        if (lastParsedExpense && lastParsedExpense.id === id) {
          setLastParsedExpense(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  // Create Income
  const handleCreateIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/incomes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...incomeForm,
          amount: parseFloat(incomeForm.amount),
          account_id: incomeForm.account_id || null,
        }),
      });
      if (response.ok) {
        setIncomeForm({
          amount: "",
          currency: "INR",
          category: "Salary",
          account_id: "",
          description: "",
          income_date: new Date().toISOString().split("T")[0],
        });
        fetchIncomes(token);
        fetchAccounts(token);
        fetchReports(token);
      }
    } catch (err) {
      console.error("Error creating income:", err);
    }
  };

  // Delete Income
  const handleDeleteIncome = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/incomes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchIncomes(token);
        fetchAccounts(token);
        fetchReports(token);
      }
    } catch (err) {
      console.error("Failed to delete income:", err);
    }
  };

  // Create Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...accountForm,
          balance: parseFloat(accountForm.balance) || 0.0,
        }),
      });
      if (response.ok) {
        setAccountForm({ name: "", type: "savings", balance: "" });
        fetchAccounts(token);
        fetchReports(token);
      }
    } catch (err) {
      console.error("Error creating account:", err);
    }
  };

  // Delete Account
  const handleDeleteAccount = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/accounts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchAccounts(token);
        fetchReports(token);
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
    }
  };

  // Create/Update Budget
  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/budgets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...budgetForm,
          budget_amount: parseFloat(budgetForm.budget_amount),
        }),
      });
      if (response.ok) {
        setBudgetForm({
          category_id: "",
          budget_amount: "",
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        });
        fetchBudgets(token);
        fetchReports(token);
      }
    } catch (err) {
      console.error("Error creating budget:", err);
    }
  };

  // Delete Budget
  const handleDeleteBudget = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/budgets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchBudgets(token);
        fetchReports(token);
      }
    } catch (err) {
      console.error("Failed to delete budget:", err);
    }
  };

  // Channel Linking Handlers
  const handleGenerateLinkToken = async (platform: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/auth/link/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ platform }),
      });
      if (response.ok) {
        const data = await response.json();
        setLinkToken(data.token);
        setLinkPlatform(platform);
        setLinkTokenTimeLeft(900); // 15 mins
      }
    } catch (err) {
      console.error("Failed to generate link code:", err);
    }
  };

  const handleUnlinkAccount = async (platform: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/auth/link/unlink`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ platform }),
      });
      if (response.ok) {
        fetchConnectedAccounts(token);
      }
    } catch (err) {
      console.error("Failed to unlink account:", err);
    }
  };

  // Format amount to INR (₹) or USD ($)
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

  // Quick sums for dashboard cards
  const getTotalExpensesINR = () => {
    const total = expenses
      .filter((e) => e.currency === "INR")
      .reduce((acc, curr) => acc + curr.amount, 0);
    return total;
  };

  const getTotalIncomeINR = () => {
    const total = incomes
      .filter((i) => i.currency === "INR")
      .reduce((acc, curr) => acc + curr.amount, 0);
    return total;
  };

  const getNetBalanceINR = () => {
    return getTotalIncomeINR() - getTotalExpensesINR();
  };

  // Auth Screen Render
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-100 font-sans sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md space-y-8 z-10">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 shadow-lg shadow-emerald-500/20 mb-4 hover:scale-105 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              ExpenseAI
            </h2>
            <p className="mt-2 text-sm text-zinc-400">Production Personal Finance Control Center</p>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-8 rounded-3xl shadow-2xl shadow-black/50">
            {authError && (
              <div className="p-3.5 mb-5 rounded-xl bg-red-950/40 border border-red-900/60 text-red-400 text-sm flex items-start gap-2.5">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <span>{authError}</span>
              </div>
            )}

            {authMode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <h3 className="text-xl font-semibold text-zinc-100">Welcome Back</h3>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Password</label>
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-xl focus:outline-none transition-all shadow-lg active:scale-[0.98] text-sm"
                >
                  {isAuthLoading ? "Signing In..." : "Sign In"}
                </button>
                <div className="text-center text-sm text-zinc-500 mt-4">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setAuthMode("register"); setAuthError(null); }}
                    className="text-emerald-400 hover:underline hover:text-emerald-300 font-medium"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                <h3 className="text-xl font-semibold text-zinc-100">Create Account</h3>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={registerForm.full_name}
                    onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500 text-sm"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500 text-sm"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Password</label>
                  <input
                    type="password"
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500 text-sm"
                    placeholder="Min. 6 characters"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-xl focus:outline-none transition-all shadow-lg active:scale-[0.98] text-sm"
                >
                  {isAuthLoading ? "Creating Account..." : "Create Account"}
                </button>
                <div className="text-center text-sm text-zinc-500 mt-4">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setAuthMode("login"); setAuthError(null); }}
                    className="text-emerald-400 hover:underline hover:text-emerald-300 font-medium"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Page Render
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
            { id: "overview", label: "Overview", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" },
            { id: "expenses", label: "Expenses", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
            { id: "incomes", label: "Incomes", icon: "M12 4v16m8-8H4" },
            { id: "budgets", label: "Budgets", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            { id: "accounts", label: "Accounts", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
            { id: "reports", label: "Reports & Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            { id: "channels", label: "Linked Bots", icon: "M8.684 10.742l3.417-3.417m0 0l3.417 3.417m-3.417-3.417v12.917m-3.39-13.684a4 4 0 015.38 0M17 12v.01M17 16v.01M17 20v.01M7 12v.01M7 16v.01M7 20v.01" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border-l-2 border-emerald-500"
                  : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}></path>
              </svg>
              {tab.label}
            </button>
          ))}
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
              {activeTab === "overview" ? "Dashboard Overview" : `${activeTab}`}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Production-ready finance control center.</p>
          </div>
          <div className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Cloud Storage Connected
          </div>
        </header>

        {/* ======================================================== */}
        {/* TAB: OVERVIEW */}
        {/* ======================================================== */}
        {activeTab === "overview" && (
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

                <form onSubmit={handleParseExpense} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    required
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatLoading}
                    className="flex-1 bg-zinc-950 border border-zinc-850 hover:border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all rounded-xl px-5 py-3.5 text-sm text-zinc-200 focus:outline-none"
                    placeholder="SBI debited Rs 180 at Swiggy today at 1:45 PM..."
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
        )}

        {/* ======================================================== */}
        {/* TAB: EXPENSES */}
        {/* ======================================================== */}
        {activeTab === "expenses" && (
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
        )}

        {/* ======================================================== */}
        {/* TAB: INCOMES */}
        {/* ======================================================== */}
        {activeTab === "incomes" && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-zinc-100 mb-6">Log New Income Transaction</h3>
              <form onSubmit={handleCreateIncome} className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        )}

        {/* ======================================================== */}
        {/* TAB: BUDGETS */}
        {/* ======================================================== */}
        {activeTab === "budgets" && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-zinc-100 mb-6">Setup Category Budget</h3>
              <form onSubmit={handleCreateBudget} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">Select Category</label>
                  <select
                    value={budgetForm.category_id}
                    onChange={(e) => setBudgetForm({ ...budgetForm, category_id: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:outline-none"
                    required
                  >
                    <option value="">Choose Category...</option>
                    {["Food & Dining", "Transportation", "Housing", "Utilities", "Shopping", "Healthcare", "Education", "Entertainment", "Travel", "Personal Care", "Family", "Financial Obligations", "Business/Work", "Investments", "Miscellaneous"].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
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
                          <h4 className="text-sm font-bold text-zinc-200">{b.category_id}</h4>
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
        )}

        {/* ======================================================== */}
        {/* TAB: ACCOUNTS */}
        {/* ======================================================== */}
        {activeTab === "accounts" && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-zinc-100 mb-6">Create Bank Account / Wallet</h3>
              <form onSubmit={handleCreateAccount} className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <p className="text-xs text-zinc-600 col-span-3 py-4 text-center">No active accounts configured yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: REPORTS */}
        {/* ======================================================== */}
        {activeTab === "reports" && (
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
        )}

        {/* ======================================================== */}
        {/* TAB: CONNECTED BOT CHANNELS */}
        {/* ======================================================== */}
        {activeTab === "channels" && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-zinc-100 mb-2">Connected Accounts Strategy</h3>
              <p className="text-xs text-zinc-400 mb-6">
                Link your Discord, Telegram, or Slack companion bot clients to this central account. Log expenses by typing natural sentences in your favorite chat client.
              </p>

              {/* Bot accounts statuses */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Telegram */}
                <div className="p-5 bg-zinc-950/50 border border-zinc-850 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-sky-500/10 text-sky-400 rounded-xl flex items-center justify-center border border-sky-500/20">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
                        </svg>
                      </div>
                      {connectedAccounts.some((a) => a.platform === "telegram") ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md uppercase">Connected</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-500 text-[10px] font-bold rounded-md uppercase">Not Linked</span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-zinc-200">Telegram Bot</h4>
                    <p className="text-xs text-zinc-500 mt-1">Natural language logging on the go.</p>
                  </div>
                  <div className="mt-6">
                    {connectedAccounts.some((a) => a.platform === "telegram") ? (
                      <button
                        onClick={() => handleUnlinkAccount("telegram")}
                        className="w-full py-2 bg-red-950/40 border border-red-900/60 hover:bg-red-900/30 text-red-400 font-semibold rounded-xl text-xs transition-colors"
                      >
                        Disconnect Account
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGenerateLinkToken("telegram")}
                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs transition-colors"
                      >
                        Generate Linking Code
                      </button>
                    )}
                  </div>
                </div>

                {/* Discord */}
                <div className="p-5 bg-zinc-950/50 border border-zinc-850 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.27 4.73a.2.2 0 00-.17-.05A17.93 17.93 0 0015.42 3a.22.22 0 00-.19.1 12.51 12.51 0 00-.54 1.12 16.5 16.5 0 00-5.38 0 12.19 12.19 0 00-.55-1.12.22.22 0 00-.19-.1 17.9 17.9 0 00-3.68 1.68.22.22 0 00-.09.16 19.38 19.38 0 00-2.85 11.23.23.23 0 00.1.16c1.88 1.38 3.7 2.22 5.48 2.78a.22.22 0 00.24-.08 13.56 13.56 0 001.12-1.83.21.21 0 00-.11-.3c-.6-.23-1.17-.52-1.72-.85a.22.22 0 01-.02-.36 9.4 9.4 0 00.35-.28.21.21 0 01.22-.03c3.58 1.64 7.48 1.64 11 0a.21.21 0 01.23.02c.12.1.24.19.36.29a.22.22 0 01-.02.36c-.54.33-1.11.61-1.71.84a.21.21 0 00-.12.3 12.72 12.72 0 001.13 1.83.22.22 0 00.24.08c1.78-.56 3.6-1.4 5.48-2.78a.23.23 0 00.1-.15 19.46 19.46 0 00-2.85-11.25zM8.52 14.54a1.76 1.76 0 01-1.6-1.84 1.76 1.76 0 011.6-1.84 1.76 1.76 0 011.6 1.84 1.76 1.76 0 01-1.6 1.84zm6.96 0a1.76 1.76 0 01-1.6-1.84 1.76 1.76 0 011.6-1.84 1.76 1.76 0 011.6 1.84 1.76 1.76 0 01-1.6 1.84z"/>
                        </svg>
                      </div>
                      {connectedAccounts.some((a) => a.platform === "discord") ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md uppercase">Connected</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-500 text-[10px] font-bold rounded-md uppercase">Not Linked</span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-zinc-200">Discord Bot</h4>
                    <p className="text-xs text-zinc-500 mt-1">AI parser bot for your guild servers.</p>
                  </div>
                  <div className="mt-6">
                    {connectedAccounts.some((a) => a.platform === "discord") ? (
                      <button
                        onClick={() => handleUnlinkAccount("discord")}
                        className="w-full py-2 bg-red-950/40 border border-red-900/60 hover:bg-red-900/30 text-red-400 font-semibold rounded-xl text-xs transition-colors"
                      >
                        Disconnect Account
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGenerateLinkToken("discord")}
                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs transition-colors"
                      >
                        Generate Linking Code
                      </button>
                    )}
                  </div>
                </div>

                {/* Slack */}
                <div className="p-5 bg-zinc-950/50 border border-zinc-850 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                      </div>
                      {connectedAccounts.some((a) => a.platform === "slack") ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md uppercase">Connected</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-500 text-[10px] font-bold rounded-md uppercase">Not Linked</span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-zinc-200">Slack App</h4>
                    <p className="text-xs text-zinc-500 mt-1">Track business and team workspace budgets.</p>
                  </div>
                  <div className="mt-6">
                    {connectedAccounts.some((a) => a.platform === "slack") ? (
                      <button
                        onClick={() => handleUnlinkAccount("slack")}
                        className="w-full py-2 bg-red-950/40 border border-red-900/60 hover:bg-red-900/30 text-red-400 font-semibold rounded-xl text-xs transition-colors"
                      >
                        Disconnect Account
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGenerateLinkToken("slack")}
                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs transition-colors"
                      >
                        Generate Linking Code
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Show linking code container */}
              {linkToken && (
                <div className="mt-8 p-6 bg-zinc-950 border border-indigo-500/30 rounded-2xl text-center relative overflow-hidden">
                  <div className="absolute top-0 right-1/3 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
                  <h4 className="text-sm font-bold text-zinc-300 mb-2 capitalize">
                    {linkPlatform} Linking Code
                  </h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
                    Send this code to the bot to link your account. The code will expire in {Math.floor(linkTokenTimeLeft / 60)}m {linkTokenTimeLeft % 60}s.
                  </p>
                  <div className="inline-block px-8 py-4 bg-zinc-900/80 border border-zinc-800 text-2xl font-extrabold text-indigo-400 rounded-2xl tracking-widest select-all shadow-inner">
                    {linkToken}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(linkToken)}
                    className="block mx-auto mt-3 text-xs text-zinc-500 hover:text-zinc-300 underline"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </div>

            {/* List connected bot details */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl">
              <h3 className="text-base font-bold text-zinc-100 mb-4">Active Platform Connections</h3>
              
              {connectedAccounts.length === 0 ? (
                <div className="py-8 text-center text-zinc-600 text-sm">No active connections found. Link a bot above.</div>
              ) : (
                <div className="divide-y divide-zinc-900">
                  {connectedAccounts.map((a) => (
                    <div key={a.platform} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                      <div>
                        <span className="text-xs font-bold text-zinc-200 capitalize flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {a.platform}
                        </span>
                        <p className="text-xs text-zinc-500 mt-1">
                          Connected: <span className="text-zinc-400 font-mono">@{a.username || "N/A"}</span> ({a.platform_user_id})
                        </p>
                      </div>
                      <span className="text-[10px] text-zinc-500">Linked: {new Date(a.linked_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
