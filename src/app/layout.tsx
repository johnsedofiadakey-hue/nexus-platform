import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "leaflet/dist/leaflet.css"; // Ensure map styles are global
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexus Operations | Stormglide Logistics",
  description: "Enterprise Resource & Logistics Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning is added to <body> to prevent 
          extensions like Grammarly from triggering hydration errors.
      */}
      <body 
        className={`${inter.className} bg-[#f8fafc] text-slate-900 antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}