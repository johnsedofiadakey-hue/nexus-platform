"use client";

import { useEffect, useState } from "react";

type Health = {
  apiErrorRate: number;
  recent500Logs: Array<{ id: string; action: string; createdAt: string }>;
  cronJobLastRun: string | null;
  dbConnectionStatus: "ok" | "error";
  paymentWebhookFailures: number;
};

export default function HealthPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [readOnly, setReadOnly] = useState(false);

  async function load() {
    const [healthResponse, crisisResponse] = await Promise.all([
      fetch("/control/api/control/health"),
      fetch("/control/api/control/crisis"),
    ]);

    const healthJson = await healthResponse.json();
    const crisisJson = await crisisResponse.json();
    setHealth(healthJson.data);
    setReadOnly(Boolean(crisisJson?.data?.systemReadOnly));
  }

  async function toggleReadOnly() {
    await fetch("/control/api/control/crisis", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "SET_READ_ONLY", enabled: !readOnly }),
    });

    await load();
  }

  useEffect(() => {
    load();
  }, []);

  if (!health) {
    return <div>Loading health monitor...</div>;
  }

  return (
    <section>
      <h1>Platform Health Monitor</h1>
      <p>DB status: <strong>{health.dbConnectionStatus}</strong></p>
      <p>API error rate (24h): <strong>{(health.apiErrorRate * 100).toFixed(2)}%</strong></p>
      <p>Cron last run: <strong>{health.cronJobLastRun || "N/A"}</strong></p>
      <p>Payment webhook failures: <strong>{health.paymentWebhookFailures}</strong></p>

      <hr />

      <h2>Crisis Management</h2>
      <p>System read-only: <strong>{readOnly ? "ON" : "OFF"}</strong></p>
      <button onClick={toggleReadOnly}>{readOnly ? "Disable" : "Enable"} read-only mode</button>

      <h3 style={{ marginTop: 20 }}>Recent 500/Error Logs</h3>
      <ul>
        {health.recent500Logs.map((log) => (
          <li key={log.id}>{log.createdAt} — {log.action}</li>
        ))}
      </ul>
    </section>
  );
}
