
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { fetchComplaintById, type ComplaintDetails } from './actions';
import { LoaderCircle, Search, Wrench, CheckCircle, XCircle, Info, ServerCrash, FilePenLine, Bot, Link2,AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

const formSchema = z.object({
  trackId: z.string().min(1, 'Track ID cannot be empty.'),
});
type FormValues = z.infer<typeof formSchema>;

const statusIcons: { [key: string]: React.ReactNode } = {
  Open: <FilePenLine className="h-4 w-4" />,
  "In Progress": <Wrench className="h-4 w-4" />,
  Resolved: <CheckCircle className="h-4 w-4 text-green-500" />,
  Denied: <XCircle className="h-4 w-4 text-destructive" />,
  "Denied by AI": <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  Pending: <LoaderCircle className="h-4 w-4 animate-spin" />,
};

const priorityColorClass: { [key: string]: string } = {
  Critical: "bg-red-500 border-red-500 text-white",
  High: "bg-orange-500 border-orange-500 text-white",
  Medium: "bg-yellow-500 border-yellow-500 text-black",
  Low: "bg-green-500 border-green-500 text-white",
  "Not-Assigned": "bg-gray-400 border-gray-400 text-black",
};
function IssueCard({ complaint }: { complaint: ComplaintDetails }) {
  const isDeniedai = complaint.currentStatus === 'Denied by AI';
  const isAiProcessed = complaint.AI === 1;
  const isHumanProcessed = complaint.AI === 2;

  const showAiComment = isDeniedai && complaint.AI_COMMENT && !complaint.updatedAt;

  return (
    <Card className="flex w-full flex-col overflow-hidden rounded-2xl shadow-lg transition-all hover:shadow-xl">
      {complaint.imageUrls.length > 0 && (
        <div className="relative h-48 w-full">
          <Image
            src={complaint.imageUrls[0]}
            alt={complaint.title}
            fill
            className="object-cover"
          />
          {isAiProcessed &&(
          <Badge
            className={cn(
              "absolute top-2 left-2 z-10 bg-red-500 border-red-500 text-white",
            )}
          >
            AI Checked
          </Badge>
          )}
          {isHumanProcessed &&(
            <Badge
              className={cn(
                "absolute top-2 right-2 z-10 bg-green-500 border-green-500 text-white",
              )}
            >
              Human Checked
            </Badge>
          )}
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight font-bold">{complaint.title}</CardTitle>
            <Badge
                className={cn(
                "whitespace-nowrap",
                priorityColorClass[complaint.ai_priority || 'Not-Assigned']
                )}
            >
                {complaint.ai_priority || 'Not-Assigned'}
            </Badge>
        </div>
        <p className="text-sm text-muted-foreground pt-1">
          Reported {complaint.createdAt ? formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true }) : 'some time ago'}
        </p>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        {complaint.is_spam && complaint.merged_into && (
            <Alert variant="default" className="bg-blue-50 border-blue-200">
                <Link2 className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">This is a Duplicate Issue</AlertTitle>
                <AlertDescription className="text-blue-700">
                    This issue has been merged with ticket #{complaint.merged_into.substring(0,6)}... We are tracking its progress there. Any updates will be reflected here.
                </AlertDescription>
            </Alert>
        )}
        <p className="text-muted-foreground">{complaint.description}</p>
        
        <div className="flex items-center text-sm">
            {statusIcons[complaint.currentStatus]}
            <span className="ml-2 font-medium">{complaint.currentStatus}</span>
        </div>
        {isAiProcessed && complaint.AI_COMMENT && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Bot className="h-4 w-4" />
                AI Analysis
            </p>
            <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/50 p-2">
              {complaint.AI_COMMENT}
            </p>
          </div>
        </>
      )}
      {isHumanProcessed && complaint.admin_comments && (
        <>
          <Separator />
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Admin Feedback
            </p>
            <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/50 p-2">
              {complaint.admin_comments}
            </p>
            {complaint.updatedAt && (
              <p className="mt-2 text-xs text-muted-foreground">
                {complaint.updatedAt}
              </p>
            )}
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function TrackStatusPage() {
  const firestore = useFirestore();
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'processing' | 'not-found' | 'error'>('idle');
  const [complaint, setComplaint] = useState<ComplaintDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { trackId: '' },
  });
  
  useEffect(() => {
    if (!currentTrackId || !firestore) return;

    const docRef = doc(firestore, 'issues', currentTrackId);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            // AI is still processing
            if (data.AI === 0) {
                setStatus('processing');
            } else {
                 // AI processing is done, fetch full details
                const result = await fetchComplaintById(currentTrackId);
                if (result.status === 'success' && result.data) {
                    setComplaint(result.data);
                    setStatus('found');
                } else if (result.status === 'error') {
                    setErrorMessage(result.error || 'An unexpected error occurred.');
                    setStatus('error');
                }
            }
        } else {
            setStatus('not-found');
        }
    }, (error) => {
        console.error("Snapshot error: ", error);
        setErrorMessage('Failed to listen for real-time updates.');
        setStatus('error');
    });

    return () => unsubscribe();
  }, [currentTrackId, firestore]);

  const onSubmit = async (data: FormValues) => {
    const trackId = data.trackId.trim();
    setStatus('loading');
    setComplaint(null);
    setErrorMessage('');
    setCurrentTrackId(trackId); // This will trigger the useEffect listener
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="mb-8 mt-px flex items-center gap-4">
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
                <Bot className="h-4 w-4" />
                <AlertTitle>AI Verification in Progress...</AlertTitle>
                <AlertDescription>Our AI is currently analyzing your submission for authenticity, priority, and duplicates. This page will update automatically once the analysis is complete.</AlertDescription>
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
