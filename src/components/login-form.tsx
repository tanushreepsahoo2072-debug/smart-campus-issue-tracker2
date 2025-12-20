'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';

export default function LoginForm() {
  const [role, setRole] = useState<'citizen' | 'authority'>('citizen');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      // On successful sign-in, redirect based on the selected role
      if (role === 'citizen') {
        router.push('/dashboard'); // Redirect to the citizen dashboard
      } else {
        router.push('/authority/dashboard'); // Redirect to the authority page
      }
      toast({
        title: 'Signed in successfully!',
        description: `Welcome! You are logged in as a ${role}.`,
      });
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'There was a problem with Google Sign-In.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-sm rounded-2xl shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to CivicConnect</CardTitle>
        <CardDescription>Please sign in to continue</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex items-center justify-center space-x-4">
          <Label htmlFor="role-switch" className={role === 'citizen' ? 'text-primary' : 'text-muted-foreground'}>
            Citizen
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
        <Button onClick={handleGoogleSignIn} disabled={isSubmitting} className="w-full">
          <FcGoogle className="mr-2 h-5 w-5" />
          {isSubmitting ? 'Signing in...' : 'Sign in with Google'}
        </Button>
      </CardContent>
    </Card>
  );
}
