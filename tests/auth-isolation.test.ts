import { describe, it, expect } from "vitest";
import { userCol, userDoc } from "@/lib/firebase/admin";

describe("User Isolation & Security Foundation", () => {
  it("should throw an error when invalid UID is provided to userCol", () => {
    expect(() => userCol("", "expenses")).toThrow("Invalid UID");
    // @ts-expect-error testing null input
    expect(() => userCol(null, "expenses")).toThrow("Invalid UID");
  });

  it("should enforce distinct scoped path for different users", () => {
    const colUserA = userCol("user_alice_123", "expenses");
    const colUserB = userCol("user_bob_456", "expenses");

    expect(colUserA.path).toBe("users/user_alice_123/expenses");
    expect(colUserB.path).toBe("users/user_bob_456/expenses");
    expect(colUserA.path).not.toBe(colUserB.path);
  });

  it("should throw an error when invalid UID is provided to userDoc", () => {
    expect(() => userDoc("")).toThrow("Invalid UID");
  });

  it("should scope userDoc to users/{uid}", () => {
    const docUser = userDoc("user_alice_123");
    expect(docUser.path).toBe("users/user_alice_123");
  });
});
