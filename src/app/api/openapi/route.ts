import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const maxDuration = 30;

export async function GET() {
  try {
    const specPath = path.resolve(process.cwd(), "public/openapi.json");
    if (fs.existsSync(specPath)) {
      const specContent = fs.readFileSync(specPath, "utf-8");
      return new NextResponse(specContent, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      });
    }

    return NextResponse.json(
      { ok: false, message: "OpenAPI spec file not found" },
      { status: 404 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, message: "Failed to read OpenAPI spec" },
      { status: 500 }
    );
  }
}
