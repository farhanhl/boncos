import { NextResponse } from "next/server";
import {
  getTelegramSettings,
  saveTelegramSettings,
  deleteTelegramSettings,
} from "@/actions/notifications";
import { withTimeout, TimeoutError } from "@/lib/timeout";

export const maxDuration = 30;

function handleTimeoutResponse(err: unknown) {
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

export async function GET() {
  try {
    const res = await withTimeout(getTelegramSettings());
    return NextResponse.json(res, {
      status: res.ok ? 200 : 401,
    });
  } catch (err) {
    return handleTimeoutResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const res = await withTimeout(saveTelegramSettings(body));
    return NextResponse.json(res, {
      status: res.ok ? 200 : 400,
    });
  } catch (err) {
    return handleTimeoutResponse(err);
  }
}

export async function DELETE() {
  try {
    const res = await withTimeout(deleteTelegramSettings());
    return NextResponse.json(res, {
      status: res.ok ? 200 : 400,
    });
  } catch (err) {
    return handleTimeoutResponse(err);
  }
}
