import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseClientApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

export function getClientAuth(): Auth {
  const app = getFirebaseClientApp();
  return getAuth(app);
}
