
'use client';

import { useEffect, useState, use } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Complaint } from '@/types/complaint';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import IssueMap from '@/components/authority/issue-map';

import { ArrowLeft, LoaderCircle, Bot, FilePenLine, Wrench, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface IssuePageProps {
  params: {
    id: string;
  };
}

const statusIcons: { [key: string]: React.ReactNode } = {
  'Open': <FilePenLine className="h-4 w-4" />,
  'In Progress': <Wrench className="h-4 w-4" />,
  'Resolved': <CheckCircle className="h-4 w-4 text-green-500" />,
  'Denied': <XCircle className="h-4 w-4 text-destructive" />,
};

const priorityColorClass: { [key: string]: string } = {
  'Critical': 'bg-red-600 border-red-600 text-white',
  'High': 'bg-orange-500 border-orange-500 text-white',
  'Medium': 'bg-yellow-500 border-yellow-500 text-black',
  'Low': 'bg-green-500 border-green-500 text-white',
  'Not-Assigned': 'bg-gray-400 border-gray-400 text-white',
};

export default function IssuePage({ params: paramsPromise }: IssuePageProps) {
  const params = use(paramsPromise);
  const firestore = useFirestore();
  const { toast } = useToast();
  const [issue, setIssue] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<Complaint['currentStatus'] | ''>('');
  const [adminComments, setAdminComments] = useState('');

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
        } as Complaint;
        setIssue(formattedIssue);
        setNewStatus(formattedIssue.currentStatus);
        setAdminComments(formattedIssue.admin_comments || '');
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

  const handleUpdate = async () => {
    if (!firestore || !issue || !newStatus) return;

    setIsUpdating(true);
    try {
      const docRef = doc(firestore, 'issues', issue.id);
      await updateDoc(docRef, {
        currentStatus: newStatus,
        admin_comments: adminComments,
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

  if (issue.AI !== 1) {
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
  
  const priorityText = issue.ai_priority || 'Not-Assigned';

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
                    <Badge className={`absolute left-4 top-4 font-bold ${priorityColorClass[priorityText]}`}>
                        {priorityText} Priority
                    </Badge>
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
                           <IssueMap latitude={issue.latitude} longitude={issue.longitude} />
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
        </div>

        <div className="lg:col-span-1">
            <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                    <CardTitle>Update Status</CardTitle>
                    <CardDescription>Change the issue status and add comments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">New Status</label>
                        <Select value={newStatus || ''} onValueChange={(value) => setNewStatus(value as Complaint['currentStatus'])}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a new status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Open">Open</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Resolved">Resolved</SelectItem>
                                <SelectItem value="Denied">Denied</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Admin Comments</label>
                        <Textarea
                            placeholder="Provide feedback or notes..."
                            value={adminComments}
                            onChange={(e) => setAdminComments(e.target.value)}
                            className="min-h-[120px]"
                        />
                    </div>
                    <Button onClick={handleUpdate} disabled={isUpdating || newStatus === issue.currentStatus && adminComments === issue.admin_comments} className="w-full">
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
