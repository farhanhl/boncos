import { NextResponse } from "next/server";
import {
  listCustomCategories,
  createCustomCategory,
  deleteCustomCategory,
} from "@/actions/categories";
import { withTimeout, TimeoutError } from "@/lib/timeout";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
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
    const res = await withTimeout(listCustomCategories());
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
    const res = await withTimeout(createCustomCategory(body));
    return NextResponse.json(res, {
      status: res.ok ? 200 : 400,
    });
  } catch (err) {
    return handleTimeoutResponse(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const id = searchParams.get("id") || body?.id;
    const res = await withTimeout(deleteCustomCategory(id));
    return NextResponse.json(res, {
      status: res.ok ? 200 : 400,
    });
  } catch (err) {
    return handleTimeoutResponse(err);
  }
}
