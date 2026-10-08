import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, removeSession } from "@/lib/firebase/session";
import { withTimeout, TimeoutError } from "@/lib/timeout";

export const maxDuration = 30;

const sessionSchema = z.object({
  idToken: z.string().min(1, "ID token wajib disertakan"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = sessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_REQUEST",
          message: parsed.error.issues[0]?.message || "Input tidak valid",
        },
        { status: 400 }
      );
    }

    const success = await withTimeout(createSession(parsed.data.idToken));

    if (!success) {
      return NextResponse.json(
        {
          ok: false,
          error: "SESSION_FAILED",
          message: "Gagal membuat sesi login. Silakan coba lagi.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof TimeoutError || (err as Error)?.name === "TimeoutError") {
      return NextResponse.json(
        { ok: false, error: "TIMEOUT", message: "Permintaan melebihi batas waktu 30 detik." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await withTimeout(removeSession());
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof TimeoutError || (err as Error)?.name === "TimeoutError") {
      return NextResponse.json(
        { ok: false, error: "TIMEOUT", message: "Permintaan melebihi batas waktu 30 detik." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
