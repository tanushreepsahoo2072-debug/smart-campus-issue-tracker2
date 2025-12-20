
import {initializeApp, App} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {https, HttpsError} from 'firebase-functions';

let app: App;

// This function is designed to be called by a trusted administrator.
export const setAuthorityClaim = https.onCall(async (data, context) => {
  // Ensure the function is called by an authenticated user.
  if (!context.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  // For simplicity in this test setup, we allow any authenticated user
  // to call this function. In a real-world scenario, you would add a check here
  // to ensure the CALLER is an administrator.
  // For example:
  // if (context.auth.token.role !== 'admin') {
  //   throw new HttpsError(
  //     'permission-denied',
  //     'You must be an administrator to set custom claims.'
  //   );
  // }
  
  const email = data.email;
  if (typeof email !== 'string' || !email) {
    throw new HttpsError(
      'invalid-argument',
      'The function must be called with a valid "email" argument.'
    );
  }

  try {
    if (!app) {
      app = initializeApp();
    }
    const auth = getAuth(app);
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, {role: 'authority'});

    return {
      message: `Success! ${email} has been made an authority. They may need to sign out and sign back in for the changes to take effect.`,
    };
  } catch (error: any) {
    console.error('Error setting custom claim:', error);
    throw new HttpsError(
      'internal',
      error.message || 'An internal error occurred.'
    );
  }
});
