import "server-only";
import { cookies } from "next/headers";
import { getAdminAuth } from "./admin";
import { SESSION_COOKIE_NAME } from "./constants";

export { SESSION_COOKIE_NAME };

export interface CurrentUser {
  uid: string;
  email?: string;
  displayName?: string;
}

/**
 * Retrieves the current authenticated user from the session cookie.
 * In accordance with AGENTS.md rule 8: UID is only retrieved from verified session cookie.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return null;
    }

    const auth = getAdminAuth();
    // checkRevoked: true to enforce immediate logout if session is revoked
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      displayName: decodedClaims.name,
    };
  } catch {
    // If invalid/expired/revoked, fail gracefully and treat as unauthenticated
    return null;
  }
}

/**
 * Creates and sets a verified Firebase session cookie.
 */
export async function createSession(idToken: string): Promise<boolean> {
  try {
    const auth = getAdminAuth();
    const days = parseInt(process.env.SESSION_COOKIE_MAX_AGE_DAYS || "5", 10);
    const expiresIn = days * 24 * 60 * 60 * 1000;

    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return true;
  } catch (error) {
    console.error("[Session] createSession failed:", error);
    return false;
  }
}

/**
 * Clears the session cookie on logout.
 */
export async function removeSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
