'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle } from 'lucide-react';

export default function AuthorityDashboardPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // or a login prompt
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
