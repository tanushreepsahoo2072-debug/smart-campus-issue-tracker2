
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderCircle, ChevronDown, Inbox, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Issue } from '@/types/issue';

interface SimilarComplaintsProps {
  issueId: string;
}

type FetchedIssue = Omit<Issue, 'createdAt'> & {
  createdAt: Timestamp;
};

export default function SimilarComplaints({ issueId }: SimilarComplaintsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complaints, setComplaints] = useState<FetchedIssue[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  
  const firestore = useFirestore();
  const router = useRouter();

  const fetchData = async () => {
    if (!firestore || !issueId) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const q = query(
        collection(firestore, 'issues'),
        where('is_spam', '==', true),
        where('merged_into', '==', issueId)
      );

      const querySnapshot = await getDocs(q);
      const fetchedComplaints: FetchedIssue[] = [];
      querySnapshot.forEach((doc) => {
        fetchedComplaints.push({ id: doc.id, ...doc.data() } as FetchedIssue);
      });
      
      setComplaints(fetchedComplaints);

    } catch (err) {
      console.error("Error fetching similar complaints:", err);
      setError("Failed to load similar complaints. You may need to create a Firestore index for this query.");
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  };

  const handleToggle = () => {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);
    if (nextIsOpen && !hasFetched) {
      fetchData();
    }
  };
  
  const handleComplaintClick = (id: string) => {
    router.push(`/authority/dashboard/${id}`);
  };

  return (
    <div className="rounded-2xl border bg-card text-card-foreground shadow-lg">
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={handleToggle}
        role="button"
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-semibold">Similar Complaints (AI)</h3>
        <ChevronDown
          className={cn('h-5 w-5 transition-transform', isOpen && 'rotate-180')}
        />
      </div>

      {isOpen && (
        <div className="border-t px-4 pb-4 pt-2">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              <span>Loading similar issues...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Query Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : complaints.length === 0 ? (
            <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground">
              <Inbox className="h-4 w-4" />
              <span>No similar complaints found for this issue.</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {complaints.map((complaint) => (
                <li
                  key={complaint.id}
                  onClick={() => handleComplaintClick(complaint.id)}
                  className="cursor-pointer rounded-lg p-3 transition-colors hover:bg-muted"
                >
                  <p className="truncate font-mono text-xs font-semibold text-primary">
                    ID: {complaint.id}
                  </p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {complaint.description}
                  </p>
                   <p className="mt-2 text-xs text-muted-foreground/80">
                    {formatDistanceToNow(complaint.createdAt.toDate(), { addSuffix: true })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
