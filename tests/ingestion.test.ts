import { describe, it, expect } from "vitest";
import { escapeHtml } from "@/lib/telegram";
import { getUidByIngestionKey } from "@/actions/ingestion";

describe("Webhook Scan & Ingestion Unit Tests", () => {
  it("escapes html characters in notification messages correctly", () => {
    const raw = `Warung "Sate" <Kambing> & Es Teh`;
    const escaped = escapeHtml(raw);
    expect(escaped).toBe("Warung &quot;Sate&quot; &lt;Kambing&gt; &amp; Es Teh");
  });

  it("safely rejects invalid or empty ingestion keys without querying db", async () => {
    expect(await getUidByIngestionKey("")).toBeNull();
    // @ts-expect-error testing invalid type
    expect(await getUidByIngestionKey(null)).toBeNull();
    expect(await getUidByIngestionKey("   ")).toBeNull();
  });
});
