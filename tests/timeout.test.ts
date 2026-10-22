import { describe, it, expect } from "vitest";
import { withTimeout, TimeoutError } from "@/lib/timeout";

describe("Timeout Utility Tests", () => {
  it("resolves normally when promise completes before timeout", async () => {
    const fastPromise = new Promise<string>((resolve) =>
      setTimeout(() => resolve("success"), 50)
    );
    const result = await withTimeout(fastPromise, 200);
    expect(result).toBe("success");
  });

  it("rejects with TimeoutError when promise exceeds timeout limit", async () => {
    const makeSlowPromise = () =>
      new Promise<string>((resolve) =>
        setTimeout(() => resolve("too slow"), 500)
      );
    await expect(withTimeout(makeSlowPromise(), 100)).rejects.toThrow(TimeoutError);
    await expect(withTimeout(makeSlowPromise(), 100)).rejects.toThrow(
      "Permintaan melebihi batas waktu 30 detik."
    );
  });
});
