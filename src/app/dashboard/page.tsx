import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus2, Search, TestTube2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const testData = {
    title: 'Pothole',
    description: 'This is a dangerous pothole.',
    latitude: '28.6139',
    longitude: '77.2090',
    email: 'h@gmail.com'
  };
  const queryParams = new URLSearchParams(testData).toString();

  return (
    <div className="flex flex-1 flex-col">
      <section className="container flex flex-col items-center justify-center gap-6 py-8 md:py-12">
        <div className="mx-auto flex flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
            Dashboard
          </h1>
          <p className="max-w-[750px] text-muted-foreground sm:text-xl">
            Your direct line to campus services. Report issues and track their resolution.
          </p>
        </div>
        <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          <Link href="/lodge-complaint">
            <Card className="flex h-full transform-gpu flex-col justify-between rounded-2xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <FilePlus2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Lodge Complaint</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Have an issue to report? Submit a new complaint with details and photos.
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/track-status">
            <Card className="flex h-full transform-gpu flex-col justify-between rounded-2xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Track Complaint</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Check the status of your previously submitted complaints.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
        <div className="mt-6">
          <Button asChild>
            <Link href={`/lodge-complaint?${queryParams}`}>
              <TestTube2 className="mr-2 h-4 w-4" /> Test Autofill
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
