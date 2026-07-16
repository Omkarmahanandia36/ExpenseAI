"use client";

import React, { useState, useEffect } from "react";
import { useFinance } from "@/context/FinanceContext";

export default function ChannelsPage() {
  const {
    token,
    connectedAccounts,
    linkToken,
    linkPlatform,
    linkTokenTimeLeft,
    handleGenerateLinkToken,
    handleUnlinkAccount,
    fetchConnectedAccounts,
  } = useFinance();

  const [copied, setCopied] = useState(false);

  // Poll connected accounts status while a linking code is active
  useEffect(() => {
    if (!token || !linkToken || linkTokenTimeLeft <= 0) return;

    // Poll status every 4 seconds
    const interval = setInterval(() => {
      fetchConnectedAccounts(token);
    }, 4000);

    return () => clearInterval(interval);
  }, [token, linkToken, linkTokenTimeLeft, fetchConnectedAccounts]);

  const handleManualRefresh = () => {
    if (token) {
      fetchConnectedAccounts(token);
    }
  };

  const handleCopy = () => {
    if (linkToken) {
      navigator.clipboard.writeText(linkToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2050);
    }
  };

  return (
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
              onClick={handleCopy}
              className="block mx-auto mt-3 text-xs text-zinc-500 hover:text-zinc-300 underline font-semibold transition-colors"
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
          </div>
        )}
      </div>

      {/* List connected bot details */}
      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base font-bold text-zinc-100">Active Platform Connections</h3>
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17"></path>
            </svg>
            Check Status
          </button>
        </div>
        
        {connectedAccounts.length === 0 ? (
          <div className="py-8 text-center text-zinc-650 text-sm">No active connections found. Link a bot above.</div>
        ) : (
          <div className="divide-y divide-zinc-900/60">
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
  );
}
