import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import {
  getFirestore,
  type Firestore,
  type CollectionReference,
  type DocumentReference,
  type DocumentData,
} from "firebase-admin/firestore";

export let lastInitError: string | null = null;

export function getAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0 && apps[0]) {
    return apps[0];
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "boncos-dev";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim()?.replace(/^["']|["']$/g, "");
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.trim();
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  if (clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } catch (err) {
      lastInitError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      console.error("[Firebase Admin] Gagal inisialisasi credential cert:", err);
    }
  } else {
    lastInitError = `Variabel belum lengkap: clientEmail=${Boolean(clientEmail)}, privateKey=${Boolean(privateKey)}`;
    console.error(
      `[Firebase Admin] Environment variable belum lengkap di Vercel: clientEmail=${Boolean(
        clientEmail
      )}, privateKey=${Boolean(privateKey)}`
    );
  }

  // Fallback
  return initializeApp({ projectId });
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

/**
 * Helper to ensure user isolation in Firestore paths.
 * All user subcollections MUST be accessed through this helper.
 */
export function userCol<T = DocumentData>(
  uid: string,
  collectionName: "expenses" | "categories" | "settings"
): CollectionReference<T> {
  if (!uid || typeof uid !== "string") {
    throw new Error("Invalid UID provided for userCol");
  }
  const db = getAdminDb();
  return db
    .collection("users")
    .doc(uid)
    .collection(collectionName) as CollectionReference<T>;
}

export function userDoc(uid: string): DocumentReference {
  if (!uid || typeof uid !== "string") {
    throw new Error("Invalid UID provided for userDoc");
  }
  return getAdminDb().collection("users").doc(uid);
}
