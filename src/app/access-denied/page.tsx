'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogOut } from 'lucide-react';
import Link from 'next/link';
import { getAuth, signOut } from 'firebase/auth';

export default function AccessDeniedPage() {
  const auth = getAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="container mx-auto flex h-[calc(100vh-10rem)] items-center justify-center py-8">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to view this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Only users with 'authority' privileges can access this dashboard. Please contact an administrator if you believe this is an error.
          </p>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/dashboard">Go to Citizen Dashboard</Link>
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out & Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
