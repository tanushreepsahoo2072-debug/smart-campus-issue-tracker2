'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { LoaderCircle, ServerCrash } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// IMPORTANT: Replace with your deployed Google Apps Script URL
const GOOGLE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz2FRXSJu8WziHyuc7pDOtALFrRgRVyf0MC-vZiBxwMBN65CmRtEhVaKP0hACM60Zbkgg/exec';

type Complaint = {
  issueId: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  submittedOn: string;
  assignedTo: string;
  lastUpdate: string;
  notes: string;
};

export default function UserComplaints() {
  const { user, loading: userLoading } = useUser();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'not-found' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // We will use a mock email for development since we are not logged in.
    const userEmail = user?.email || 'citizen@example.com';

    const fetchComplaints = async () => {
      setStatus('loading');

      if (
        GOOGLE_APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID') ||
        GOOGLE_APP_SCRIPT_URL ===
          'https://script.google.com/macros/s/AKfycbw_y8j-a4q9pYx6aL4G2R3e1b7c8d9e0f1g2h3i4j5k6l7m8n9o0p/exec'
      ) {
        setStatus('error');
        setErrorMessage('Google Apps Script URL is not configured. Complaint tracking is disabled.');
        console.warn('Google Apps Script URL is not configured.');
        return;
      }

      try {
        const response = await fetch(`${GOOGLE_APP_SCRIPT_URL}?email=${userEmail}`, {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const result = await response.json();

        if (result.status === 'success' && Array.isArray(result.data)) {
          const fetchedComplaints = result.data.map(
            (item: any) =>
              ({
                issueId: item.IssueID,
                title: item.Title,
                category: item.Category,
                priority: item.Priority,
                status: item.Status,
                submittedOn: item.Timestamp,
                assignedTo: item.AssignedTo || 'Unassigned',
                lastUpdate: item.Timestamp, // Placeholder
                notes: item.Notes || 'No notes yet.',
              } as Complaint)
          );
          setComplaints(fetchedComplaints);
          setStatus(fetchedComplaints.length > 0 ? 'found' : 'not-found');
        } else {
          setStatus('not-found');
        }
      } catch (error) {
        console.error('Error tracking complaints:', error);
        setStatus('error');
        setErrorMessage('Failed to fetch complaint status. Please try again later.');
      }
    };

    fetchComplaints();
  }, [user]);

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

  if (userLoading || status === 'loading') {
    return (
      <div className="flex justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <Card className="rounded-2xl text-center shadow-md">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ServerCrash className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }
  
  if (status === 'not-found') {
    return (
        <Alert>
          <AlertTitle>No Complaints Found</AlertTitle>
          <AlertDescription>You have not submitted any complaints yet.</AlertDescription>
        </Alert>
    );
  }

  if (status === 'found') {
    return (
      <div className="space-y-6">
        {complaints.map((complaint) => (
          <Card key={complaint.issueId} className="rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle>{complaint.title}</CardTitle>
              <CardDescription>
                Tracking PIN: {complaint.issueId} | Last Updated: {new Date(complaint.lastUpdate).toLocaleString()}
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
        ))}
      </div>
    );
  }

  return null;
}
