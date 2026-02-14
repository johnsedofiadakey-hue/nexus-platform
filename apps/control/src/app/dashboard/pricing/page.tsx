"use client";

import { FormEvent, useEffect, useState } from "react";

type Plan = {
  id: string;
  name: string;
  pricePerShopMonthly: number;
  annualDiscountPercent: number;
  features: string[];
};

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);

  async function load() {
    const response = await fetch("/control/api/control/plans");
    const json = await response.json();
    setPlans(json.data || []);
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await fetch("/control/api/control/plans", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        pricePerShopMonthly: Number(formData.get("pricePerShopMonthly")),
        annualDiscountPercent: Number(formData.get("annualDiscountPercent")),
        features: String(formData.get("features") || "").split(",").map((item) => item.trim()).filter(Boolean),
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
      <h1>Pricing Engine</h1>
      <form onSubmit={create} style={{ display: "grid", gap: 8, maxWidth: 420, marginBottom: 16 }}>
        <input name="name" placeholder="Plan name" required />
        <input name="pricePerShopMonthly" type="number" min={0} step="0.01" placeholder="Price/shop monthly" required />
        <input name="annualDiscountPercent" type="number" min={0} max={100} step="0.1" placeholder="Annual discount %" required />
        <input name="features" placeholder="Comma separated features" required />
        <button type="submit">Create plan</button>
      </form>

      <ul>
        {plans.map((plan) => (
          <li key={plan.id}>
            {plan.name} — ${plan.pricePerShopMonthly}/shop monthly — {plan.annualDiscountPercent}% annual discount
          </li>
        ))}
      </ul>
    </section>
  );
}
