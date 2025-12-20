import LoginForm from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.14))] items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
