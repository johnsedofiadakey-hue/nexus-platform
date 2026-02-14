"use client";

import { useEffect, useState } from "react";

type Tenant = {
  id: string;
  name: string;
  status: string;
  shops: number;
  users: number;
  subscription: {
    status: string;
    billingCycle: string;
    plan: { name: string };
  } | null;
};

export default function TenantManagementPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  async function load() {
    const response = await fetch("/control/api/control/tenants");
    const json = await response.json();
    setTenants(json.data || []);
  }

  async function action(tenantId: string, actionName: string) {
    await fetch(`/control/api/control/tenants/${tenantId}/actions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: actionName }),
    });
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section>
      <h1>Tenant Management</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
        <thead>
          <tr>
            <th align="left">Tenant</th>
            <th align="left">Plan</th>
            <th align="left">Billing</th>
            <th align="left">Status</th>
            <th align="left">Shops</th>
            <th align="left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant.id}>
              <td>{tenant.name}</td>
              <td>{tenant.subscription?.plan?.name || "-"}</td>
              <td>{tenant.subscription?.billingCycle || "-"}</td>
              <td>{tenant.subscription?.status || tenant.status}</td>
              <td>{tenant.shops}</td>
              <td style={{ display: "flex", gap: 8 }}>
                <button onClick={() => action(tenant.id, "LOCK_TENANT")}>Lock</button>
                <button onClick={() => action(tenant.id, "UNLOCK_TENANT")}>Unlock</button>
                <button onClick={() => action(tenant.id, "FORCE_GRACE")}>Grace</button>
                <button onClick={() => action(tenant.id, "IMPERSONATE_READONLY")}>Impersonate</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
