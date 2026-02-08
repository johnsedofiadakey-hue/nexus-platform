"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type AccentColor = "blue" | "purple" | "rose" | "amber";

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  accent: AccentColor;
  setAccent: (color: AccentColor) => void;
  themeClasses: {
    bg: string;
    text: string;
    card: string;
    border: string;
    nav: string;
  };
}

const MobileThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function MobileThemeProvider({ children }: { children: React.ReactNode }) {
  // Load from local storage or default to dark (it looks cooler)
  const [darkMode, setDarkMode] = useState(true);
  const [accent, setAccent] = useState<AccentColor>("blue");

  // Hydrate from storage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("nexus-theme-mode");
    const savedAccent = localStorage.getItem("nexus-theme-accent");
    if (savedMode) setDarkMode(savedMode === "dark");
    if (savedAccent) setAccent(savedAccent as AccentColor);
  }, []);

  // Save changes
  useEffect(() => {
    localStorage.setItem("nexus-theme-mode", darkMode ? "dark" : "light");
    localStorage.setItem("nexus-theme-accent", accent);
  }, [darkMode, accent]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Dynamic Class Generator
  const themeClasses = {
    bg: darkMode ? "bg-slate-900" : "bg-slate-50",
    text: darkMode ? "text-white" : "text-slate-900",
    card: darkMode ? "bg-slate-800" : "bg-white",
    border: darkMode ? "border-slate-700" : "border-slate-100",
    nav: darkMode ? "bg-slate-900/80 backdrop-blur-md" : "bg-white/80 backdrop-blur-md"
  };

  return (
    <MobileThemeContext.Provider value={{ darkMode, toggleDarkMode, accent, setAccent, themeClasses }}>
      {children}
    </MobileThemeContext.Provider>
  );
}

export function useMobileTheme() {
  const context = useContext(MobileThemeContext);
  if (!context) {
    throw new Error("useMobileTheme must be used within a MobileThemeProvider");
  }
  return context;
}