"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function TenantDetailsPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/control/api/control/tenants/${params.id}`)
      .then((response) => response.json())
      .then((json) => setData(json.data));
  }, [params?.id]);

  if (!data) {
    return <div>Loading tenant details...</div>;
  }

  return (
    <section>
      <h1>{data.tenant.name}</h1>
      <p>Status: {data.tenant.status}</p>
      <p>Shops: {data.tenant._count.shops}</p>
      <p>Users: {data.tenant._count.users}</p>

      <h2>Last 100 Activity Logs</h2>
      <ul>
        {data.logs.map((log: any) => (
          <li key={log.id}>{log.createdAt} — {log.action} — {log.description}</li>
        ))}
      </ul>
    </section>
  );
}
