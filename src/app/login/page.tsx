'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';
import LoginForm from '@/components/login-form';

export default function LoginPage() {
  const { user, claims, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (claims?.role === 'authority') {
        router.replace('/authority/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, claims, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto flex h-[calc(100vh-10rem)] items-center justify-center py-8">
      <LoginForm />
    </div>
  );
}
