import { NextResponse } from "next/server";
import { sendTelegramTest } from "@/actions/notifications";
import { withTimeout, TimeoutError } from "@/lib/timeout";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST() {
  try {
    const res = await withTimeout(sendTelegramTest());
    return NextResponse.json(res, {
      status: res.ok ? 200 : 400,
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
