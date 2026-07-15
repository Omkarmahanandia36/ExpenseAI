"use client";

import React, { useState, useEffect, useRef } from "react";
import { useFinance } from "@/context/FinanceContext";

const API_URL = "http://localhost:8000/api/v1";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
  parsedExpense?: any;
  isError?: boolean;
}

interface ExpenseChatbotProps {
  token?: string | null;
  fetchExpenses?: (token: string) => Promise<void>;
  fetchAccounts?: (token: string) => Promise<void>;
  fetchReports?: (token: string) => Promise<void>;
}

export default function ExpenseChatbot({
  token: propToken,
  fetchExpenses: propFetchExpenses,
  fetchAccounts: propFetchAccounts,
  fetchReports: propFetchReports,
}: ExpenseChatbotProps) {
  // Check context safely
  let context: any = {};
  try {
    context = useFinance();
  } catch (e) {
    // Missing provider is fine if props are supplied
  }

  const token = propToken !== undefined ? propToken : context.token;
  const fetchExpenses = propFetchExpenses || context.fetchExpenses;
  const fetchAccounts = propFetchAccounts || context.fetchAccounts;
  const fetchReports = propFetchReports || context.fetchReports;

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set initial greeting
  useEffect(() => {
    setMessages([
      {
        id: "greeting",
        sender: "bot",
        text: "Hello! 💰 I'm your ExpenseAI chatbot assistant. What did you spend money on today? Just tell me in plain text (e.g. 'Spent ₹150 for auto ride today in Chandigarh') and I will parse and log it for you!",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !token || isLoading) return;

    const userText = input.trim();
    setInput("");

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/expenses/parse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ raw_message: userText, source: "website" }),
      });
      const data = await response.json();

      if (response.ok) {
        // Add successful bot message with parsed data
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `✅ Logged transaction successfully! I parsed the amount of **${formatAmount(data.amount, data.currency)}** and categorized it under **${data.category ? data.category.name : "Miscellaneous"}**.`,
          timestamp: new Date(),
          parsedExpense: data,
        };
        setMessages((prev) => [...prev, botMsg]);

        // Refresh global state
        if (fetchExpenses) fetchExpenses(token);
        if (fetchAccounts) fetchAccounts(token);
        if (fetchReports) fetchReports(token);
      } else {
        // Add error bot message
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: data.detail || "I couldn't parse that message. Try formatting it differently (e.g. 'Spent ₹500 at restaurant').",
          timestamp: new Date(),
          isError: true,
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: "Network error. Failed to reach the parsing engine.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
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

  // Only display if logged in
  if (!token) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <div
        className={`w-[350px] sm:w-[400px] h-[500px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-2xl flex flex-col mb-4 transition-all duration-300 origin-bottom-right transform ${
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        {/* Chatbot Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">AI Expense Assistant</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250 cursor-pointer"
            aria-label="Close chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/20">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm transition-all ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : msg.isError
                    ? "bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-tl-none"
                    : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-150 dark:border-zinc-800/40 rounded-tl-none"
                }`}
              >
                {/* Message text */}
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Inline Parsed Expense Card */}
                {msg.parsedExpense && (
                  <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-850 rounded-xl text-zinc-800 dark:text-zinc-200 shadow-inner">
                    <div className="flex justify-between items-center border-b border-zinc-200/60 dark:border-zinc-800/60 pb-1.5 mb-2">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Parsed Invoice</span>
                      <span className="text-[9px] text-zinc-400 font-medium">Website Log</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500 uppercase block text-[8px]">Category</span>
                        <span className="font-bold truncate block">{msg.parsedExpense.category ? msg.parsedExpense.category.name : "Miscellaneous"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500 uppercase block text-[8px]">Amount</span>
                        <span className="font-extrabold text-blue-600 dark:text-blue-400 block">{formatAmount(msg.parsedExpense.amount, msg.parsedExpense.currency)}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500 uppercase block text-[8px]">Account</span>
                        <span className="font-bold truncate block">{msg.parsedExpense.account ? msg.parsedExpense.account.name : "Cash"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500 uppercase block text-[8px]">Merchant</span>
                        <span className="font-bold truncate block">{msg.parsedExpense.merchant || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 px-1">
                {msg.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-150 dark:border-zinc-800/40 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSend} className="p-3 border-t border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/50 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Try 'Spent $15 for dinner at Starbucks'..."
            className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-xl px-4 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-4 py-2.5 text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9-7-9-7v14z" />
            </svg>
            Send
          </button>
        </form>
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setUnreadCount(0);
        }}
        className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-xl hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all relative cursor-pointer"
        aria-label="Open AI Assistant"
      >
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-white dark:border-zinc-950">
            {unreadCount}
          </span>
        )}
        
        {/* Chat Icon or Close Icon */}
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.83l1.207-5.02L5.33 14.75C4.166 13.414 3.5 11.728 3.5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        )}
      </button>
    </div>
  );
}
