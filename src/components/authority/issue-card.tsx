'use client';

import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Complaint } from '@/types/complaint';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { FilePenLine, Wrench, CheckCircle, XCircle, Bot } from 'lucide-react';

const statusIcons: { [key: string]: React.ReactNode } = {
  Open: <FilePenLine className="h-4 w-4" />,
  'In Progress': <Wrench className="h-4 w-4" />,
  Resolved: <CheckCircle className="h-4 w-4 text-green-500" />,
  Denied: <XCircle className="h-4 w-4 text-destructive" />,
};

const priorityColorClass: { [key: string]: string } = {
  Critical: 'bg-red-600 border-red-600 text-white',
  High: 'bg-orange-500 border-orange-500 text-white',
  Medium: 'bg-yellow-500 border-yellow-500 text-black',
  Low: 'bg-green-500 border-green-500 text-white',
  'Not-Assigned': 'bg-gray-400 border-gray-400 text-white',
};

type IssueCardProps = {
  complaint: Complaint;
};

export default function IssueCard({ complaint }: IssueCardProps) {
  if (complaint.AI !== 1) {
    return (
      <Card className="flex h-full w-full flex-col items-center justify-center rounded-2xl p-6 shadow-md">
        <Alert>
            <Bot className="h-4 w-4" />
            <AlertTitle>AI Processing</AlertTitle>
            <AlertDescription>
                Issue <span className='font-mono'>{complaint.id}</span> is currently being processed by our AI. Full details will be available shortly.
            </AlertDescription>
        </Alert>
      </Card>
    );
  }

  const statusText = complaint.currentStatus || 'Open';
  const priorityText = complaint.ai_priority || 'Not-Assigned';
  
  return (
    <Card className="flex w-full flex-col overflow-hidden rounded-2xl shadow-lg">
      <CardHeader className="relative p-0">
        <div className="aspect-video w-full bg-muted">
          {complaint.imageUrls && complaint.imageUrls.length > 0 && (
            <Image
              src={complaint.imageUrls[0]}
              alt={complaint.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
        </div>
        <Badge
          className={`absolute left-4 top-4 font-bold ${priorityColorClass[priorityText]}`}
        >
          {priorityText} Priority
        </Badge>
      </CardHeader>
      
      <CardContent className="flex flex-grow flex-col p-6">
        <CardTitle className="text-lg font-bold leading-tight">{complaint.title}</CardTitle>
        <p className="my-4 text-sm text-muted-foreground">{complaint.description}</p>
        
        <Separator className="my-2" />
        
        <div className="mt-2 flex items-center gap-2 text-sm font-medium">
          {statusIcons[statusText]}
          <span>{statusText}</span>
        </div>

        {complaint.admin_comments && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Feedback</p>
            <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/50 p-2 text-sm">
              {complaint.admin_comments}
            </p>
            {complaint.updatedAt && (
              <p className="mt-2 text-xs text-muted-foreground">
                Updated {formatDistanceToNow(new Date(complaint.updatedAt), { addSuffix: true })}
              </p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="mt-auto bg-muted/50 p-3">
        <p className="w-full text-right text-xs text-muted-foreground">
          Reported {complaint.createdAt ? formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true }) : 'just now'}
        </p>
      </CardFooter>
    </Card>
  );
}
