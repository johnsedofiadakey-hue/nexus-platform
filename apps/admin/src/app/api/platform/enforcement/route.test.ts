import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildEnforcementResponse } from "./route";

describe("platform enforcement route", () => {
  it("returns 401 when session is missing", async () => {
    const req = new Request("http://localhost:3001/api/platform/enforcement");

    const res = await buildEnforcementResponse(req, null);
    const body = await res.json();

    assert.equal(res.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "UNAUTHORIZED");
  });

  it("returns enforcement payload without feature check when featureKey is absent", async () => {
    const req = new Request("http://localhost:3001/api/platform/enforcement");

    let featureCheckCalled = false;
    const res = await buildEnforcementResponse(
      req,
      { user: { email: "tenant-admin@local.test", organizationId: "org_1" } },
      {
        getTenantEnforcementFn: async () => ({
          tenantId: "org_1",
          subscriptionStatus: "ACTIVE",
          graceEndsAt: null,
          systemReadOnly: false,
          authVersion: 1,
          planName: "Growth",
        }),
        checkFeatureFn: async () => {
          featureCheckCalled = true;
          return true;
        },
      }
    );

    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.tenantId, "org_1");
    assert.equal(body.data.planName, "Growth");
    assert.equal(featureCheckCalled, false);
  });

  it("includes featureEnabled when featureKey is present", async () => {
    const req = new Request("http://localhost:3001/api/platform/enforcement?featureKey=messaging");

    const res = await buildEnforcementResponse(
      req,
      { user: { email: "tenant-admin@local.test", organizationId: "org_1" } },
      {
        getTenantEnforcementFn: async () => ({
          tenantId: "org_1",
          subscriptionStatus: "ACTIVE",
          graceEndsAt: null,
          systemReadOnly: false,
          authVersion: 2,
          planName: "Growth",
        }),
        checkFeatureFn: async ({ featureKey, tenantId, plan }) => {
          assert.equal(featureKey, "messaging");
          assert.equal(tenantId, "org_1");
          assert.equal(plan, "Growth");
          return true;
        },
      }
    );

    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.featureKey, "messaging");
    assert.equal(body.data.featureEnabled, true);
    assert.equal(body.data.authVersion, 2);
  });

  it("returns enforcement without featureEnabled when featureKey exists but organizationId is missing", async () => {
    const req = new Request("http://localhost:3001/api/platform/enforcement?featureKey=messaging");

    let featureCheckCalled = false;
    const res = await buildEnforcementResponse(
      req,
      { user: { email: "tenant-admin@local.test", organizationId: null } },
      {
        getTenantEnforcementFn: async () => ({
          tenantId: null,
          subscriptionStatus: "ACTIVE",
          graceEndsAt: null,
          systemReadOnly: false,
          authVersion: 1,
          planName: "Starter",
        }),
        checkFeatureFn: async () => {
          featureCheckCalled = true;
          return true;
        },
      }
    );

    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.tenantId, null);
    assert.equal(body.data.featureEnabled, undefined);
    assert.equal(body.data.featureKey, undefined);
    assert.equal(featureCheckCalled, false);
  });

  it("returns 401 when email is missing even if organizationId exists", async () => {
    const req = new Request("http://localhost:3001/api/platform/enforcement?featureKey=messaging");

    let enforcementCalled = false;
    let featureCheckCalled = false;

    const res = await buildEnforcementResponse(
      req,
      { user: { email: null, organizationId: "org_1" } },
      {
        getTenantEnforcementFn: async () => {
          enforcementCalled = true;
          return {
            tenantId: "org_1",
            subscriptionStatus: "ACTIVE",
            graceEndsAt: null,
            systemReadOnly: false,
            authVersion: 1,
            planName: "Growth",
          };
        },
        checkFeatureFn: async () => {
          featureCheckCalled = true;
          return true;
        },
      }
    );

    const body = await res.json();

    assert.equal(res.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "UNAUTHORIZED");
    assert.equal(enforcementCalled, false);
    assert.equal(featureCheckCalled, false);
  });
});
