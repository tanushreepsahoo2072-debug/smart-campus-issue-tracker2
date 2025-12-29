
'use client';

import { useEffect, useState, useMemo } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Issue, IssueCategory, AIPriority } from '@/types/complaint';
import { notFound, useParams } from 'next/navigation';
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
import { ArrowLeft, LoaderCircle, Bot, FilePenLine, Wrench, CheckCircle, XCircle, ChevronDown, Undo2, MapPin } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import SimilarComplaints from '@/components/ui/similar-complaints';


const statusIcons: { [key: string]: React.ReactNode } = {
  'Open': <FilePenLine className="h-4 w-4" />,
  'In Progress': <Wrench className="h-4 w-4" />,
  'Resolved': <CheckCircle className="h-4 w-4 text-green-500" />,
  'Denied': <XCircle className="h-4 w-4 text-destructive" />,
};

const priorityOrder: AIPriority[] = ['Low', 'Medium', 'High', 'Critical'];

const priorityColorClass: { [key: string]: string } = {
  'Critical': 'bg-red-600 border-red-600 text-white',
  'High': 'bg-orange-500 border-orange-500 text-white',
  'Medium': 'bg-yellow-500 border-yellow-500 text-black',
  'Low': 'bg-green-500 border-green-500 text-white',
  'Not-Assigned': 'bg-gray-400 border-gray-400 text-white',
};

const categories: IssueCategory[] = ['Maintenance', 'Safety', 'IT Support', 'Landscaping', 'Facilities', 'Electrical', 'Plumbing', 'Other'];

