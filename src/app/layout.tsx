import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import NextTopLoader from "nextjs-toploader";

// 🛡️ PROVIDER IMPORTS
import { AuthProvider } from "@/components/Providers/AuthProvider";
import { SessionProvider } from "@/components/Providers/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Nexus Platform",
  description: "Enterprise Operations",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Nexus Agent",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      
      {/* 🛡️ CRITICAL FIX: suppressHydrationWarning added to body.
        This ignores attributes injected by browser extensions (Grammarly, LastPass, etc.)
        that cause the "Hydration Mismatch" error.
      */}
      <body 
        className={`${inter.className} antialiased selection:bg-blue-500/20 bg-[#FDFDFD]`}
        suppressHydrationWarning={true}
      >
        
        {/* 🛰️ NEXUS PROVIDER STACK */}
        <SessionProvider>
          <AuthProvider>
            
            <NextTopLoader
              color="#2563eb"
              initialPosition={0.08}
              height={3}
              showSpinner={false}
            />

            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "#0F172A",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  borderRadius: "12px",
                },
              }}
            />

            <main className="min-h-screen">
              {children}
            </main>

          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}