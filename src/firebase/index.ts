
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// IMPORTANT: Do not directly edit this object.
// Your Firebase project's configuration will be injected here automatically.
const firebaseConfig = {
  apiKey: "AIzaSyDlnFwafi0HG7taxsBUosmH4ZCmkg5rD-0",
  authDomain: "smart-campus-issues-system1.firebaseapp.com",
  projectId: "smart-campus-issues-system1",
  storageBucket: "smart-campus-issues-system1.appspot.com",
  messagingSenderId: "950130921332",
  appId: "1:950130921332:web:758771174c886bd5fd6621"
};


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



