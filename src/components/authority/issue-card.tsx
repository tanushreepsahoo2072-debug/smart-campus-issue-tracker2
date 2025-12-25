
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Complaint } from "@/types/complaint";
import { formatDistanceToNow } from 'date-fns';
import { FilePenLine, Wrench, CheckCircle, XCircle } from "lucide-react";
import { IssueMap } from "@/components/issue-map";

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

interface IssueCardProps {
  complaint: Complaint;
}

function IssueCard({ complaint }: IssueCardProps) {
  const priorityText = complaint.ai_priority || 'Not-Assigned';
  const latitude = Number(complaint.latitude);
  const longitude = Number(complaint.longitude);

const locationParts = [latitude, longitude];

  const location: google.maps.LatLngLiteral = {
    lat: complaint.latitude,
    lng: complaint.longitude,
  };

  return (
    <Card className="flex h-full transform-gpu flex-col overflow-hidden rounded-2xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="mb-2 text-lg font-bold leading-tight">{complaint.title}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {complaint.createdAt ? formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true }) : ''}
          </p>
        </div>
        <Badge className={`whitespace-nowrap font-bold ${priorityColorClass[priorityText]}`}>
          {priorityText}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="relative h-40 w-full overflow-hidden rounded-lg border">
          <IssueMap issue={complaint} location={location} />
        </div>
        <Separator />
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">Status</span>
          <div className="flex items-center gap-2 font-semibold">
             {statusIcons[complaint.currentStatus]} {complaint.currentStatus}
          </div>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{complaint.description}</p>
      </CardContent>
    </Card>
  );
}

export default IssueCard;
