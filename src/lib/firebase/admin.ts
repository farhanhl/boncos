import "server-only";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import {
  getFirestore,
  type Firestore,
  type CollectionReference,
  type DocumentReference,
  type DocumentData,
} from "firebase-admin/firestore";

function getAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0 && apps[0]) {
    return apps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || "boncos-dev";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  if (clientEmail && privateKey && !privateKey.includes("MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC5")) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  }

  // In test or local emulator environment where credentials aren't provided
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
