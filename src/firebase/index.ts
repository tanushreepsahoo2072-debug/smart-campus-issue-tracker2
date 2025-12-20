
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// IMPORTANT: Do not directly edit this object.
// Your Firebase project's configuration will be injected here automatically.
const firebaseConfig = {"apiKey":"your-api-key","authDomain":"your-project-id.firebaseapp.com","projectId":"your-project-id","storageBucket":"your-project-id.appspot.com","messagingSenderId":"your-sender-id","appId":"your-app-id"};


function initializeFirebase(): { app: FirebaseApp; auth: Auth; firestore: Firestore } {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  return { app, auth, firestore };
}

export { initializeFirebase };

// Exporting hooks and providers
export * from './provider';
export * from './auth/use-user';
export * from './client-provider';
