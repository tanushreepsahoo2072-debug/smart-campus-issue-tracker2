
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// IMPORTANT: Do not directly edit this object.
// Your Firebase project's configuration will be injected here automatically.
const firebaseConfig = {"projectId":"studio-4040792947-1cce6","appId":"1:797073609616:web:301ca46b5b9d7939f65915","apiKey":"AIzaSyCD07jFZ8LgVlh7lkkoCkQDq_T7dJeb_7I","authDomain":"studio-4040792947-1cce6.firebaseapp.com","storageBucket":"studio-4040792947-1cce6.appspot.com","messagingSenderId":"797073609616"};


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


