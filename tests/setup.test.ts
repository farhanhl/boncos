import { describe, it, expect } from "vitest";
import { formatCloudinaryWebp } from "@/lib/cloudinary";

describe("Vitest Setup & Cloudinary Transformations", () => {
  it("should run tests correctly", () => {
    expect(1 + 1).toBe(2);
  });

  it("transforms Cloudinary URL to WebP and applies q_auto compression", () => {
    const rawUrl = "https://res.cloudinary.com/qxwi3ibh/image/upload/v1728472800/struk-belanja.jpg";
    const transformed = formatCloudinaryWebp(rawUrl);

    expect(transformed).toBe(
      "https://res.cloudinary.com/qxwi3ibh/image/upload/f_webp,q_auto/v1728472800/struk-belanja.webp"
    );
  });

  it("handles Cloudinary URL without version number", () => {
    const rawUrl = "https://res.cloudinary.com/qxwi3ibh/image/upload/struk.png";
    const transformed = formatCloudinaryWebp(rawUrl);

    expect(transformed).toBe(
      "https://res.cloudinary.com/qxwi3ibh/image/upload/f_webp,q_auto/struk.webp"
    );
  });
});
