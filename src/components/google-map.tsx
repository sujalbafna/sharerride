
"use client"

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react"
import { MapPin, Navigation, Shield, ZoomIn, ZoomOut, Loader2, Flag, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { GoogleMap as GoogleMapBase, useJsApiLoader, Marker, DirectionsService, DirectionsRenderer } from '@react-google-maps/api'

interface GoogleMapProps {
  className?: string
  address?: string
  origin?: string
  destination?: string
  lat?: number
  lng?: number
  zoom?: number
  markers?: Array<{ lat: number, lng: number, type?: 'start' | 'end' | 'incident' | 'guardian' }>
  interactive?: boolean
  variant?: 'active' | 'alert' | 'hero'
}

const containerStyle = {
  width: '100%',
  height: '100%'
};

const libraries: ("places")[] = ["places"];

export function GoogleMap({ 
  className, 
  address, 
  origin,
  destination,
  lat,
  lng,
  zoom = 14, 
  markers = [], 
  interactive = true,
  variant = 'active'
}: GoogleMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const directionsRequested = useRef(false);
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || "",
    libraries: libraries
  });

  // Reset directions when origin or destination changes
  useEffect(() => {
    setDirections(null);
    directionsRequested.current = false;
  }, [origin, destination]);

  const directionsCallback = useCallback((result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
    if (result !== null && status === 'OK' && !directionsRequested.current) {
      setDirections(result);
      directionsRequested.current = true;
    }
  }, []);

  if (!apiKey) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-muted/50 rounded-[2rem] border-4 border-dashed p-8 text-center gap-4", className)}>
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black uppercase tracking-widest">Maps API Key Missing</p>
          <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file to enable live tracking.</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-destructive/5 rounded-[2rem] border-4 border-destructive/20 p-8 text-center gap-2", className)}>
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <p className="text-xs font-bold text-destructive uppercase tracking-widest">Map Load Error</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={cn("flex items-center justify-center bg-muted rounded-[2rem] border-4 border-card", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const center = {
    lat: lat || 12.9716,
    lng: lng || 77.5946
  };

  return (
    <div className={cn("relative rounded-[2rem] overflow-hidden border-4 border-card shadow-2xl group", className)}>
      <GoogleMapBase
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        options={{
          disableDefaultUI: !interactive,
          zoomControl: interactive,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              "featureType": "all",
              "elementType": "labels.text.fill",
              "stylers": [{"color": "#746855"}]
            },
            {
              "featureType": "water",
              "elementType": "geometry.fill",
              "stylers": [{"color": "#c9c9c9"}]
            }
          ]
        }}
      >
        {/* Directions API Integration */}
        {origin && destination && !directions && (
          <DirectionsService
            options={{
              destination: destination,
              origin: origin,
              travelMode: google.maps.TravelMode.DRIVING
            }}
            callback={directionsCallback}
          />
        )}

        {/* Directions Rendering */}
        {directions && (
          <DirectionsRenderer
            options={{
              directions: directions,
              polylineOptions: {
                strokeColor: "#2280B3",
                strokeWeight: 6,
                strokeOpacity: 0.8
              }
            }}
          />
        )}

        {/* Single Marker fallback if no directions */}
        {!directions && (
          <Marker 
            position={center} 
            icon={{
              path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
              fillColor: variant === 'alert' ? "#ef4444" : "#2280B3",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#ffffff",
              scale: 1.5,
            }}
          />
        )}
        
        {/* Additional markers (guards, friends, etc) */}
        {markers.map((marker, i) => (
          <Marker key={i} position={{ lat: marker.lat, lng: marker.lng }} />
        ))}
      </GoogleMapBase>

      {interactive && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="bg-card/90 backdrop-blur-md px-4 py-2 rounded-xl border shadow-lg flex items-center gap-2 max-w-[70%] pointer-events-auto">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="text-[10px] font-bold uppercase truncate">{address || (directions ? "Route Tracking" : "Live Location Active")}</span>
          </div>
          <Button size="icon" className="h-12 w-12 rounded-2xl shadow-xl shadow-primary/30 pointer-events-auto">
            <Navigation className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
