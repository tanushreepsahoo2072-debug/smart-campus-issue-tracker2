
'use client';

import { useEffect, useState, use } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Issue } from '@/types/issue';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, LoaderCircle, Bot, FilePenLine, Wrench, CheckCircle, XCircle, AlertTriangle, ListX, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { IssueMap } from "@/components/issue-map";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


interface IssuePageProps {
  params: {
    id: string;
  };
}

const statusIcons: { [key: string]: React.ReactNode } = {
  'Open': <FilePenLine />,
  'In Progress': <Wrench />,
  'Resolved': <CheckCircle className="text-green-500" />,
  'Denied': <XCircle className="text-destructive" />,
  'Denied by AI': <Bot />,
};

const priorityOptions: Issue['ai_priority'][] = ['Critical', 'High', 'Medium', 'Low'];
const categoryOptions: Issue['category'][] = ['Maintenance', 'Safety', 'IT Support', 'Landscaping', 'Facilities', 'Electrical', 'Plumbing', 'Other'];

const priorityColorClass: { [key: string]: string } = {
  'Critical': 'bg-red-600 border-red-600 text-white hover:bg-red-700',
  'High': 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600',
  'Medium': 'bg-yellow-500 border-yellow-500 text-black hover:bg-yellow-600',
  'Low': 'bg-green-500 border-green-500 text-white hover:bg-green-600',
  'Not-Assigned': 'bg-gray-400 border-gray-400 text-white hover:bg-gray-500',
};

