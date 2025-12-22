import AuthorityLoginForm from '@/components/authority-login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthorityLoginPage() {
  return (
    <div className="container mx-auto flex h-[calc(100vh-10rem)] items-center justify-center py-8">
        <AuthorityLoginForm />
    </div>
  );
}
