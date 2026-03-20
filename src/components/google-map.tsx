"use client"

import React, { useMemo, useState, useEffect, useRef } from "react"
import { AlertTriangle, Loader2, Navigation } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { GoogleMap as GoogleMapBase, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api'

interface GoogleMapProps {
  className?: string
  address?: string
  origin?: string | { lat: number, lng: number }
  destination?: string | { lat: number, lng: number }
  lat?: number
  lng?: number
  zoom?: number
  markers?: Array<{ lat: number, lng: number, type?: 'start' | 'end' | 'incident' | 'guardian' | 'meeting' | 'current' }>
  interactive?: boolean
  variant?: 'active' | 'alert' | 'hero'
  onRouteInfo?: (info: { distance: string, duration: string } | null) => void
}

const containerStyle = {
  width: '100%',
  height: '100%'
};

const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

// Navigation-optimized map styles for better road visibility
const navigationStyles = [
  {
    "featureType": "all",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#444444"}]
  },
  {
    "featureType": "landscape",
    "elementType": "all",
    "stylers": [{"color": "#f5f5f5"}]
  },
  {
    "featureType": "road",
    "elementType": "all",
    "stylers": [{"saturation": -100}, {"lightness": 45}]
  },
  {
    "featureType": "road.highway",
    "elementType": "all",
    "stylers": [{"visibility": "simplified"}]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.icon",
    "stylers": [{"visibility": "off"}]
  },
  {
    "featureType": "transit",
    "elementType": "all",
    "stylers": [{"visibility": "off"}]
  },
  {
    "featureType": "water",
    "elementType": "all",
    "stylers": [{"color": "#2280B3"}, {"visibility": "on"}, {"opacity": 0.2}]
  }
];

export function GoogleMap({ 
  className, 
  address, 
  origin,
  destination,
  lat,
  lng,
  zoom = 15,
  markers = [], 
  interactive = true,
  variant = 'active',
  onRouteInfo
}: GoogleMapProps) {
  const apiKey = "AIzaSyA_zfRnZdq83nF6g6-LLYR3Uy3AM8wqAZ4";
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES
  });

  // Stabilize waypoints using literals to avoid "google.maps is not a constructor" before loading
  const mapWaypoints = useMemo(() => {
    return markers
      .filter(m => m.type === 'meeting')
      .map(m => ({
        location: { lat: m.lat, lng: m.lng },
        stopover: true
      }));
  }, [JSON.stringify(markers.filter(m => m.type === 'meeting'))]);

  const lastParams = useRef("");

  useEffect(() => {
    if (!isLoaded || !origin || !destination) {
      if (directions) setDirections(null);
      return;
    }

    const currentParams = JSON.stringify({ origin, destination, mapWaypoints });
    if (currentParams === lastParams.current) return;
    lastParams.current = currentParams;

    const directionsService = new google.maps.DirectionsService();
    
    const request: google.maps.DirectionsRequest = {
      origin: typeof origin === 'string' ? origin : { lat: origin.lat, lng: origin.lng },
      destination: typeof destination === 'string' ? destination : { lat: destination.lat, lng: destination.lng },
      waypoints: mapWaypoints,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        setDirections(result);
        
        if (onRouteInfo && result.routes[0]?.legs) {
          const totalDistance = result.routes[0].legs.reduce((acc, leg) => acc + (leg.distance?.value || 0), 0);
          const totalDuration = result.routes[0].legs.reduce((acc, leg) => acc + (leg.duration?.value || 0), 0);
          
          onRouteInfo({
            distance: (totalDistance / 1000).toFixed(1) + " km",
            duration: Math.ceil(totalDuration / 60) + " mins"
          });
        }
      } else {
        console.error(`Directions request failed due to ${status}`);
        setDirections(null);
      }
    });
  }, [isLoaded, origin, destination, mapWaypoints]);

  const handleExternalNavigation = () => {
    const meetingPoint = markers.find(m => m.type === 'meeting');
    let url = "";

    if (origin && destination) {
      const originStr = typeof origin === 'string' ? encodeURIComponent(origin) : `${origin.lat},${origin.lng}`;
      const destStr = typeof destination === 'string' ? encodeURIComponent(destination) : `${destination.lat},${destination.lng}`;
      url = `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=driving`;
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

  const center = useMemo(() => ({
    lat: lat || 18.5204,
    lng: lng || 73.8567
  }), [lat, lng]);

  if (!apiKey) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-muted/50 rounded-[2rem] border-4 border-dashed p-8 text-center gap-4", className)}>
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black uppercase tracking-widest">Maps API Key Missing</p>
          <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">Check your environment variables or Firebase config.</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-destructive/5 rounded-[2rem] border-4 border-destructive/20 p-8 text-center gap-4", className)}>
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-sm font-black uppercase tracking-widest text-destructive">Map Load Error</p>
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
          fullscreenControl: interactive,
          styles: navigationStyles
        }}
      >
        {directions && (
          <DirectionsRenderer
            options={{
              directions: directions,
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#2280B3",
                strokeWeight: 8,
                strokeOpacity: 0.9
              }
            }}
          />
        )}

        {markers.map((marker, i) => {
          let label = undefined;
          let color = "#2280B3";
          
          if (marker.type === 'start') {
            if (lat && lng && Math.abs(lat - marker.lat) < 0.001) return null;
            label = { text: "A", color: "white", fontWeight: "bold" };
            color = "#ef4444";
          } else if (marker.type === 'end') {
            label = { text: "B", color: "white", fontWeight: "bold" };
            color = "#ef4444";
          } else if (marker.type === 'meeting') {
            color = "#10b981";
          }

          return (
            <Marker 
              key={`marker-${marker.type}-${marker.lat}-${marker.lng}-${i}`} 
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

        {(lat && lng) && (
          <Marker 
            position={{ lat, lng }} 
            zIndex={1000}
            icon={{
              path: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z",
              fillColor: "#2280B3",
              fillOpacity: 1,
              strokeWeight: 3,
              strokeColor: "#ffffff",
              scale: 2,
              anchor: new google.maps.Point(12, 12),
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
