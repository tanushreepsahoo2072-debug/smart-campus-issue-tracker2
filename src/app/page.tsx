'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';
import LoginForm from '@/components/login-form';

function FullPageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Signing in...</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, claims, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // User is authenticated, proceed with role-based redirection
      if (claims?.role === 'authority') {
        router.replace('/authority/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
    // If !loading and !user, the component will render the LoginForm below.
  }, [user, claims, loading, router]);

  // While loading or if user object exists (and we're waiting for redirect), show a loader.
  if (loading || user) {
    return <FullPageLoader />;
  }

  // If not loading and no user, show the login form.
  return (
    <div className="container mx-auto flex h-[calc(100vh-10rem)] items-center justify-center py-8">
      <LoginForm />
    </div>
  );
}
