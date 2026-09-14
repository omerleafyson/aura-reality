import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const databaseId = process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID || '(default)';

if (!projectId) {
  console.warn('FIREBASE_PROJECT_ID is missing. Firebase Admin will rely on Application Default Credentials/environment discovery.');
}

if (!getApps().length) {
  adminApp = initializeApp(projectId ? { projectId } : undefined);
} else {
  adminApp = getApps()[0];
}

export const adminDb = databaseId && databaseId !== '(default)'
  ? getFirestore(adminApp, databaseId)
  : getFirestore(adminApp);

export const adminAuth = getAuth(adminApp);
