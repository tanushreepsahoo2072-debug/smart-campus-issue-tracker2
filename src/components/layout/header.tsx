import Link from 'next/link';
import { Megaphone, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Megaphone className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">CivicConnect</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button asChild>
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" /> Login
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
