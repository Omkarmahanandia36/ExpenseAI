"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = "/api";

interface FinanceContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  user: any | null;
  setUser: (user: any | null) => void;
  expenses: any[];
  setExpenses: React.Dispatch<React.SetStateAction<any[]>>;
  incomes: any[];
  setIncomes: React.Dispatch<React.SetStateAction<any[]>>;
  accounts: any[];
  setAccounts: React.Dispatch<React.SetStateAction<any[]>>;
  budgets: any[];
  setBudgets: React.Dispatch<React.SetStateAction<any[]>>;
  reports: any | null;
  setReports: (reports: any | null) => void;
  categories: any[];
  connectedAccounts: any[];
  isLoadingExpenses: boolean;
  isLoadingIncomes: boolean;
  isLoadingAccounts: boolean;
  isLoadingBudgets: boolean;
  isLoadingReports: boolean;
  chatInput: string;
  setChatInput: (input: string) => void;
  isChatLoading: boolean;
  lastParsedExpense: any | null;
  setLastParsedExpense: (expense: any | null) => void;
  chatError: string | null;
  linkToken: string | null;
  setLinkToken: (token: string | null) => void;
  linkPlatform: string | null;
  setLinkPlatform: (platform: string | null) => void;
  linkTokenTimeLeft: number;
  setLinkTokenTimeLeft: (time: number) => void;
  fetchUserData: (authToken: string) => Promise<void>;
  fetchExpenses: (authToken: string) => Promise<void>;
  fetchIncomes: (authToken: string) => Promise<void>;
  fetchAccounts: (authToken: string) => Promise<void>;
  fetchBudgets: (authToken: string) => Promise<void>;
  fetchReports: (authToken: string) => Promise<void>;
  fetchConnectedAccounts: (authToken: string) => Promise<void>;
  handleLogout: () => void;
  handleParseExpense: (chatInputText: string) => Promise<void>;
  handleDeleteExpense: (id: string) => Promise<void>;
  handleCreateIncome: (incomeForm: any) => Promise<boolean>;
  handleDeleteIncome: (id: string) => Promise<void>;
  handleCreateAccount: (accountForm: any) => Promise<boolean>;
  handleDeleteAccount: (id: string) => Promise<void>;
  handleCreateBudget: (budgetForm: any) => Promise<boolean>;
  handleDeleteBudget: (id: string) => Promise<void>;
  handleGenerateLinkToken: (platform: string) => Promise<void>;
  handleUnlinkAccount: (platform: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  // Core Authentication & User
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

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

  // Chatbot State
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [lastParsedExpense, setLastParsedExpense] = useState<any | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  // Channels Verification State
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [linkPlatform, setLinkPlatform] = useState<string | null>(null);
  const [linkTokenTimeLeft, setLinkTokenTimeLeft] = useState(0);

  // Helper setter for token that updates localStorage
  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem("expense_ai_token", newToken);
    } else {
      localStorage.removeItem("expense_ai_token");
    }
  };

  // Timer for link token countdown
  useEffect(() => {
    if (linkTokenTimeLeft <= 0) return;
    const timer = setTimeout(() => {
      setLinkTokenTimeLeft(linkTokenTimeLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [linkTokenTimeLeft]);

  // Load token on startup
  useEffect(() => {
    const savedToken = localStorage.getItem("expense_ai_token");
    if (savedToken) {
      setTokenState(savedToken);
      fetchUserData(savedToken);
    }
  }, []);

  const fetchUserData = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Load initial data
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

  const handleLogout = () => {
    localStorage.removeItem("expense_ai_token");
    setTokenState(null);
    setUser(null);
    setExpenses([]);
    setIncomes([]);
    setAccounts([]);
    setBudgets([]);
    setReports(null);
    setConnectedAccounts([]);
    setLinkToken(null);
    setLastParsedExpense(null);
    router.push("/");
  };

  // AI Parsing Handler
  const handleParseExpense = async (chatInputText: string) => {
    if (!chatInputText.trim() || !token) return;
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
        body: JSON.stringify({ raw_message: chatInputText, source: "website" }),
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
  const handleCreateIncome = async (incomeForm: any) => {
    if (!token) return false;
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
        fetchIncomes(token);
        fetchAccounts(token);
        fetchReports(token);
        return true;
      }
    } catch (err) {
      console.error("Error creating income:", err);
    }
    return false;
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
  const handleCreateAccount = async (accountForm: any) => {
    if (!token) return false;
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
        fetchAccounts(token);
        fetchReports(token);
        return true;
      }
    } catch (err) {
      console.error("Error creating account:", err);
    }
    return false;
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
  const handleCreateBudget = async (budgetForm: any) => {
    if (!token) return false;
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
        fetchBudgets(token);
        fetchReports(token);
        return true;
      }
    } catch (err) {
      console.error("Error creating budget:", err);
    }
    return false;
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

  return (
    <FinanceContext.Provider
      value={{
        token,
        setToken,
        user,
        setUser,
        expenses,
        setExpenses,
        incomes,
        setIncomes,
        accounts,
        setAccounts,
        budgets,
        setBudgets,
        reports,
        setReports,
        categories,
        connectedAccounts,
        isLoadingExpenses,
        isLoadingIncomes,
        isLoadingAccounts,
        isLoadingBudgets,
        isLoadingReports,
        chatInput,
        setChatInput,
        isChatLoading,
        lastParsedExpense,
        setLastParsedExpense,
        chatError,
        linkToken,
        setLinkToken,
        linkPlatform,
        setLinkPlatform,
        linkTokenTimeLeft,
        setLinkTokenTimeLeft,
        fetchUserData,
        fetchExpenses,
        fetchIncomes,
        fetchAccounts,
        fetchBudgets,
        fetchReports,
        fetchConnectedAccounts,
        handleLogout,
        handleParseExpense,
        handleDeleteExpense,
        handleCreateIncome,
        handleDeleteIncome,
        handleCreateAccount,
        handleDeleteAccount,
        handleCreateBudget,
        handleDeleteBudget,
        handleGenerateLinkToken,
        handleUnlinkAccount,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
};
