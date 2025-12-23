'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, Query, query, orderBy, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Complaint } from '@/types/complaint';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderCircle, ListX } from 'lucide-react';
import IssueCard from '@/components/authority/issue-card';

export default function AuthorityDashboardPage() {
  const firestore = useFirestore();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore) {
      setError('Firestore is not available.');
      setLoading(false);
      return;
    }

    const issuesCollection = collection(firestore, 'issues');
    // Query for documents where AI is 1 and order by creation date
    const issuesQuery: Query = query(
      issuesCollection,
      where('AI', '==', 1),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      issuesQuery,
      (snapshot) => {
        const newComplaints = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
          } as Complaint;
        });
        setComplaints(newComplaints);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching complaints:', err);
        setError('Failed to fetch complaints. Please try again later.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore]);

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Authority Dashboard</CardTitle>
          <CardDescription className="text-center text-xl text-muted-foreground pt-2">
            Live feed of all submitted issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 p-8">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Fetching live issues...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
              <ListX className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">No Issues Found</h3>
              <p className="text-muted-foreground">
                There are currently no submitted complaints. New issues will appear here live.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {complaints.map((complaint) => (
                <IssueCard key={complaint.id} complaint={complaint} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
