import type { Metadata, Viewport } from "next"; // Added Viewport for better PWA control
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({ subsets: ["latin"] });

// 📱 VIEWPORT: Critical for mobile "App" feel and status bar colors
export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevents annoying zoom on input focus for mobile
  userScalable: false,
};

// 🛰️ METADATA: Merged PWA Manifest and iOS standalone settings
export const metadata: Metadata = {
  title: "Nexus Platform",
  description: "Enterprise Command Center & Field Operations",
  manifest: "/manifest.json", // Links the PWA manifest you created
  appleWebApp: {
    capable: true,
    title: "Nexus Agent",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* iOS splash screen and home screen icon link */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${inter.className} antialiased selection:bg-blue-100 selection:text-blue-900`}
        suppressHydrationWarning
      >
        <NextTopLoader
          color="#2563eb"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          showSpinner={false}
          easing="ease"
          speed={200}
        />

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1e293b",
              color: "#fff",
              fontSize: "12px",
              fontWeight: "bold",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
            },
          }}
        />

        {children}
      </body>
    </html>
  );
}