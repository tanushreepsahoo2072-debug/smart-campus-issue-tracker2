'use client';

import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Complaint } from '@/types/complaint';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { FilePenLine, Wrench, CheckCircle, XCircle, Bot, ArrowRight } from 'lucide-react';

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

  const statusText = complaint.currentStatus || 'Open';
  const priorityText = complaint.ai_priority || 'Not-Assigned';
  
  return (
    <Card className="flex h-full w-full flex-col overflow-hidden rounded-2xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
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
        <CardTitle className="text-lg font-bold leading-tight line-clamp-2">{complaint.title}</CardTitle>
        <p className="my-4 text-sm text-muted-foreground line-clamp-3">{complaint.description}</p>
        
        <div className="mt-auto flex items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-2">
              {statusIcons[statusText]}
              <span>{statusText}</span>
            </div>
             <p className="text-xs text-muted-foreground">
                {complaint.createdAt ? formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true }) : 'just now'}
            </p>
        </div>
      </CardContent>

      <CardFooter className="mt-auto bg-muted/50 p-3">
        <Button variant="ghost" className="w-full justify-center text-sm font-semibold">
          View Details <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
