'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle } from 'lucide-react';

export default function AuthorityDashboardPage() {
  const { user, claims, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // If not loading and user is not an authority, redirect to citizen dashboard.
      // If no user, redirect to login.
      if (!user) {
        router.push('/');
      } else if (claims?.role !== 'authority') {
        router.push('/dashboard');
      }
    }
  }, [user, claims, loading, router]);

  if (loading || !user || claims?.role !== 'authority') {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto flex h-[calc(100vh-10rem)] items-center justify-center py-8">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Welcome Sir/Ma'am</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl text-muted-foreground">Authority Dashboard coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
