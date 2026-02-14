import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { injectOrganizationIdIfMissing } from "./scoped-prisma";

describe("injectOrganizationIdIfMissing", () => {
  it("adds organizationId when both organizationId and relation are missing", () => {
    const result = injectOrganizationIdIfMissing({ title: "hello" } as any, "org_1") as any;

    assert.equal(result.organizationId, "org_1");
    assert.equal(result.title, "hello");
  });

  it("does not override existing organizationId", () => {
    const result = injectOrganizationIdIfMissing({ organizationId: "org_existing", title: "hello" } as any, "org_1") as any;

    assert.equal(result.organizationId, "org_existing");
  });

  it("does not inject organizationId when relation payload exists", () => {
    const result = injectOrganizationIdIfMissing(
      {
        title: "hello",
        organization: { connect: { id: "org_2" } },
      } as any,
      "org_1"
    ) as any;

    assert.equal(result.organizationId, undefined);
    assert.deepEqual(result.organization, { connect: { id: "org_2" } });
  });
});
