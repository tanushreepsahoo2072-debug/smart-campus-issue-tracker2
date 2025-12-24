
'use client';

import Image from 'next/image';
import { useMemo } from 'react';

interface IssueMapProps {
  latitude: number;
  longitude: number;
}

export default function IssueMap({ latitude, longitude }: IssueMapProps) {
  const mapImageUrl = useMemo(() => {
    if (!latitude || !longitude) {
      return "https://placehold.co/600x400?text=No+Location+Provided";
    }
    
    // Using a static map provider that constructs a map from coordinates.
    // This is a placeholder for visualization and does not require an API key for basic use.
    // For a real interactive map, a service like Google Maps with an API key would be necessary.
    
    // Using MapQuest static map API as it allows basic marker display without a key for limited use.
    // A proper key would be needed for production.
    const apiKey = 'YOUR_STATIC_MAP_API_KEY'; // In a real app, this would be an env variable.
    return `https://www.mapquestapi.com/staticmap/v5/map?key=${apiKey}&center=${latitude},${longitude}&zoom=15&size=600,400@2x&markers=marker-red-md-${latitude},${longitude}`;

  }, [latitude, longitude]);

  if (!latitude || !longitude) {
    return (
        <div className="relative h-full w-full bg-muted flex items-center justify-center">
            <div className="rounded-lg bg-background/80 p-3 text-center text-sm font-semibold text-foreground backdrop-blur-sm">
                <p>Location Not Provided</p>
            </div>
        </div>
    )
  }

  return (
    <div className="relative h-full w-full bg-muted">
      <Image
        src={mapImageUrl}
        alt="Map showing issue location"
        fill
        className="object-cover"
        data-ai-hint="map location"
        onError={(e) => {
            // Fallback for when the map API fails (e.g. key missing)
            e.currentTarget.src = "https://placehold.co/600x400?text=Map+Preview+Unavailable";
        }}
      />
       <div className="absolute inset-0 flex items-center justify-center bg-black/30">
        <div className="rounded-lg bg-background/80 p-3 text-center text-sm font-semibold text-foreground backdrop-blur-sm">
          <p>Static Map Preview</p>
          <p className="text-xs font-normal">Location: {latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
        </div>
      </div>
    </div>
  );
}
