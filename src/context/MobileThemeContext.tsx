"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeAccent = 'blue' | 'purple' | 'rose' | 'amber';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  accent: ThemeAccent;
  setAccent: (accent: ThemeAccent) => void;
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
  // Default State (Server Safe)
  const [darkMode, setDarkMode] = useState(false);
  const [accent, setAccent] = useState<ThemeAccent>('blue');
  const [mounted, setMounted] = useState(false);

  // 1. LOAD SETTINGS FROM PHONE STORAGE (Client Only)
  useEffect(() => {
    setMounted(true); // Mark as mounted immediately
    const savedMode = localStorage.getItem("nexus_mobile_dark");
    const savedAccent = localStorage.getItem("nexus_mobile_accent");
    
    if (savedMode) setDarkMode(savedMode === "true");
    if (savedAccent) setAccent(savedAccent as ThemeAccent);
  }, []);

  // 2. SAVE SETTINGS TO PHONE STORAGE (On Change)
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("nexus_mobile_dark", String(darkMode));
      localStorage.setItem("nexus_mobile_accent", accent);
    }
  }, [darkMode, accent, mounted]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Define global styles based on mode
  const themeClasses = {
    bg: darkMode ? "bg-slate-900" : "bg-slate-50",
    text: darkMode ? "text-slate-100" : "text-slate-900",
    card: darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200",
    border: darkMode ? "border-slate-700" : "border-slate-100",
    nav: darkMode ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-100",
  };

  return (
    <MobileThemeContext.Provider value={{ darkMode, toggleDarkMode, accent, setAccent, themeClasses }}>
      {/* We render children immediately. 
         Note: This might cause a slight color flash on first load if user prefers dark mode,
         but it ensures the app NEVER crashes.
      */}
      {children}
    </MobileThemeContext.Provider>
  );
}

export function useMobileTheme() {
  const context = useContext(MobileThemeContext);
  if (!context) throw new Error("useMobileTheme must be used within a MobileThemeProvider");
  return context;
}