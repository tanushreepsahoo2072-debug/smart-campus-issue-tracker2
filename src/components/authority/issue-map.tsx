'use client';

import { useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { LoaderCircle } from 'lucide-react';

interface IssueMapProps {
  location: string;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

export default function IssueMap({ location }: IssueMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const center = useMemo(() => {
    if (!location) return { lat: 0, lng: 0 };
    const [lat, lng] = location.split(',').map(Number);
    if (isNaN(lat) || isNaN(lng)) return { lat: 0, lng: 0 };
    return { lat, lng };
  }, [location]);

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center bg-destructive/10 text-destructive">
        <p>Error loading map. Please check the API key.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center bg-muted">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
    >
      <Marker position={center} />
    </GoogleMap>
  );
}
