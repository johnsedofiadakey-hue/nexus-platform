"use client";

import React from "react";

// 🛡️ MUST BE A NAMED EXPORT
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}