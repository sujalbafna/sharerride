
"use client"

import React, { useMemo } from "react"
import Image from "next/image"
import { MapPin, Navigation, Shield, ZoomIn, ZoomOut, Layers, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { GoogleMap as GoogleMapBase, useJsApiLoader, Marker } from '@react-google-maps/api'

interface GoogleMapProps {
  className?: string
  address?: string
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

export function GoogleMap({ 
  className, 
  address, 
  lat,
  lng,
  zoom = 14, 
  markers = [], 
  interactive = true,
  variant = 'active'
}: GoogleMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || ""
  });

  const mapImage = PlaceHolderImages.find(img => img.id === `map-${variant}`) || PlaceHolderImages[0]

  // Fallback to simulation if no API key or load error
  if (!apiKey || loadError) {
    return (
      <div className={cn("relative rounded-[2rem] overflow-hidden bg-muted border-4 border-card shadow-2xl group", className)}>
        {/* Simulated Map Background */}
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
          <Image
            src={mapImage.imageUrl}
            alt={mapImage.description}
            fill
            className="object-cover opacity-60 grayscale-[0.2]"
            data-ai-hint={mapImage.imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
        </div>

        {/* Simulated UI Overlays */}
        {interactive && (
          <>
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button size="icon" variant="secondary" className="h-10 w-10 rounded-xl shadow-lg bg-card/90 backdrop-blur-md">
                <Layers className="h-5 w-5" />
              </Button>
              <div className="flex flex-col rounded-xl overflow-hidden shadow-lg border bg-card/90 backdrop-blur-md">
                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-none border-b">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-none">
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="bg-card/90 backdrop-blur-md px-4 py-2 rounded-xl border shadow-lg flex items-center gap-2 max-w-[70%]">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="text-[10px] font-bold uppercase truncate">{address || "Real-time Tracking Active"}</span>
              </div>
              <Button size="icon" className="h-12 w-12 rounded-2xl shadow-xl shadow-primary/30">
                <Navigation className="h-6 w-6" />
              </Button>
            </div>
          </>
        )}

        {/* Simulated Markers */}
        <div className="absolute inset-0 flex items-center justify-center">
          {variant === 'active' && (
            <div className="relative">
               <div className="absolute -inset-8 bg-primary/20 rounded-full animate-ping" />
               <div className="relative h-6 w-6 bg-primary rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                 <div className="h-1.5 w-1.5 bg-white rounded-full" />
               </div>
            </div>
          )}
          
          {variant === 'alert' && (
            <div className="relative">
               <div className="absolute -inset-10 bg-destructive/30 rounded-full animate-ping" />
               <MapPin className="h-10 w-10 text-destructive drop-shadow-2xl fill-destructive/20" />
            </div>
          )}

          {markers.map((marker, i) => (
            <div 
              key={i} 
              className="absolute"
              style={{ 
                top: `${50 + (i * 10)}%`, 
                left: `${50 + (i * 15)}%` 
              }}
            >
               <Shield className="h-6 w-6 text-accent drop-shadow-lg" />
            </div>
          ))}
        </div>

        <div className="absolute bottom-1 right-2 text-[8px] font-medium opacity-40 select-none">
          Simulated Map View
        </div>
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
        <Marker 
          position={center} 
          icon={{
            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
            fillColor: variant === 'alert' ? "#ef4444" : "#2563eb",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
            scale: 1.5,
          }}
        />
        
        {markers.map((marker, i) => (
          <Marker key={i} position={{ lat: marker.lat, lng: marker.lng }} />
        ))}
      </GoogleMapBase>

      {interactive && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="bg-card/90 backdrop-blur-md px-4 py-2 rounded-xl border shadow-lg flex items-center gap-2 max-w-[70%] pointer-events-auto">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="text-[10px] font-bold uppercase truncate">{address || "Live Location Active"}</span>
          </div>
          <Button size="icon" className="h-12 w-12 rounded-2xl shadow-xl shadow-primary/30 pointer-events-auto">
            <Navigation className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
