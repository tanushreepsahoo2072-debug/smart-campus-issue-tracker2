"use client";

import { useMemo } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { AlertTriangle, MapPin } from "lucide-react";

import type { Issue } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
    [issue.location.lat, issue.location.lng]
  );

  /* ------------------------------ Error State ------------------------------ */
  if (loadError) {
    return (
      <Card className="h-full border-destructive/50 bg-destructive/10">
        <CardContent className="flex flex-col items-center justify-center gap-2 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-semibold text-destructive">
            Map failed to load
          </p>
          <p className="text-xs text-destructive/80">
            Please check Google Maps API key and billing settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  /* ----------------------------- Loading State ----------------------------- */
  if (!isLoaded) {
    return <Skeleton className="h-full w-full rounded-lg" />;
  }

  /* ----------------------------- Map Loaded ----------------------------- */
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5" />
          Issue Location
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="h-64 w-full overflow-hidden rounded-lg border">
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
        </div>
      </CardContent>
    </Card>
  );
}
