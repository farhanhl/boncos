import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, removeSession, SESSION_COOKIE_NAME } from "@/lib/firebase/session";
import { withTimeout, TimeoutError } from "@/lib/timeout";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
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

    const sessionRes = await withTimeout(createSession(parsed.data.idToken));

    if (!sessionRes.success || !sessionRes.cookie) {
      const isMissingEnv =
        !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL;

      return NextResponse.json(
        {
          ok: false,
          error: "SESSION_FAILED",
          message: isMissingEnv
            ? "Environment Variables Firebase (FIREBASE_PRIVATE_KEY / FIREBASE_CLIENT_EMAIL) belum dikonfigurasi di dashboard Vercel."
            : sessionRes.error || "Gagal membuat sesi login. Silakan coba lagi.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });
    const days = parseInt(process.env.SESSION_COOKIE_MAX_AGE_DAYS || "5", 10);
    const expiresIn = days * 24 * 60 * 60 * 1000;

    response.cookies.set(SESSION_COOKIE_NAME, sessionRes.cookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (err) {
    if (err instanceof TimeoutError || (err as Error)?.name === "TimeoutError") {
      return NextResponse.json(
        { ok: false, error: "TIMEOUT", message: "Permintaan melebihi batas waktu 30 detik." },
        { status: 504 }
      );
    }
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server.";
    console.error("[Session API Error]:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: errorMsg,
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
