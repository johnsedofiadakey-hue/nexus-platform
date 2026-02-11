"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/admin/signin");
      return;
    }

    // Check if user has admin role
    const role = (session.user as any)?.role;
    const isAdmin = ['ADMIN', 'MANAGER', 'SUPER_ADMIN', 'AUDITOR'].includes(role);

    if (!isAdmin) {
      router.push("/auth/admin/signin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-gray-600">Welcome, {session.user?.email}</p>
      <p className="text-sm text-gray-500 mt-2">Role: {(session.user as any)?.role}</p>
    </div>
  );
}