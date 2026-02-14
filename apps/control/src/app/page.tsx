"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
      return;
    }
    if (status === "unauthenticated") {
      router.replace("/auth/signin");
    }
  }, [router, status]);

  return <div style={{ padding: 24 }}>Loading control center...</div>;
}
