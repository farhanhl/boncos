import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/actions/dashboard";
import { withTimeout, TimeoutError } from "@/lib/timeout";

export const maxDuration = 30;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || undefined;
    const res = await withTimeout(getDashboardSummary(month));
    return NextResponse.json(res, {
      status: res.ok ? 200 : 401,
    });
  } catch (err) {
    if (err instanceof TimeoutError || (err as Error)?.name === "TimeoutError") {
      return NextResponse.json(
        { ok: false, error: "TIMEOUT", message: "Permintaan melebihi batas waktu 30 detik." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
