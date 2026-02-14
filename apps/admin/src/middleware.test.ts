import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldBlockForReadOnly } from "./middleware";

describe("shouldBlockForReadOnly", () => {
  it("blocks non-billing write requests when system is read-only", () => {
    const blocked = shouldBlockForReadOnly({
      pathname: "/api/notifications",
      method: "POST",
      systemReadOnly: true,
    });

    assert.equal(blocked, true);
  });

  it("allows billing writes while system is read-only", () => {
    const blocked = shouldBlockForReadOnly({
      pathname: "/api/payments/checkout",
      method: "POST",
      systemReadOnly: true,
    });

    assert.equal(blocked, false);
  });

  it("does not block reads when system is read-only", () => {
    const blocked = shouldBlockForReadOnly({
      pathname: "/api/notifications",
      method: "GET",
      systemReadOnly: true,
    });

    assert.equal(blocked, false);
  });

  it("does not block writes when system is not read-only", () => {
    const blocked = shouldBlockForReadOnly({
      pathname: "/api/notifications",
      method: "POST",
      systemReadOnly: false,
    });

    assert.equal(blocked, false);
  });
});
