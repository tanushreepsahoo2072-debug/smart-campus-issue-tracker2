'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { initializeFirebase, FirebaseProvider } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseInstances, setFirebaseInstances] = useState<{
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null>(null);

  useEffect(() => {
    const instances = initializeFirebase();
    setFirebaseInstances(instances);
  }, []);

  if (!firebaseInstances) {
    // Optional: Render a loading state or skeleton UI
    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-50 w-full border-b">
                <div className="container flex h-14 items-center">
                    <Skeleton className="h-6 w-36" />
                    <div className="flex flex-1 items-center justify-end">
                        <Skeleton className="h-9 w-24" />
                    </div>
                </div>
            </header>
            <main className="flex flex-1 flex-col items-center justify-center">
                <Skeleton className="h-48 w-full max-w-md" />
            </main>
      </div>
    );
  }

  return (
    <FirebaseProvider
      app={firebaseInstances.app}
      auth={firebaseInstances.auth}
      firestore={firebaseInstances.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
