'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, Query, query, orderBy, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Complaint } from '@/types/complaint';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderCircle, ListX, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import IssueCard from '@/components/authority/issue-card';
import Link from 'next/link';

export default function AuthorityDashboardPage() {
  const firestore = useFirestore();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    if (!firestore) {
      setError('Firestore is not available.');
      setLoading(false);
      return;
    }

    const issuesCollection = collection(firestore, 'issues');
    let issuesQuery: Query = query(issuesCollection, orderBy('createdAt', 'desc'));

    if (statusFilter !== 'All') {
      issuesQuery = query(issuesQuery, where('currentStatus', '==', statusFilter));
    }

    const unsubscribe = onSnapshot(
      issuesQuery,
      (snapshot) => {
        const newComplaints = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
            } as Complaint;
          })
          .filter(complaint => complaint.AI === 1 && complaint.is_spam === false); 

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
  }, [firestore, statusFilter]);

  const filteredComplaints = complaints.filter(complaint =>
    complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or Track ID..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Denied">Denied</SelectItem>
                <SelectItem value="Denied by AI">Denied by AI</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
          ) : filteredComplaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
              <ListX className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">No Issues Found</h3>
              <p className="text-muted-foreground">
                There are currently no issues matching your criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredComplaints.map((complaint) => (
                <Link href={`/authority/dashboard/${complaint.id}`} key={complaint.id}>
                    <IssueCard complaint={complaint} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
