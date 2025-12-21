import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthorityDashboardPage() {
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
