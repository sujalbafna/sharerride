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
  markers?: Array<{ lat: number, lng: number, type?: 'start' | 'end' | 'incident' | 'guardian' | 'meeting' }>
  interactive?: boolean
  variant?: 'active' | 'alert' | 'hero'
  onRouteInfo?: (info: { distance: string, duration: string } | null) => void
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
  variant = 'active',
  onRouteInfo
}: GoogleMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const directionsRequested = useRef(false);
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
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
      
      if (onRouteInfo && result.routes[0]?.legs[0]) {
        const totalDistance = result.routes[0].legs.reduce((acc, leg) => acc + (leg.distance?.value || 0), 0);
        const totalDuration = result.routes[0].legs.reduce((acc, leg) => acc + (leg.duration?.value || 0), 0);
        
        onRouteInfo({
          distance: (totalDistance / 1000).toFixed(1) + " km",
          duration: Math.ceil(totalDuration / 60) + " mins"
        });
      }
    }
  }, [onRouteInfo]);

  const handleExternalNavigation = () => {
    const meetingPoint = markers.find(m => m.type === 'meeting');
    let url = "";

    if (origin && destination) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
      if (meetingPoint) {
        url += `&waypoints=${meetingPoint.lat},${meetingPoint.lng}`;
      }
    } else if (lat && lng) {
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else if (address) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }

    if (url) {
      window.open(url, '_blank');
    }
  };

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

  const mapWaypoints = markers
    .filter(m => m.type === 'meeting')
    .map(m => ({
      location: new google.maps.LatLng(m.lat, m.lng),
      stopover: true
    }));

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
        {origin && destination && !directions && (
          <DirectionsService
            options={{
              destination: destination,
              origin: origin,
              waypoints: mapWaypoints,
              travelMode: google.maps.TravelMode.DRIVING
            }}
            callback={directionsCallback}
          />
        )}

        {directions && (
          <DirectionsRenderer
            options={{
              directions: directions,
              suppressMarkers: true, // IMPORTANT: Remove Google's A, B, C markers
              polylineOptions: {
                strokeColor: "#2280B3",
                strokeWeight: 6,
                strokeOpacity: 0.8
              }
            }}
          />
        )}

        {/* Custom Marker Logic: A, B, and Green Meeting Point */}
        {markers.map((marker, i) => {
          let label = undefined;
          let color = "#2280B3";
          
          if (marker.type === 'start') {
            label = { text: "A", color: "white", fontWeight: "bold" };
            color = "#ef4444"; // Red for A
          } else if (marker.type === 'end') {
            label = { text: "B", color: "white", fontWeight: "bold" };
            color = "#ef4444"; // Red for B
          } else if (marker.type === 'meeting') {
            color = "#10b981"; // Green for Meeting Point
          }

          return (
            <Marker 
              key={i} 
              position={{ lat: marker.lat, lng: marker.lng }} 
              label={label}
              icon={{
                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
                fillColor: color,
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#ffffff",
                scale: 1.5,
                labelOrigin: new google.maps.Point(12, 9)
              }}
            />
          );
        })}

        {/* Fallback Single Marker if no markers/directions */}
        {!directions && markers.length === 0 && (
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
      </GoogleMapBase>

      {interactive && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-end pointer-events-none">
          <Button 
            size="icon" 
            className="h-12 w-12 rounded-2xl shadow-xl shadow-primary/30 pointer-events-auto hover:scale-105 active:scale-95 transition-all"
            onClick={handleExternalNavigation}
            title="Open in Google Maps"
          >
            <Navigation className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}