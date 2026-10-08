import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, removeSession } from "@/lib/firebase/session";

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

    const success = await createSession(parsed.data.idToken);

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
  } catch {
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
  await removeSession();
  return NextResponse.json({ ok: true });
}
