"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface ThemeSettings {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl?: string | null;
    name?: string;
}

const defaultTheme: ThemeSettings = {
    primaryColor: '#2563EB', // Blue 600
    secondaryColor: '#0F172A', // Slate 900
    accentColor: '#F59E0B', // Amber 500
    name: 'Nexus Command'
};

const ThemeContext = createContext<{
    theme: ThemeSettings;
    updateTheme: (newTheme: Partial<ThemeSettings>) => void;
    refreshTheme: () => Promise<void>;
}>({
    theme: defaultTheme,
    updateTheme: () => { },
    refreshTheme: async () => { }
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { status } = useSession();
    const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);

    const refreshTheme = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                const serverTheme = {
                    primaryColor: data.primaryColor || defaultTheme.primaryColor,
                    secondaryColor: data.secondaryColor || defaultTheme.secondaryColor,
                    accentColor: data.accentColor || defaultTheme.accentColor,
                    logoUrl: data.logoUrl,
                    name: data.name
                };
                setTheme(serverTheme);
                applyTheme(serverTheme);
            }
        } catch (e) {
            console.error("Theme fetch failed", e);
        }
    };

    const updateTheme = (newSettings: Partial<ThemeSettings>) => {
        setTheme(prev => {
            const next = { ...prev, ...newSettings };
            applyTheme(next);
            return next;
        });
    };

    const applyTheme = (t: ThemeSettings) => {
        const root = document.documentElement;
        root.style.setProperty('--color-primary', t.primaryColor);
        root.style.setProperty('--color-secondary', t.secondaryColor);
        root.style.setProperty('--color-accent', t.accentColor);
        // Add RGB variants for opacity usage if needed, but mostly hex is fine if we use style={...}
    };

    useEffect(() => {
        if (status === 'authenticated') {
            refreshTheme();
        }
    }, [status]);

    return (
        <ThemeContext.Provider value={{ theme, updateTheme, refreshTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
