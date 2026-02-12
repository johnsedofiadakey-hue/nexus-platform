"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      const isPromoter = ['WORKER', 'AGENT', 'ASSISTANT'].includes(userRole);

      if (isPromoter) {
        router.replace('/mobilepos');
      } else {
        router.replace('/dashboard');
      }
    } else if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-sm text-slate-600">Loading Nexus Admin Portal...</p>
      </div>
    </div>
  );
}