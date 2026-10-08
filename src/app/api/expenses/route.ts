import { NextResponse } from "next/server";
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/actions/expenses";
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const category_id = searchParams.get("category_id") || undefined;
    const q = searchParams.get("q") || undefined;
    const limitStr = searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;

    const res = await withTimeout(listExpenses({ from, to, category_id, q, limit }));
    return NextResponse.json(res, {
      status: res.ok ? 200 : res.error === "UNAUTHORIZED" ? 401 : 400,
    });
  } catch (err) {
    return handleTimeoutResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const res = await withTimeout(createExpense(body));
    return NextResponse.json(res, {
      status: res.ok ? 200 : res.error === "UNAUTHORIZED" ? 401 : 400,
    });
  } catch (err) {
    return handleTimeoutResponse(err);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const res = await withTimeout(updateExpense(body));
    return NextResponse.json(res, {
      status: res.ok ? 200 : res.error === "UNAUTHORIZED" ? 401 : 400,
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
    const res = await withTimeout(deleteExpense(id));
    return NextResponse.json(res, {
      status: res.ok ? 200 : res.error === "UNAUTHORIZED" ? 401 : 400,
    });
  } catch (err) {
    return handleTimeoutResponse(err);
  }
}
