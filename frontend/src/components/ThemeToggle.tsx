"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Sync state with DOM on mount to avoid hydration mismatch
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("expense_ai_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("expense_ai_theme", "light");
    }
  };

  // Avoid rendering placeholder icons before mounting to ensure visual stability
  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 dark:bg-zinc-900/60 dark:border-zinc-800/80"></div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200/50 border border-zinc-200/80 dark:bg-zinc-900/60 dark:border-zinc-800/80 hover:border-emerald-500/40 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all duration-300 shadow-sm backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        // Moon Icon (to switch to dark)
        <svg
          className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-fade-in"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
        </svg>
      ) : (
        // Sun Icon (to switch to light)
        <svg
          className="w-5 h-5 text-amber-500 dark:text-amber-400 animate-fade-in"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="M4.93 4.93l1.41 1.41"></path>
          <path d="M17.66 17.66l1.41 1.41"></path>
          <path d="M2 12h2"></path>
          <path d="M20 12h2"></path>
          <path d="M6.34 17.66l-1.41 1.41"></path>
          <path d="M19.07 4.93l-1.41 1.41"></path>
        </svg>
      )}
    </button>
  );
}

