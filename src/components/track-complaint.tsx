'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { LoaderCircle, Search, ServerCrash, Tag } from 'lucide-react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

const trackSchema = z.object({
  issueId: z.string().min(1, 'Tracking PIN is required.'),
});

type TrackFormValues = z.infer<typeof trackSchema>;

// IMPORTANT: Replace with your deployed Google Apps Script URL
const GOOGLE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbycAPlKzJ2D-iJ4-8B-3_gDq8xR_j5-Ld-EwA9qCq_x_yZz_wR-B7vD-Zq_A/exec';

type ComplaintStatus = {
  title: string;
  category: string;
  priority: string;
  status: string;
  submittedOn: string;
  assignedTo: string;
  lastUpdate: string;
  notes: string;
};

export default function TrackComplaint() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'not-found' | 'error'>('idle');
  const [complaint, setComplaint] = useState<ComplaintStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const form = useForm<TrackFormValues>({
    resolver: zodResolver(trackSchema),
    defaultValues: { issueId: '' },
  });

  const onSubmit = async (data: TrackFormValues) => {
    setStatus('loading');
    setComplaint(null);
    setErrorMessage('');

    if (GOOGLE_APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID') || GOOGLE_APP_SCRIPT_URL === 'https://script.google.com/macros/s/AKfycbycAPlKzJ2D-iJ4-8B-3_gDq8xR_j5-Ld-EwA9qCq_x_yZz_wR-B7vD-Zq_A/exec') {
      setStatus('error');
      setErrorMessage('Google Apps Script URL is not configured. Tracking is disabled.');
      return;
    }

    try {
      const response = await fetch(`${GOOGLE_APP_SCRIPT_URL}?issueId=${data.issueId}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();

      if (result.status === 'success') {
        // Assuming the data is returned in a `data` property and is an object with keys matching ComplaintStatus
        const complaintData = result.data;
        setComplaint({
          title: complaintData.Title,
          category: complaintData.Category,
          priority: complaintData.Priority,
          status: complaintData.Status,
          submittedOn: complaintData.Timestamp,
          assignedTo: complaintData.AssignedTo || 'Unassigned',
          lastUpdate: complaintData.Timestamp, // Placeholder, you might want another 'last updated' column
          notes: complaintData.Notes || 'No notes yet.'
        });
        setStatus('found');
      } else {
        setStatus('not-found');
      }
    } catch (error) {
      console.error('Error tracking complaint:', error);
      setStatus('error');
      setErrorMessage('Failed to fetch complaint status. Please try again later.');
    }
  };


  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'in progress':
        return 'secondary';
      case 'resolved':
        return 'default';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-8">
      <Card className="rounded-2xl shadow-lg">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
              <FormField
                control={form.control}
                name="issueId"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Enter your tracking PIN..." {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">Track</span>
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {status === 'loading' && (
        <div className="flex justify-center p-8">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {(status === 'not-found' || status === 'error') && (
        <Card className="rounded-2xl text-center shadow-md">
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <ServerCrash className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>{status === 'not-found' ? 'Not Found' : 'Error'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{errorMessage || 'No complaint found with the provided Tracking PIN. Please check the PIN and try again.'}</p>
          </CardContent>
        </Card>
      )}

      {status === 'found' && complaint && (
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>{complaint.title}</CardTitle>
            <CardDescription>
              Status updated as of {new Date(complaint.lastUpdate).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <span className="font-medium">Status</span>
              <Badge variant={getStatusBadgeVariant(complaint.status)}>{complaint.status}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <p>{complaint.category}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Priority</p>
                <p>{complaint.priority}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                <p>{complaint.assignedTo}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Submitted On</p>
                <p>{new Date(complaint.submittedOn).toLocaleDateString()}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Latest Update</p>
              <p className="mt-1">{complaint.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
