'use client';

import Image from 'next/image';
import { useMemo } from 'react';

interface IssueMapProps {
  location: string;
}

export default function IssueMap({ location }: IssueMapProps) {
  const mapImageUrl = useMemo(() => {
    if (!location) {
      return "https://placehold.co/600x400?text=No+Location+Provided";
    }
    // This is a placeholder static map. 
    // For a real interactive map, a Google Maps API key is needed.
    const [lat, lng] = location.split(',');
    // Using a static map provider that doesn't strictly require an API key for basic use,
    // but in a real app, you'd use a service with an API key.
    return `https://images.unsplash.com/photo-1579548122204-910d6e7c2514?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxtYXAlMjBwbGFjZWhvbGRlcnxlbnwwfHx8fDE3NjYyMDM0NTF8MA&ixlib=rb-4.1.0&q=80&w=1080`;

  }, [location]);

  return (
    <div className="relative h-full w-full bg-muted">
      <Image
        src={mapImageUrl}
        alt="Map showing issue location"
        fill
        className="object-cover"
        data-ai-hint="map placeholder"
      />
       <div className="absolute inset-0 flex items-center justify-center bg-black/30">
        <div className="rounded-lg bg-background/80 p-3 text-center text-sm font-semibold text-foreground backdrop-blur-sm">
          <p>Static Map Preview</p>
          <p className="text-xs font-normal">Location: {location || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}
