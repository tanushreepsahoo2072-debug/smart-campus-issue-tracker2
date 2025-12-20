'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';

export default function HomePage() {
  const { user, claims, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (claims?.role === 'authority') {
          router.replace('/authority/dashboard');
        } else {
          router.replace('/dashboard');
        }
      } else {
        // If not logged in, go to the main citizen dashboard which will show login state.
        router.replace('/dashboard');
      }
    }
  }, [user, claims, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
