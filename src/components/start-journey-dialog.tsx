
"use client"

import { useState, useRef, useCallback } from "react"
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, addDoc, doc } from "firebase/firestore"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navigation, Shield, Loader2, MapPin, Users, Car, Calendar, Clock, AlertCircle, Milestone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api'

// Define libraries outside to prevent re-renders
const LIBRARIES: ("places")[] = ["places"];

export function StartJourneyDialog() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startLoc, setStartLoc] = useState("")
  const [endLoc, setEndLoc] = useState("")
  const [routeVia, setRouteVia] = useState("")
  const [seats, setSeats] = useState("0")
  const [vehicleName, setVehicleName] = useState("")
  const [acStatus, setAcStatus] = useState("AC")
  const [journeyDate, setJourneyDate] = useState("")
  const [journeyTime, setJourneyTime] = useState("")

  const startAutocomplete = useRef<google.maps.places.Autocomplete | null>(null)
  const endAutocomplete = useRef<google.maps.places.Autocomplete | null>(null)
  const routeAutocomplete = useRef<google.maps.places.Autocomplete | null>(null)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES
  })

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData } = useDoc(userRef)
  
  const userName = userData?.firstName && userData?.lastName 
    ? `${userData.firstName} ${userData.lastName}` 
    : (user?.displayName || user?.email?.split('@')[0] || "User")

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "trustedContacts")
  }, [db, user])

  const { data: contacts } = useCollection(contactsQuery)

  const onPlaceChanged = useCallback((type: 'start' | 'end' | 'route') => {
    let autocomplete;
    if (type === 'start') autocomplete = startAutocomplete.current;
    else if (type === 'end') autocomplete = endAutocomplete.current;
    else if (type === 'route') autocomplete = routeAutocomplete.current;

    if (autocomplete) {
      const place = autocomplete.getPlace();
      const address = place.formatted_address || place.name || "";
      if (address) {
        if (type === 'start') setStartLoc(address);
        else if (type === 'end') setEndLoc(address);
        else if (type === 'route') setRouteVia(address);
      }
    }
  }, []);

  const handleStart = async () => {
    if (!user || !db || !startLoc || !endLoc) return

    setIsSubmitting(true)
    const availableSeatsCount = parseInt(seats) || 0
    const currentTimestamp = new Date().toISOString()
    const scheduledTime = journeyDate && journeyTime ? new Date(`${journeyDate}T${journeyTime}`).toISOString() : currentTimestamp
    
    const journeyData = {
      userId: user.uid,
      userName: userName,
      journeyType: "General",
      status: "InProgress",
      startTime: scheduledTime,
      startLocationDescription: startLoc,
      startLatitude: 0,
      startLongitude: 0,
      endLocationDescription: endLoc,
      endLatitude: 0,
      endLongitude: 0,
      routeVia: routeVia,
      sharedWithContactIds: contacts?.map(c => c.appUserId).filter(Boolean) || [],
      availableSeats: availableSeatsCount,
      joinedUserIds: [],
      createdAt: currentTimestamp,
      vehicleName: vehicleName,
      acStatus: acStatus
    }

    try {
      const journeyDoc = await addDoc(collection(db, "users", user.uid, "journeys"), journeyData)
      const journeyId = journeyDoc.id;
      
      if (contacts && contacts.length > 0) {
        const detailString = `${userName} is traveling from ${startLoc} to ${endLoc}${routeVia ? ` via ${routeVia}` : ''}. Vehicle: ${vehicleName || 'Private Vehicle'} (${acStatus}). Departure: ${journeyDate || 'Today'} at ${journeyTime || 'Now'}.`

        for (const friendContact of contacts) {
          if (friendContact.appUserId) {
            await addDoc(collection(db, "users", friendContact.appUserId, "supportRequests"), {
              userId: friendContact.appUserId,
              senderId: user.uid,
              senderName: userName,
              requestType: "JourneyNotification",
              description: detailString,
              timestamp: currentTimestamp,
              status: "Pending",
              targetJourneyId: journeyId,
              startLocation: startLoc,
              endLocation: endLoc,
              routeVia: routeVia,
              vehicleName: vehicleName,
              acStatus: acStatus,
              journeyStartTime: scheduledTime
            })
          }
        }
      }

      toast({
        title: "Journey Started",
        description: `Your itinerary has been broadcasted to your verified friend circle.`,
      })
      setIsOpen(false)
      setStartLoc("")
      setEndLoc("")
      setRouteVia("")
      setSeats("0")
      setVehicleName("")
      setAcStatus("AC")
      setJourneyDate("")
      setJourneyTime("")
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not start journey.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="h-16 px-8 rounded-2xl text-lg font-black bg-primary">
          <Navigation className="mr-2 h-6 w-6" />
          START NEW JOURNEY
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-8 border-none shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Initialize Journey
          </DialogTitle>
          <DialogDescription>
            Enter your route details to notify your network. Select addresses from the Google suggestions for accuracy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Origin</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  {isLoaded ? (
                    <Autocomplete
                      onLoad={(autocomplete) => (startAutocomplete.current = autocomplete)}
                      onPlaceChanged={() => onPlaceChanged('start')}
                    >
                      <Input 
                        id="start" 
                        placeholder="Starting point..." 
                        className="pl-10 h-12 rounded-xl"
                        value={startLoc}
                        onChange={(e) => setStartLoc(e.target.value)}
                      />
                    </Autocomplete>
                  ) : (
                    <Input 
                      id="start" 
                      placeholder="Loading maps..." 
                      className="pl-10 h-12 rounded-xl"
                      disabled
                    />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Destination</Label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  {isLoaded ? (
                    <Autocomplete
                      onLoad={(autocomplete) => (endAutocomplete.current = autocomplete)}
                      onPlaceChanged={() => onPlaceChanged('end')}
                    >
                      <Input 
                        id="end" 
                        placeholder="Where are you going?" 
                        className="pl-10 h-12 rounded-xl"
                        value={endLoc}
                        onChange={(e) => setEndLoc(e.target.value)}
                      />
                    </Autocomplete>
                  ) : (
                    <Input 
                      id="end" 
                      placeholder="Loading maps..." 
                      className="pl-10 h-12 rounded-xl"
                      disabled
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="routeVia">Route Via</Label>
              <div className="relative">
                <Milestone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                {isLoaded ? (
                  <Autocomplete
                    onLoad={(autocomplete) => (routeAutocomplete.current = autocomplete)}
                    onPlaceChanged={() => onPlaceChanged('route')}
                  >
                    <Input 
                      id="routeVia" 
                      placeholder="Enter intermediate stops..." 
                      className="pl-10 h-12 rounded-xl"
                      value={routeVia}
                      onChange={(e) => setRouteVia(e.target.value)}
                    />
                  </Autocomplete>
                ) : (
                  <Input 
                    id="routeVia" 
                    placeholder="Loading maps..." 
                    className="pl-10 h-12 rounded-xl"
                    disabled
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Departure Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="date" 
                    type="date"
                    className="pl-10 h-12 rounded-xl"
                    value={journeyDate}
                    onChange={(e) => setJourneyDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Departure Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="time" 
                    type="time"
                    className="pl-10 h-12 rounded-xl"
                    value={journeyTime}
                    onChange={(e) => setJourneyTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle Name</Label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="vehicle" 
                    placeholder="e.g. White Swift" 
                    className="pl-10 h-12 rounded-xl"
                    value={vehicleName}
                    onChange={(e) => setVehicleName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Comfort Status</Label>
                <RadioGroup value={acStatus} onValueChange={setAcStatus} className="flex h-12 items-center gap-4 bg-secondary/50 rounded-xl px-4 border border-input/20">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="AC" id="ac" />
                    <Label htmlFor="ac" className="text-xs font-bold cursor-pointer">AC</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Non-AC" id="non-ac" />
                    <Label htmlFor="non-ac" className="text-xs font-bold cursor-pointer">NON-AC</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seats">Seats Available</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="seats" 
                  type="number"
                  min="0"
                  placeholder="Enter capacity" 
                  className="pl-10 h-12 rounded-xl"
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-2xl border-l-4 border-primary flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-tight">
              Safety Note: Upon broadcast, your origin, destination, vehicle details, and live GPS location will be shared in real-time with your verified friend circle.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            className="w-full h-14 rounded-2xl font-black text-lg bg-primary shadow-xl" 
            onClick={handleStart}
            disabled={isSubmitting || !startLoc || !endLoc}
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            BROADCAST ITINERARY
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
