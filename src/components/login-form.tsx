import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginForm() {
  return (
    <Card className="w-full max-w-sm rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Admin Login</CardTitle>
        <CardDescription>Enter your credentials to access the admin dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="userId">User ID</Label>
          <Input id="userId" type="text" placeholder="Your user ID" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Sign in</Button>
      </CardFooter>
    </Card>
  );
}
