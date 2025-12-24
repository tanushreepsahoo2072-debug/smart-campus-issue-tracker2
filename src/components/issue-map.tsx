"use client";

import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { useMemo } from "react";
import type { Issue } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface IssueMapProps {
  issue: Issue;
}

export function IssueMap({ issue }: IssueMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const center = useMemo(
    () => ({
      lat: issue.location.lat,
      lng: issue.location.lng,
    }),
    [issue.location]
  );

  if (loadError) {
    return (
        <Card className="h-full w-full flex flex-col items-center justify-center bg-destructive/10 border-destructive/50">
            <CardContent className="text-center p-4">
                <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-2" />
                <p className="text-sm font-semibold text-destructive">Map Error</p>
                <p className="text-xs text-destructive/80">Could not load map. Please check the API key and project settings.</p>
            </CardContent>
        </Card>
    )
  }

  if (!isLoaded) {
    return <Skeleton className="h-full w-full" />;
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={center}
      zoom={16}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      <MarkerF position={center} title={issue.title} />
    </GoogleMap>
  );
}
