"use client";

import { Suspense, FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function ControlSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.ok) {
      router.replace("/dashboard");
      return;
    }

    alert("Login failed. Verify credentials or account lock state.");
  }

  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <form onSubmit={onSubmit} style={{ width: 360, background: "white", padding: 20, borderRadius: 10, border: "1px solid #e2e8f0" }}>
        <h1 style={{ marginTop: 0 }}>Platform Control Sign In</h1>
        {searchParams.get("error") && <p style={{ color: "#b91c1c" }}>Session rejected: {searchParams.get("error")}</p>}
        <label>Email</label>
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required style={{ width: "100%", marginBottom: 12 }} />
        <label>Password</label>
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={12} required style={{ width: "100%", marginBottom: 16 }} />
        <button type="submit" disabled={loading} style={{ width: "100%" }}>{loading ? "Signing in..." : "Sign in"}</button>
      </form>
    </main>
  );
}

export default function ControlSignInPage() {
  return (
    <Suspense fallback={<main style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>Loading...</main>}>
      <ControlSignInForm />
    </Suspense>
  );
}
