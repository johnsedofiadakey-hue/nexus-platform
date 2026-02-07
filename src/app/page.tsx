"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (!hasRedirected) {
      setHasRedirected(true);
      // Use replace instead of push to avoid back button issues
      router.replace("/auth/signin");
    }
  }, [router, hasRedirected]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-sm text-slate-600">Redirecting to login...</p>
      </div>
    </div>
  );
}