function SimilarIssues({ issueId }: { issueId: string }) {
  const firestore = useFirestore();
  const [similarIssues, setSimilarIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore || !issueId) return;

    const issuesCollection = collection(firestore, 'issues');
    const q = query(
      issuesCollection,
      where('is_spam', '==', true),
      where('merged_into', '==', issueId)
    );

    getDocs(q)
      .then((snapshot) => {
        const issues = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
          } as Issue;
        });
        setSimilarIssues(issues);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching similar issues:", err);
        setError("Failed to load similar issues.");
        setLoading(false);
      });
  }, [firestore, issueId]);

  return (
    <Card className="mt-8 rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
            <Bot /> Similar Issues (AI-Flagged Duplicates)
        </CardTitle>
        <CardDescription>These issues were flagged as duplicates of the current issue by the AI.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <div className="flex items-center gap-2 text-muted-foreground"><LoaderCircle className="animate-spin" />Loading...</div>}
        {error && <Alert variant="destructive"><AlertTriangle /><AlertDescription>{error}</AlertDescription></Alert>}
        {!loading && !error && similarIssues.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center text-muted-foreground">
            <ListX />
            <p>No similar issues were flagged by the AI.</p>
          </div>
        )}
        {!loading && !error && similarIssues.length > 0 && (
          <ul className="space-y-4">
            {similarIssues.map(issue => (
              <li key={issue.id} className="rounded-lg border p-3">
                <p className="font-mono text-xs text-muted-foreground">ID: {issue.id}</p>
                <p className="font-semibold line-clamp-1">{issue.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{issue.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Reported: {format(new Date(issue.createdAt), "PPP p")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}


export default function IssuePage({ params }: IssuePageProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);


  const [isUpdating, setIsUpdating] = useState(false);
  
  // State for editable fields
  const [newStatus, setNewStatus] = useState<Issue['currentStatus'] | ''>('');
  const [adminComments, setAdminComments] = useState('');
  const [newCategory, setNewCategory] = useState<Issue['category'] | null>(null);
  const [newPriority, setNewPriority] = useState<Issue['ai_priority'] | null>(null);


  useEffect(() => {
    if (!firestore) return;
    setLoading(true);

    const docRef = doc(firestore, 'issues', params.id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const formattedIssue = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : '',
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
        } as Issue;
        setIssue(formattedIssue);
        // Initialize state for editable fields
        setNewStatus(formattedIssue.currentStatus);
        setAdminComments(formattedIssue.admin_comments || '');
        setNewCategory(formattedIssue.category);
        setNewPriority(formattedIssue.ai_priority || 'Not-Assigned');
      } else {
        setIssue(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching issue:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, params.id]);

  const hasChanges = issue && (
    newStatus !== issue.currentStatus ||
    adminComments !== (issue.admin_comments || '') ||
    newCategory !== issue.category ||
    newPriority !== (issue.ai_priority || 'Not-Assigned')
  );

  const handleUpdate = async () => {
    if (!firestore || !issue || !newStatus || !newCategory || !newPriority) return;

    setIsUpdating(true);
    try {
      const docRef = doc(firestore, 'issues', issue.id);
      await updateDoc(docRef, {
        currentStatus: newStatus,
        admin_comments: adminComments,
        category: newCategory,
        ai_priority: newPriority,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Success', description: 'Issue has been updated.' });
    } catch (error) {
      console.error('Error updating issue:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update issue.' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto flex h-[calc(100vh-10rem)] max-w-5xl items-center justify-center p-4 md:p-8">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!issue) {
    return notFound();
  }

  if (issue.AI === 0) {
    return (
        <div className="container mx-auto flex h-[calc(100vh-10rem)] max-w-5xl items-center justify-center p-4 md:p-8">
            <Alert>
                <Bot className="h-4 w-4" />
                <AlertTitle>Processing Issue</AlertTitle>
                <AlertDescription>This issue is currently being processed by our AI. Please check back later for a full status update.</AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8">
       <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/authority/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Issues
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card className="overflow-hidden rounded-2xl shadow-lg">
                <CardHeader className="relative p-0">
                    <div className="aspect-video w-full bg-muted">
                      {issue.imageUrls && issue.imageUrls.length > 0 && (
                          <Image
                              src={issue.imageUrls[0]}
                              alt={issue.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                      )}
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <CardTitle className="text-2xl font-bold leading-tight">{issue.title}</CardTitle>
                    <p className="mt-4 text-muted-foreground">{issue.description}</p>
                    
                    <Separator className="my-6" />
                    
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between">
                            <span className="font-medium text-muted-foreground">Status</span>
                            <span className="flex items-center gap-2 font-semibold">
                                {statusIcons[issue.currentStatus]} {issue.currentStatus}
                            </span>
                        </div>
                         <div className="flex justify-between">
                            <span className="font-medium text-muted-foreground">Category</span>
                            <span className="font-semibold">{issue.category}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-muted-foreground">Priority</span>
                             <Badge className={cn(priorityColorClass[issue.ai_priority || 'Not-Assigned'], "text-sm")}>{issue.ai_priority || 'Not-Assigned'}</Badge>
                        </div>
                    </div>
                    
                    {issue.admin_comments && (
                        <div className="mt-6 space-y-2 rounded-lg border bg-muted/50 p-4">
                            <p className="text-sm font-semibold">Admin Feedback</p>
                            <p className="whitespace-pre-wrap text-muted-foreground">{issue.admin_comments}</p>
                            {issue.updatedAt && (
                                <p className="pt-2 text-xs text-muted-foreground/80">
                                    Updated {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
                                </p>
                            )}
                        </div>
                    )}

                    <Separator className="my-6" />

                    <div>
                        <h3 className="text-lg font-semibold mb-4">Issue Location</h3>
                        <div className="h-64 w-full rounded-lg overflow-hidden border">
                           <IssueMap location={{ lat: issue.latitude, lng: issue.longitude }} />
                        </div>
                    </div>

                </CardContent>
                 <CardFooter className="bg-muted/50 p-4">
                    <div className="flex w-full items-center justify-end text-xs text-muted-foreground">
                        <span>
                            Reported {issue.createdAt ? formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true }) : 'just now'}
                        </span>
                    </div>
                </CardFooter>
            </Card>
             <SimilarIssues issueId={issue.id} />
        </div>

        <div className="lg:col-span-1">
            <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                    <CardTitle>Update Issue</CardTitle>
                    <CardDescription>Change status, category, priority, and add comments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* --- STATUS --- */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <Select value={newStatus || ''} onValueChange={(value) => setNewStatus(value as Issue['currentStatus'])} disabled={isUpdating}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a new status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Open">Open</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Resolved">Resolved</SelectItem>
                                <SelectItem value="Denied">Denied</SelectItem>
                                <SelectItem value="Denied by AI">Denied by AI</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                     {/* --- CATEGORY --- */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between" disabled={isUpdating}>
                                    {newCategory || 'Select Category'} <ChevronDown />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                                {categoryOptions.map(cat => (
                                    <DropdownMenuItem key={cat} onSelect={() => setNewCategory(cat)} className={cn(newCategory === cat && 'bg-accent')}>
                                        {cat}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                     {/* --- PRIORITY --- */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Priority</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-between", newPriority !== issue.ai_priority && 'ring-2 ring-primary')} disabled={isUpdating}>
                                    {newPriority || 'Select Priority'} <ChevronDown />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-1 border-none bg-transparent shadow-none">
                                <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                                    {priorityOptions.map((p) => (
                                        <Button
                                            key={p}
                                            variant={newPriority === p ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setNewPriority(p)}
                                            className={cn(newPriority === p && priorityColorClass[p])}
                                        >
                                            {p}
                                        </Button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                     {/* --- ADMIN COMMENTS --- */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Admin Comments</label>
                        <Textarea
                            placeholder="Provide feedback or notes..."
                            value={adminComments}
                            onChange={(e) => setAdminComments(e.target.value)}
                            className="min-h-[120px]"
                            disabled={isUpdating}
                        />
                    </div>
                    
                    <Button onClick={handleUpdate} disabled={isUpdating || !hasChanges} className="w-full">
                        {isUpdating && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        {isUpdating ? 'Updating...' : 'Save Changes'}
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

    