"use client";

import React, { ReactNode, useEffect, useState, Component, ErrorInfo } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import LocationTracker from "@/components/utils/LocationTracker"; // ✅ IMPORT TRACKER
import "./globals.css";

// --- 1. NEXUS ERROR BOUNDARY (The Last Line of Defense) ---
interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

class NexusErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("❌ NEXUS CRITICAL CRASH:", error, errorInfo);
  }
  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
          <div className="bg-white p-10 rounded-3xl shadow-2xl border border-red-100 max-w-lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">System Halt</h2>
            <div className="bg-red-50 p-4 rounded-xl text-left border border-red-100 mb-6">
              <p className="text-xs font-mono text-red-600 uppercase mb-1">Trace</p>
              <p className="text-sm font-mono text-red-800 break-all">{this.state.error?.message || "Unknown Runtime Error"}</p>
            </div>
            <button
              onClick={() => { window.location.href = "/login"; }}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all"
            >
              Restart Session
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- 2. AUTH SHIELD (Handles Hydration & GPS Injection) ---
function AuthShield({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession(); // ✅ Get Session Data
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    console.log("🛡️ Nexus Shield: Client Mounted");
  }, []);

  if (!isClient) return <div className="min-h-screen bg-slate-900" />;

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium animate-pulse">Initializing Nexus Suite...</p>
      </div>
    );
  }

  // ✅ AUTO-ACTIVATE TRACKER IF LOGGED IN
  // We cast session.user to 'any' to access 'id' safely if types aren't fully strict
  const userId = (session?.user as any)?.id;

  return (
    <>
      {userId && <LocationTracker userId={userId} />}
      {children}
    </>
  );
}

// --- 3. MAIN ROOT LAYOUT ---
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <title>Nexus Enterprise | Stormglide</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body 
        className="antialiased selection:bg-blue-100" 
        suppressHydrationWarning={true}
      >
        <NexusErrorBoundary>
          <SessionProvider>
            <AuthShield>
              <main className="min-h-screen">{children}</main>
            </AuthShield>
          </SessionProvider>
        </NexusErrorBoundary>
      </body>
    </html>
  );
}