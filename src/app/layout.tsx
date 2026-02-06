import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import NextTopLoader from "nextjs-toploader";

// 🛡️ PROVIDER IMPORTS
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "NEXUS | Enterprise Command",
  description: "Advanced Operations Platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Nexus Agent",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>

      <body
        className={`${inter.variable} ${mono.variable} font-sans antialiased bg-slate-50 text-slate-900`}
        suppressHydrationWarning={true}
      >
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
                className: 'font-sans font-medium text-sm',
                style: {
                  background: '#0F172A',
                  color: '#fff',
                  borderRadius: '8px',
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