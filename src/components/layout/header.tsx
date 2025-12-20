'use client';

import Link from 'next/link';
import { Megaphone, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';

export default function Header() {
  const { user, loading } = useUser();
  const auth = getAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Redirect the user to the login page (which is now the home page) after sign-out
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href={user ? "/dashboard" : "/"} className="mr-6 flex items-center space-x-2">
            <Megaphone className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">CivicConnect</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {!loading &&
            (user ? (
              <>
                <Button asChild variant="ghost">
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </Link>
                </Button>
                <Button onClick={handleSignOut} variant="ghost">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link href="/">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
            ))}
        </div>
      </div>
    </header>
  );
}
