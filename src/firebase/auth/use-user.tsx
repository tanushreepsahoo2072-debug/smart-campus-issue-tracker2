'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User, IdTokenResult } from 'firebase/auth';
import { useFirebaseApp } from '@/firebase/provider';

interface UserState {
  user: User | null;
  claims: IdTokenResult['claims'] | null;
  loading: boolean;
}

export const useUser = (): UserState => {
  const app = useFirebaseApp();
  const auth = app ? getAuth(app) : null;
  const [userState, setUserState] = useState<UserState>({
    user: null,
    claims: null,
    loading: true,
  });

  useEffect(() => {
    if (!auth) {
      setUserState({ user: null, claims: null, loading: false });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        setUserState({ user, claims: idTokenResult.claims, loading: false });
      } else {
        setUserState({ user: null, claims: null, loading: false });
      }
    });

    return () => unsubscribe();
  }, [auth]);

  return userState;
};
