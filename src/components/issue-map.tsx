"use client";

import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { useMemo } from "react";
import type { Issue } from "@/types/issue";
import { Skeleton } from "./ui/skeleton";
import { AlertTriangle, MapPin } from "lucide-react";
import { Card, CardContent } from "./ui/card";

// Combine your props into one interface
interface IssueMapProps {
  issue: Issue;
  location: google.maps.LatLngLiteral;
}

function MissingApiKeyError() {
    return (
        <Card className="h-full w-full flex flex-col items-center justify-center bg-amber-500/10 border-amber-500/50">
            <CardContent className="text-center p-4">
                <MapPin className="mx-auto h-8 w-8 text-amber-600 mb-2" />
                <p className="text-sm font-semibold text-amber-800">API Key Missing</p>
                <p className="text-xs text-amber-700/80 max-w-sm mx-auto mt-1">
                    Please add your Google Maps API key to the <code className="font-mono bg-amber-200/50 px-1 py-0.5 rounded">.env.local</code> file to display the map.
                </p>
            </CardContent>
        </Card>
    );
}


export function IssueMap({ issue, location }: IssueMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY") {
    return <MissingApiKeyError />;
  }

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  // Use the 'location' prop passed from the parent for the center
  const center = useMemo(() => location, [location]);

  if (loadError) {
    return (
      <Card className="h-full w-full flex flex-col items-center justify-center bg-destructive/10 border-destructive/50">
        <CardContent className="text-center p-4">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-2" />
          <p className="text-sm font-semibold text-destructive">Map Error</p>
          <p className="text-xs text-destructive/80">Could not load map. Check API key and project settings.</p>
        </CardContent>
      </Card>
    );
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
