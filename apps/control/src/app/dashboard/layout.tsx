import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
      <aside style={{ borderRight: "1px solid #e2e8f0", padding: 16, background: "#fff" }}>
        <h2>Control Center</h2>
        <nav style={{ display: "grid", gap: 8 }}>
          <Link href="/dashboard">Overview</Link>
          <Link href="/dashboard/tenants">Tenants</Link>
          <Link href="/dashboard/pricing">Pricing</Link>
          <Link href="/dashboard/features">Features</Link>
          <Link href="/dashboard/health">Health</Link>
        </nav>
      </aside>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
