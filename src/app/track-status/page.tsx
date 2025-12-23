'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { fetchComplaintById, type ComplaintDetails } from './actions';
import { LoaderCircle, Search, Pen, Wrench, CheckCircle, XCircle, Info, ServerCrash } from 'lucide-react';

const formSchema = z.object({
  trackId: z.string().min(1, 'Track ID cannot be empty.'),
});
type FormValues = z.infer<typeof formSchema>;

const statusIcons: { [key: string]: React.ReactNode } = {
  Open: <Pen />,
  'In Progress': <Wrench />,
  Resolved: <CheckCircle className="text-green-500" />,
  Denied: <XCircle className="text-black" />,
};

const priorityVariant: { [key: string]: 'destructive' | 'secondary' | 'outline' | 'default' } = {
  Critical: 'destructive',
  High: 'secondary', // Orange-like
  Medium: 'outline',   // Yellow-like
  Low: 'default',      // Green-like
};

const priorityColorClass: { [key: string]: string } = {
    Critical: 'bg-red-500 hover:bg-red-600',
    High: 'bg-orange-500 hover:bg-orange-600 text-white',
    Medium: 'bg-yellow-400 hover:bg-yellow-500 text-black',
    Low: 'bg-green-500 hover:bg-green-600',
};


function IssueCard({ complaint }: { complaint: ComplaintDetails }) {
  return (
    <Card className="w-full overflow-hidden rounded-2xl shadow-lg">
      <CardHeader className="relative p-0">
        {complaint.imageUrls.length > 0 && (
          <div className="aspect-video w-full">
            <Image
              src={complaint.imageUrls[0]}
              alt={complaint.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <Badge
          className={`absolute left-4 top-4 text-white ${priorityColorClass[complaint.ai_priority]}`}
        >
          {complaint.ai_priority} Priority
        </Badge>
      </CardHeader>
      <CardContent className="p-6">
        <CardTitle className="mb-2 text-2xl font-bold">{complaint.title}</CardTitle>
        <p className="mb-6 text-muted-foreground">{complaint.description}</p>
        
        <div className="mb-6 flex items-center gap-4 rounded-lg border p-4">
            <div className="flex-shrink-0">{statusIcons[complaint.currentStatus]}</div>
            <p className="flex-grow font-semibold">{complaint.currentStatus}</p>
        </div>

        {complaint.admin_comments && (
          <>
            <Separator className="my-6" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Admin Feedback</p>
              <p className="mt-1 whitespace-pre-wrap">{complaint.admin_comments}</p>
              {complaint.updatedAt && (
                <p className="mt-2 text-xs text-muted-foreground">{complaint.updatedAt}</p>
              )}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 p-4">
        <p className="w-full text-right text-xs text-muted-foreground">
            Reported {complaint.createdAt ? formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true }) : 'some time ago'}
        </p>
      </CardFooter>
    </Card>
  );
}

export default function TrackStatusPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'processing' | 'not-found' | 'error'>('idle');
  const [complaint, setComplaint] = useState<ComplaintDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { trackId: '' },
  });

  const onSubmit = async (data: FormValues) => {
    setStatus('loading');
    setComplaint(null);
    setErrorMessage('');

    const result = await fetchComplaintById(data.trackId);
    
    if (result.status === 'success' && result.data) {
      setComplaint(result.data);
      setStatus('found');
    } else if (result.status === 'processing') {
      setStatus('processing');
    } else if (result.status === 'not-found') {
      setStatus('not-found');
    } else {
      setErrorMessage(result.error || 'An unexpected error occurred.');
      setStatus('error');
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Track Complaint</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your Track ID below to see the current status of your issue.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mb-8 flex items-center gap-4">
          <FormField
            control={form.control}
            name="trackId"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormLabel className="sr-only">Track ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your Track ID..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={status === 'loading'} className="h-10">
            {status === 'loading' ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Search />
            )}
            <span className="ml-2 hidden sm:inline">Search</span>
          </Button>
        </form>
      </Form>
      
      <div className="mt-8">
        {status === 'loading' && (
          <div className="flex justify-center p-8">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {status === 'processing' && (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Still Processing</AlertTitle>
                <AlertDescription>This issue is currently being processed by our AI. Please check back later for a full status update.</AlertDescription>
            </Alert>
        )}
        
        {status === 'not-found' && (
            <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Not Found</AlertTitle>
                <AlertDescription>Invalid Track ID. Please check the ID and try again.</AlertDescription>
            </Alert>
        )}
        
        {status === 'error' && (
            <Alert variant="destructive">
                <ServerCrash className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
        )}

        {status === 'found' && complaint && (
          <IssueCard complaint={complaint} />
        )}
      </div>
    </div>
  );
}
