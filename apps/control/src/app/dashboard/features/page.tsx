"use client";

import { FormEvent, useEffect, useState } from "react";

type Flag = {
  id: string;
  key: string;
  enabledGlobally: boolean;
  planRestrictions: string[];
};

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);

  async function load() {
    const response = await fetch("/control/api/control/feature-flags");
    const json = await response.json();
    setFlags(json.data || []);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await fetch("/control/api/control/feature-flags", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        key: formData.get("key"),
        enabledGlobally: formData.get("enabledGlobally") === "on",
        planRestrictions: String(formData.get("planRestrictions") || "").split(",").map((item) => item.trim()).filter(Boolean),
      }),
    });

    event.currentTarget.reset();
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section>
      <h1>Feature Flags</h1>
      <form onSubmit={save} style={{ display: "grid", gap: 8, maxWidth: 420, marginBottom: 16 }}>
        <input name="key" placeholder="feature key" required />
        <label>
          <input name="enabledGlobally" type="checkbox" defaultChecked /> Enabled globally
        </label>
        <input name="planRestrictions" placeholder="allowed plan names (comma separated)" />
        <button type="submit">Save flag</button>
      </form>

      <ul>
        {flags.map((flag) => (
          <li key={flag.id}>{flag.key} — {flag.enabledGlobally ? "enabled" : "disabled"} — plans: {flag.planRestrictions.join(", ") || "all"}</li>
        ))}
      </ul>
    </section>
  );
}