export default function IssuePage({ params: paramsProp }: { params: { id: string } }) {
  const params = useParams();
  const firestore = useFirestore();
  const { toast } = useToast();
  const issueId = (params.id || paramsProp.id) as string;
  
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // State for editable fields
  const [newStatus, setNewStatus] = useState<Issue['currentStatus'] | ''>('');
  const [adminComments, setAdminComments] = useState('');
  const [newCategory, setNewCategory] = useState<IssueCategory | ''>('');
  const [newPriority, setNewPriority] = useState<AIPriority | 'Not-Assigned'>('Not-Assigned');

  useEffect(() => {
    if (!firestore || !issueId) return;
    setLoading(true);

    const docRef = doc(firestore, 'issues', issueId);
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
        // Initialize state with fetched data
        setNewStatus(formattedIssue.currentStatus);
        setAdminComments(formattedIssue.admin_comments || '');
        setNewCategory(formattedIssue.category || '');
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
  }, [firestore, issueId]);
  
  const hasChanges = useMemo(() => {
    if (!issue) return false;
    return (
      newStatus !== issue.currentStatus ||
      adminComments !== (issue.admin_comments || '') ||
      newCategory !== (issue.category || '') ||
      newPriority !== (issue.ai_priority || 'Not-Assigned')
    );
  }, [issue, newStatus, adminComments, newCategory, newPriority]);

  const handleUpdate = async () => {
    if (!firestore || !issue || !newStatus) return;

    setIsUpdating(true);
    try {
      const docRef = doc(firestore, 'issues', issue.id);
      await updateDoc(docRef, {
        currentStatus: newStatus,
        admin_comments: adminComments,
        category: newCategory,
        ai_priority: newPriority,
        updatedAt: serverTimestamp(),
        AI: 2
      });
      toast({ title: 'Success', description: 'Issue has been updated.' });
    } catch (error) {
      console.error('Error updating issue:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update issue.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsNotSimilar = async () => {
    if (!firestore || !issueId) return;
    setIsUpdating(true);
    try {
        const docRef = doc(firestore, 'issues', issueId);
        await updateDoc(docRef, {
            is_spam: false,
            merged_into: null,
            AI_COMMENT: `Manually marked as not a duplicate by authority. Original AI comment: ${issue?.AI_COMMENT || ''}`,
            updatedAt: serverTimestamp(),
        });
        toast({
            title: 'Issue Restored',
            description: 'This issue is now being tracked as a unique complaint.',
        });
    } catch (error) {
        console.error('Error marking as not similar:', error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Could not update the issue. Please try again.',
        });
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
  
  const priorityText = issue.ai_priority || 'Not-Assigned';
  const googleMapsEmbedUrl = issue ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${issue.latitude},${issue.longitude}` : '';
  const googleMapsUrl = issue ? `https://www.google.com/maps?q=${issue.latitude},${issue.longitude}` : '';

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 md:px-6">
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
                {issue.is_duplicate === true && (
                    <Alert variant="destructive" className="rounded-b-none border-b-0">
                        <Bot className="h-4 w-4" />
                        <AlertTitle>Marked as Duplicate by AI</AlertTitle>
                        <AlertDescription>
                            This issue was flagged as a potential duplicate. If this is incorrect, you can restore it.
                            {issue.merged_into && (
                                <>
                                    {' '}
                                    It was merged into issue{' '}
                                    <Link href={`/authority/dashboard/${issue.merged_into}`} className="font-bold underline hover:text-destructive-foreground">
                                        #{issue.merged_into.substring(0, 6)}...
                                    </Link>
                                </>
                            )}
                        </AlertDescription>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="mt-4 bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90">
                                    <Undo2 className="mr-2 h-4 w-4" />
                                    Not Similar
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will mark the issue as unique and restore it to the main dashboard. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleMarkAsNotSimilar} disabled={isUpdating}>
                                        {isUpdating ? <LoaderCircle className="animate-spin" /> : 'Yes, Restore Issue'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </Alert>
                )}
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
                         <div className="flex justify-between items-center">
                           <span className="font-medium text-muted-foreground">Category</span>
                           <span className="font-semibold">{issue.category}</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="font-medium text-muted-foreground">Priority</span>
                           <Badge className={`${priorityColorClass[priorityText]}`}>{priorityText}</Badge>
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

        <div className="lg:col-span-1 space-y-6">
            <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                    <CardTitle>Update Issue</CardTitle>
                    <CardDescription>Change the status, category, priority, and add comments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <Select value={newCategory || ''} onValueChange={(value) => setNewCategory(value as IssueCategory)} disabled={isUpdating}>
                            <SelectTrigger className={cn(newCategory !== issue.category && 'ring-2 ring-accent')}>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <div className="grid grid-cols-4 gap-2">
                        {priorityOrder.map((p) => {
                          const isActive = newPriority === p;
                          return (
                          <Button
                          key={p}
                          type="button"
                          variant="outline"
                          disabled={isUpdating}
                          onClick={() => setNewPriority(p)}
                          className={cn(
                            "font-semibold transition-all",
                            isActive
                            ? priorityColorClass[p]
                            : "bg-background text-foreground hover:bg-muted"
                          )}
                          >
                            {p}
                            </Button>
                          );
                        })}
                      </div>
                    </div>


                    <div className="space-y-2">
                        <label className="text-sm font-medium">Admin Comments</label>
                        <Textarea
                            placeholder="Provide feedback or notes..."
                            value={adminComments}
                            onChange={(e) => setAdminComments(e.target.value)}
                            className={cn("min-h-[120px]", adminComments !== (issue.admin_comments || '') && 'ring-2 ring-accent')}
                            disabled={isUpdating}
                        />
                    </div>
                    <Button onClick={handleUpdate} disabled={isUpdating || !hasChanges} className="w-full">
                        {isUpdating && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        {isUpdating ? 'Updating...' : 'Save Changes'}
                    </Button>
                </CardContent>
            </Card>
            
            <Card className="rounded-2xl shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>Location</CardTitle>
                  <CardDescription>
                    {issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}
                  </CardDescription>
                </div>
                <MapPin className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Link href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="block aspect-video w-full overflow-hidden rounded-lg border relative group">
                  {googleMapsEmbedUrl && (
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={googleMapsEmbedUrl}
                      title={`Map location for ${issue.title}`}
                    ></iframe>
                  )}
                   <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white font-bold bg-black/50 px-4 py-2 rounded-lg">View on Google Maps</p>
                    </div>
                </Link>
              </CardContent>
            </Card>
            
            <SimilarComplaints issueId={issueId} />
        </div>
      </div>
    </div>
  );
}
