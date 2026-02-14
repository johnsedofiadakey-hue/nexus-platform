"use client";

import { useEffect, useState } from "react";

type Overview = {
  totalTenants: number;
  activeSubscriptions: number;
  lockedTenants: number;
  graceTenants: number;
  totalShops: number;
  mrr: number;
  arr: number;
  paymentFailureRate: number;
};

export default function ControlDashboardPage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    fetch("/control/api/control/overview")
      .then((response) => response.json())
      .then((json) => setData(json.data));
  }, []);

  if (!data) {
    return <div>Loading overview...</div>;
  }

  return (
    <section>
      <h1>Platform Overview</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        <Metric label="Total tenants" value={data.totalTenants} />
        <Metric label="Active subscriptions" value={data.activeSubscriptions} />
        <Metric label="Locked tenants" value={data.lockedTenants} />
        <Metric label="Grace tenants" value={data.graceTenants} />
        <Metric label="Total shops" value={data.totalShops} />
        <Metric label="MRR" value={data.mrr.toFixed(2)} />
        <Metric label="ARR" value={data.arr.toFixed(2)} />
        <Metric label="Payment failure rate" value={`${(data.paymentFailureRate * 100).toFixed(2)}%`} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, background: "#fff" }}>
      <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
