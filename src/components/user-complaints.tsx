'use client';

import { useEffect, useState } from 'react';
import { LoaderCircle, ServerCrash } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { fetchUserComplaints } from '@/app/track-status/actions';

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
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'not-found' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // We will use a mock email for development since we are not logged in.
    const userEmail = 'citizen@example.com';

    const getComplaints = async () => {
      setStatus('loading');
      const result = await fetchUserComplaints(userEmail);

      if (result.status === 'success' && result.data) {
        setComplaints(result.data);
        setStatus('found');
      } else if (result.status === 'not-found') {
        setComplaints([]);
        setStatus('not-found');
      } else {
        setErrorMessage(result.error || 'An unknown error occurred.');
        setStatus('error');
      }
    };

    getComplaints();
  }, []);

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

  if (status === 'loading') {
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
