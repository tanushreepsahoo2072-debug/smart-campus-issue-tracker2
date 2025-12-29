'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
  const [role, setRole] = useState<'citizen' | 'authority'>('citizen');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleEnter = () => {
    setIsSubmitting(true);
    // This logic is for navigation demonstration purposes.
    // A real app would have authentication here.
    if (role === 'authority') {
      router.push('/authority-login');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <Card className="w-full max-w-sm rounded-2xl shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to Campus Connect</CardTitle>
        <CardDescription>Select your role to continue</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex items-center justify-center space-x-4">
          <Label htmlFor="role-switch" className={role === 'citizen' ? 'text-primary' : 'text-muted-foreground'}>
            User
          </Label>
          <Switch
            id="role-switch"
            checked={role === 'authority'}
            onCheckedChange={(checked) => setRole(checked ? 'authority' : 'citizen')}
            aria-label="Switch between citizen and authority login"
          />
          <Label htmlFor="role-switch" className={role === 'authority' ? 'text-primary' : 'text-muted-foreground'}>
            Authority
          </Label>
        </div>
        <Button onClick={handleEnter} disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Entering...' : 'Enter'}
        </Button>
      </CardContent>
    </Card>
  );
}
