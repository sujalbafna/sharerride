"use client"

import { useState, useEffect, useMemo, useRef, Suspense, useCallback } from "react"
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, orderBy, limit, doc, updateDoc, getDocs, where, addDoc, increment, arrayUnion } from "firebase/firestore"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Compass, 
  Clock, 
  History, 
  Loader2, 
  ShieldCheck, 
  Menu,
  Users,
  Play,
  ArrowLeft,
  User,
  Activity,
  Handshake,
  Edit2,
  Save,
  Route,
  AlertTriangle,
  ShieldAlert,
  Settings2,
  GpsFixed,
  UserPlus,
  X
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { StartJourneyDialog } from "@/components/start-journey-dialog"
import { GoogleMap } from "@/components/google-map"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSearchParams, useRouter } from "next/navigation"
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api'
import { Input } from "@/components/ui/input"
import { EmergencyContactsDialog } from "@/components/emergency-contacts-dialog"
import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"

const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

function JourneyContent() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const riderIdParam = searchParams.get("riderId")
  const journeyIdParam = searchParams.get("journeyId")

  const [mounted, setMounted] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'unsupported'>('loading')
  const [meetingPointInput, setMeetingPointInput] = useState("")
  const [meetingPointCoords, setMeetingPointCoords] = useState<{lat: number, lng: number} | null>(null)
  const [isUpdatingMeetingPoint, setIsUpdatingMeetingPoint] = useState(false)
  const [routeInfo, setRouteInfo] = useState<{ distance: string, duration: string } | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const apiKey = "AIzaSyA_zfRnZdq83nF6g6-LLYR3Uy3AM8wqAZ4";

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
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

  const sharedJourneyRef = useMemoFirebase(() => {
    if (!db || !riderIdParam || !journeyIdParam) return null
    return doc(db, "users", riderIdParam, "journeys", journeyIdParam)
  }, [db, riderIdParam, journeyIdParam])
  const { data: sharedJourney, isLoading: isLoadingShared } = useDoc(sharedJourneyRef)

  const journeysQuery = useMemoFirebase(() => {
    if (!db || !user || riderIdParam) return null
    return query(
      collection(db, "users", user.uid, "journeys"),
      orderBy("startTime", "desc"),
      limit(10)
    )
  }, [db, user, riderIdParam])
  const { data: myJourneys, isLoading: isLoadingMy } = useCollection(journeysQuery)

  const activeJourney = riderIdParam && sharedJourney ? sharedJourney : myJourneys?.find(j => j.status === 'InProgress' || j.status === 'Broadcasted')
  const isRider = activeJourney && (!riderIdParam || riderIdParam === user?.uid)

  // Join Requests specifically for this active journey
  const joinRequestsQuery = useMemoFirebase(() => {
    if (!db || !user || !activeJourney || !isRider) return null
    return query(
      collection(db, "users", user.uid, "supportRequests"),
      where("status", "==", "Pending"),
      where("requestType", "==", "JoinJourneyRequest"),
      where("targetJourneyId", "==", activeJourney.id)
    )
  }, [db, user, activeJourney?.id, isRider])

  const { data: pendingJoinRequests } = useCollection(joinRequestsQuery)

  const joinedFriendsQuery = useMemoFirebase(() => {
    if (!db || !activeJourney?.joinedUserIds || activeJourney.joinedUserIds.length === 0) return null
    return query(
      collection(db, "publicProfiles"),
      where("userId", "in", activeJourney.joinedUserIds)
    )
  }, [db, activeJourney?.joinedUserIds])
  const { data: joinedFriendsData } = useCollection(joinedFriendsQuery)

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "trustedContacts")
  }, [db, user])
  const { data: contacts } = useCollection(contactsQuery)

  useEffect(() => {
    if (isRider && activeJourney?.status === 'InProgress' && userLocation && db && user) {
      const journeyRef = doc(db, "users", user.uid, "journeys", activeJourney.id)
      updateDoc(journeyRef, {
        currentLat: userLocation.lat,
        currentLng: userLocation.lng,
        lastLocationUpdate: new Date().toISOString()
      }).catch(() => {})
    }
  }, [isRider, activeJourney?.status, userLocation, db, user, activeJourney?.id])

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('unsupported')
      return
    }

    const startTracking = () => {
      navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setLocationStatus('granted')
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setLocationStatus('denied')
          }
        },
        { enableHighAccuracy: true }
      )
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationStatus(result.state as any)
        if (result.state === 'granted') {
          startTracking()
        }
        result.onchange = () => {
          setLocationStatus(result.state as any)
          if (result.state === 'granted') startTracking()
        }
      })
    } else {
      startTracking()
    }
  }, [])

  const handleRequestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationStatus('granted')
        toast({ title: "Location Enabled", description: "Live tracking is now active." })
      },
      (err) => {
        setLocationStatus('denied')
        toast({ 
          variant: "destructive", 
          title: "Permission Denied", 
          description: "Please enable location in your browser settings to use live tracking." 
        })
      }
    )
  }

  const handleQuickSOS = async () => {
    if (!user || !db || !userData?.emergencySmsNumbers?.length) {
      toast({ 
        variant: "destructive", 
        title: "Setup Required", 
        description: "Please configure emergency mobile numbers using the edit button below the map." 
      })
      return
    }

    toast({ title: "Initializing SOS", description: "Acquiring precise GPS location..." })

    try {
      const getPos = (): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
        });
      }

      let currentCoords = userLocation;
      try {
        if (!currentCoords) {
          const freshPos = await getPos();
          currentCoords = { lat: freshPos.coords.latitude, lng: freshPos.coords.longitude };
          setUserLocation(currentCoords);
        }
      } catch (gpsError) {
        console.error("GPS Acquisition failed", gpsError);
      }

      if (!currentCoords) {
        toast({ variant: "destructive", title: "GPS Error", description: "Could not acquire location coordinates. Please ensure GPS is active." });
        return;
      }

      const locStr = `${currentCoords.lat},${currentCoords.lng}`
      const googleMapsUrl = `https://www.google.com/maps?q=${locStr}`
      
      const finalMessage = `Emergency! I need immediate help. Please respond urgently.\n\nTrack Live: ${googleMapsUrl}`
      
      const numbers = userData.emergencySmsNumbers.filter(n => n.trim() !== "").join(",")
      window.location.href = `sms:${numbers}?body=${encodeURIComponent(finalMessage)}`

      addDoc(collection(db, "users", user.uid, "emergencyAlerts"), {
        userId: user.uid,
        timestamp: new Date().toISOString(),
        alertLocationDescription: "Live Transit SOS",
        alertLatitude: currentCoords.lat,
        alertLongitude: currentCoords.lng,
        alertMessage: finalMessage,
        status: "Sent",
        emergencyType: "QuickSOS",
        recipientsContactIds: []
      })

      toast({
        title: "SOS Protocol Ready",
        description: `Emergency coordinates attached for ${userData.emergencySmsNumbers.length} contacts. Please tap send in your message app.`,
      })
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "SOS Failed", description: "Could not initialize emergency protocol." })
    }
  }

  const handleStartJourney = async () => {
    if (!db || !user || !activeJourney || !isRider) return
    const journeyRef = doc(db, "users", user.uid, "journeys", activeJourney.id)
    try {
      await updateDoc(journeyRef, { status: "InProgress" })
      toast({ title: "Live Tracking Activated", description: "Your safety network is now monitoring your transit." })
    } catch (e) {
      console.error(e)
    }
  }

  const handleEndJourney = async () => {
    if (!db || !user || !activeJourney || !isRider) return
    const journeyId = activeJourney.id
    const journeyRef = doc(db, "users", user.uid, "journeys", journeyId)
    const currentTimestamp = new Date().toISOString()
    
    try {
      await updateDoc(journeyRef, {
        status: "Completed",
        endTime: currentTimestamp
      })

      if (contacts && contacts.length > 0) {
        for (const friendContact of contacts) {
          const friendId = friendContact.appUserId;
          if (!friendId) continue;

          const q = query(
            collection(db, "users", friendId, "supportRequests"),
            where("status", "==", "Pending"),
            where("targetJourneyId", "==", journeyId)
          )
          const snap = await getDocs(q)
          for (const d of snap.docs) {
            updateDoc(doc(db, "users", friendId, "supportRequests", d.id), {
              status: "Completed"
            })
          }

          await addDoc(collection(db, "users", friendId, "supportRequests"), {
            userId: friendId,
            senderId: user.uid,
            senderName: userName,
            requestType: "JourneyEndNotification",
            description: `has ended a journey from ${activeJourney.startLocationDescription} to ${activeJourney.endLocationDescription}.`,
            timestamp: currentTimestamp,
            status: "Pending",
            targetJourneyId: journeyId
          })
        }
      }

      toast({ title: "Journey Completed", description: "You have safely ended your journey." })
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
        path: journeyRef.path,
        operation: 'update',
        requestResourceData: { status: "Completed" },
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  }

  const handleApproveJoin = async (req: any) => {
    if (!db || !user || !activeJourney) return
    try {
      const journeyRef = doc(db, "users", user.uid, "journeys", activeJourney.id)
      await updateDoc(journeyRef, {
        availableSeats: increment(-1),
        joinedUserIds: arrayUnion(req.senderId)
      })

      await addDoc(collection(db, "users", req.senderId, "supportRequests"), {
        userId: req.senderId,
        senderId: user.uid,
        senderName: userName,
        requestType: "JoinApproved",
        description: "approved your request to join the journey.",
        timestamp: new Date().toISOString(),
        status: "Pending",
        targetJourneyId: activeJourney.id,
        riderId: user.uid
      })

      await updateDoc(doc(db, "users", user.uid, "supportRequests", req.id), { status: "Accepted" })
      toast({ title: "Companion Approved", description: `${req.senderName} has joined your transit.` })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to approve request." })
    }
  }

  const handleDeclineJoin = async (req: any) => {
    if (!db || !user) return
    try {
      await updateDoc(doc(db, "users", user.uid, "supportRequests", req.id), { status: "Declined" })
      toast({ title: "Request Declined", description: "The request has been removed." })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to decline request." })
    }
  }

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace()
      const address = place.formatted_address || place.name
      const location = place.geometry?.location
      
      if (address) {
        setMeetingPointInput(address)
      }
      if (location) {
        setMeetingPointCoords({
          lat: location.lat(),
          lng: location.lng()
        })
      }
    }
  }

  const handleSaveMeetingPoint = async () => {
    if (!db || !activeJourney || !meetingPointInput.trim()) return
    setIsUpdatingMeetingPoint(true)
    const riderId = riderIdParam || user?.uid
    if (!riderId) return

    const journeyRef = doc(db, "users", riderId, "journeys", activeJourney.id)
    try {
      await updateDoc(journeyRef, {
        meetingPoint: meetingPointInput.trim(),
        meetingPointLat: meetingPointCoords?.lat || null,
        meetingPointLng: meetingPointCoords?.lng || null
      })
      toast({ title: "Meeting Point Set", description: "The rider has been notified of the rendezvous location." })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update meeting point." })
    } finally {
      setIsUpdatingMeetingPoint(false)
    }
  }

  // Memoize handleRouteInfo to prevent infinite render loop in GoogleMap
  const handleRouteInfo = useCallback((info: { distance: string, duration: string } | null) => {
    setRouteInfo(prev => {
      if (prev?.distance === info?.distance && prev?.duration === info?.duration) return prev;
      return info;
    });
  }, []);

  const navigationOrigin = useMemo(() => {
    if (activeJourney?.status === 'InProgress') {
      if (isRider) return userLocation || activeJourney.startLocationDescription;
      if (activeJourney.currentLat && activeJourney.currentLng) {
        return { lat: activeJourney.currentLat, lng: activeJourney.currentLng };
      }
    }
    if (activeJourney?.startLatitude && activeJourney?.startLongitude) {
      return { lat: activeJourney.startLatitude, lng: activeJourney.startLongitude };
    }
    return activeJourney?.startLocationDescription;
  }, [activeJourney?.status, isRider, userLocation, activeJourney?.startLatitude, activeJourney?.startLongitude, activeJourney?.startLocationDescription]);

  const mapMarkers = useMemo(() => {
    const markers = [];
    
    if (activeJourney) {
      if (activeJourney.startLatitude && activeJourney.startLongitude) {
        markers.push({
          lat: activeJourney.startLatitude,
          lng: activeJourney.startLongitude,
          type: 'start' as const
        });
      }
      
      if (activeJourney.meetingPointLat && activeJourney.meetingPointLng) {
        markers.push({
          lat: activeJourney.meetingPointLat,
          lng: activeJourney.meetingPointLng,
          type: 'meeting' as const
        });
      }

      if (activeJourney.endLatitude && activeJourney.endLongitude) {
        markers.push({
          lat: activeJourney.endLatitude,
          lng: activeJourney.endLongitude,
          type: 'end' as const
        });
      }
    }
    
    return markers;
  }, [activeJourney?.startLatitude, activeJourney?.startLongitude, activeJourney?.meetingPointLat, activeJourney?.meetingPointLng, activeJourney?.endLatitude, activeJourney?.endLongitude]);

  const trackingLat = !isRider && activeJourney?.currentLat ? activeJourney.currentLat : userLocation?.lat
  const trackingLng = !isRider && activeJourney?.currentLng ? activeJourney.currentLng : userLocation?.lng

  const isLoading = isLoadingMy || isLoadingShared

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const journeyHeroBg = PlaceHolderImages.find(img => img.id === 'journey-hero-bg')

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b flex items-center justify-between px-6 bg-card sticky top-0 z-20">
        <div className="flex items-center gap-4">
          {riderIdParam ? (
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <SidebarTrigger className="md:hidden">
              <Menu className="h-6 w-6" />
            </SidebarTrigger>
          )}
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {riderIdParam ? "Live Friend Tracking" : "Journeys"}
          </h2>
        </div>
        {activeJourney && (
          <Badge variant="outline" className={cn(
            "uppercase",
            activeJourney.status === 'InProgress' ? "text-primary border-primary bg-primary/5 animate-pulse" : "text-muted-foreground border-muted"
          )}>
            {activeJourney.status === 'InProgress' ? 'LIVE TRACKING' : 'BROADCASTED'}
          </Badge>
        )}
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 relative">
        {locationStatus === 'denied' && (
          <Card className="rounded-2xl border-none bg-destructive/10 text-destructive animate-in fade-in slide-in-from-top-2">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-tight">
                  GPS is required for safety tracking. Please enable location services.
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                className="h-8 rounded-lg text-[10px] font-black shrink-0 px-4"
                onClick={handleRequestLocation}
              >
                ENABLE GPS
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading tracking data...</p>
          </div>
        ) : activeJourney ? (
          <section className="space-y-4">
            <Card className="rounded-[2rem] border-none shadow-2xl overflow-hidden bg-primary text-primary-foreground">
              <CardContent className="p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  <div className="space-y-6 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-3xl md:text-4xl font-black mb-1 leading-tight tracking-tighter flex items-center gap-3">
                          {!isRider && <Activity className="h-8 w-8 text-accent animate-pulse" />}
                          {isRider ? "Transit in Progress" : `${activeJourney.userName}'s Journey`}
                        </h3>
                        <p className="opacity-80 text-sm font-medium">
                          {isRider ? "Safe sharing is enabled with your friends." : "You are currently tracking your friend's live movement."}
                        </p>
                      </div>
                      {!isRider && (
                        <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                          <User className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="relative h-[450px] md:h-[500px] w-full rounded-[2.5rem] overflow-hidden border-4 border-white/20 shadow-inner bg-muted">
                      <GoogleMap 
                        variant="active"
                        origin={navigationOrigin || activeJourney.startLocationDescription}
                        destination={activeJourney.endLatitude && activeJourney.endLongitude ? {lat: activeJourney.endLatitude, lng: activeJourney.endLongitude} : activeJourney.endLocationDescription}
                        address={activeJourney.endLocationDescription}
                        className="h-full w-full rounded-none border-none"
                        lat={trackingLat}
                        lng={trackingLng}
                        markers={mapMarkers}
                        onRouteInfo={handleRouteInfo}
                      />
                    </div>

                    {routeInfo && activeJourney.status === 'InProgress' && (
                      <div className="animate-in slide-in-from-bottom-2 duration-500">
                        <Card className="rounded-[2.5rem] border-none bg-white shadow-2xl overflow-hidden text-primary">
                          <CardContent className="p-6 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                              <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                                <Route className="h-8 w-8" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Arriving In</p>
                                <p className="text-3xl font-black tracking-tighter leading-none">{routeInfo.duration}</p>
                              </div>
                            </div>
                            <div className="h-12 w-px bg-border mx-2" />
                            <div className="flex-1">
                              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Remaining</p>
                              <p className="text-3xl font-black tracking-tighter leading-none">{routeInfo.distance}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    <div className="flex flex-row gap-3 mt-6 animate-in slide-in-from-bottom-2 duration-700 items-stretch">
                      <div className="flex-1 min-w-0 h-20 bg-white rounded-3xl flex items-center px-4 gap-3 shadow-2xl border-none">
                        <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                          <ShieldAlert className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Safety Link</p>
                          <p className="text-xs font-black text-slate-900 truncate uppercase">Emergency SMS</p>
                        </div>

                        <Button 
                          className="h-12 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-600/20 transition-all active:scale-95 shrink-0"
                          onClick={handleQuickSOS}
                        >
                          SEND SOS
                        </Button>
                      </div>
                      
                      <div className="shrink-0">
                        <EmergencyContactsDialog />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      {isRider && (
                        <div className="flex gap-4">
                          {activeJourney.status === 'Broadcasted' ? (
                            <Button 
                              variant="secondary" 
                              className="flex-1 h-14 rounded-2xl font-black shadow-xl text-primary transition-all active:scale-95"
                              onClick={handleStartJourney}
                            >
                              <Play className="mr-2 h-5 w-5" />
                              START LIVE TRACKING
                            </Button>
                          ) : (
                            <Button 
                              variant="secondary" 
                              className="flex-1 h-14 rounded-2xl font-black shadow-xl text-primary transition-all active:scale-95"
                              onClick={handleEndJourney}
                            >
                              <CheckCircle2 className="mr-2 h-5 w-5" />
                              END JOURNEY
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] p-6 md:p-8 space-y-8 shadow-sm text-foreground">
                      <div className="relative space-y-10 md:space-y-12">
                        <div className="absolute left-5 top-8 bottom-8 w-px bg-muted-foreground/20 border-dashed border-l" />
                        
                        <div className="flex items-start gap-4 md:gap-6 relative z-10">
                          <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm border border-primary/5">
                            <MapPin className="h-5 w-5 md:h-6 md:w-6" />
                          </div>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <p className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-0.5 md:mb-1">Starting Point</p>
                            <p className="font-black text-lg md:text-xl tracking-tight leading-tight">{activeJourney.startLocationDescription}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 md:gap-6 relative z-10">
                          <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-secondary text-primary flex items-center justify-center shrink-0 shadow-sm border border-primary/5">
                            <Navigation className="h-5 w-5 md:h-6 md:w-6" />
                          </div>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <p className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-0.5 md:mb-1">Destination</p>
                            <p className="font-black text-lg md:text-xl tracking-tight leading-tight">{activeJourney.endLocationDescription}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Card className="rounded-[2rem] border-none bg-white/10 backdrop-blur-md text-white shadow-xl h-fit border border-white/20">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" />
                              Companion Link
                            </h4>
                            {isRider && (
                              <Badge variant="outline" className="text-[8px] border-white/30 text-white font-black uppercase">
                                {activeJourney.availableSeats || 0} SLOTS FREE
                              </Badge>
                            )}
                          </div>
                          <div className="p-4 bg-white/10 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60">
                              <Users className="h-3 w-3" />
                              Participants
                            </div>
                            {joinedFriendsData && joinedFriendsData.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {joinedFriendsData.map(friend => (
                                  <Badge key={friend.userId} variant="secondary" className="bg-white/20 text-white border-none font-bold py-1 px-3">
                                    {friend.displayName}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs font-medium opacity-60 italic">
                                No companions have joined yet.
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="rounded-[2rem] border-none bg-white/10 backdrop-blur-md text-white shadow-xl h-fit border border-white/20">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                              <Handshake className="h-4 w-4" />
                              Meeting Point
                            </h4>
                          </div>

                          <div className="space-y-4">
                            {activeJourney.meetingPoint ? (
                              <div className="p-4 bg-accent/20 rounded-2xl border border-accent/30 space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] font-black uppercase text-accent tracking-widest">Confirmed Location</p>
                                  <Badge className="bg-accent text-primary text-[8px] font-black">ON MAP</Badge>
                                </div>
                                <p className="text-sm font-black text-white">{activeJourney.meetingPoint}</p>
                              </div>
                            ) : (
                              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 italic text-xs opacity-60">
                                No meeting point has been set for this journey.
                              </div>
                            )}

                            {!isRider && (
                              <div className="pt-2 space-y-3">
                                <div className="space-y-1.5">
                                  <p className="text-[10px] font-black uppercase text-white/60 tracking-widest ml-1">Propose Rendezvous</p>
                                  <div className="relative group">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 z-10" />
                                    {isLoaded ? (
                                      <Autocomplete
                                        onLoad={(auto) => (autocompleteRef.current = auto)}
                                        onPlaceChanged={onPlaceChanged}
                                        fields={['formatted_address', 'geometry', 'name']}
                                      >
                                        <Input 
                                          placeholder="Enter meeting location..." 
                                          className="h-12 pl-10 bg-white/10 border-none rounded-xl text-white placeholder:text-white/30 focus-visible:ring-accent/50"
                                          value={meetingPointInput}
                                          onChange={(e) => setMeetingPointInput(e.target.value)}
                                        />
                                      </Autocomplete>
                                    ) : (
                                      <Input disabled className="h-12 pl-10 bg-white/10 border-none rounded-xl text-white/30" placeholder="Loading Maps API..." />
                                    )}
                                  </div>
                                </div>
                                <Button 
                                  className="w-full h-12 rounded-xl bg-accent text-primary font-black uppercase text-xs tracking-widest shadow-lg shadow-accent/20 hover:bg-accent/90"
                                  onClick={handleSaveMeetingPoint}
                                  disabled={isUpdatingMeetingPoint || !meetingPointInput.trim()}
                                >
                                  {isUpdatingMeetingPoint ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                  SET MEETING POINT
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {isRider && (
                        <Card className="rounded-[2rem] border-none bg-white/10 backdrop-blur-md text-white shadow-xl h-fit border border-white/20 animate-in slide-in-from-bottom-2">
                          <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                                <UserPlus className="h-4 w-4" />
                                Passenger
                              </h4>
                              {activeJourney && (
                                <Badge variant="outline" className="text-[8px] border-white/30 text-white font-black uppercase">
                                  {activeJourney.availableSeats || 0} SLOTS FREE
                                </Badge>
                              )}
                            </div>

                            <div className="space-y-3">
                              {pendingJoinRequests && pendingJoinRequests.length > 0 ? (
                                pendingJoinRequests.map((req) => (
                                  <div key={req.id} className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-4 animate-in zoom-in-95">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-black">
                                        {req.senderName?.[0] || "?"}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black truncate">{req.senderName}</p>
                                        <p className="text-[10px] opacity-60 uppercase font-bold tracking-tight">Wants to join transit</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button 
                                        className="flex-1 h-10 rounded-xl bg-accent text-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20 transition-all active:scale-95"
                                        onClick={() => handleApproveJoin(req)}
                                      >
                                        APPROVE
                                      </Button>
                                      <Button 
                                        variant="outline"
                                        className="flex-1 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-white/20 bg-transparent text-white hover:bg-white/10 transition-all active:scale-95"
                                        onClick={() => handleDeclineJoin(req)}
                                      >
                                        DECLINE
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 italic text-xs opacity-60 text-center">
                                  No pending join requests.
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        ) : (
          <section className="relative overflow-hidden rounded-[3rem] border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm group">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              {journeyHeroBg && (
                <Image 
                  src={journeyHeroBg.imageUrl}
                  alt="Background"
                  fill
                  className="object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-700"
                  data-ai-hint="abstract colors"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center py-16 md:py-32 px-6 text-center space-y-8 max-w-3xl mx-auto animate-in fade-in duration-1000">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 shadow-xl backdrop-blur-md border border-white/20">
                <Compass className="h-10 w-10 text-primary animate-spin-slow" />
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight text-foreground">
                Ready for your next safe travel?
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed max-w-xl">
                ShareRide provides virtual companionship and real-time tracking for every step of your journey.
              </p>
              <div className="pt-4">
                <StartJourneyDialog />
              </div>
            </div>
          </section>
        )}

        {!riderIdParam && (
          <section className="space-y-6 pt-12">
            <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
              <History className="h-4 w-4" />
              Travel History
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {!isLoading && (!myJourneys || myJourneys.filter(j => j.status === 'Completed').length === 0) && (
                <div className="col-span-full py-16 text-center text-muted-foreground bg-card rounded-[2.5rem] border-2 border-dashed border-border font-bold text-xs uppercase tracking-[0.2em]">
                  No past journeys found.
                </div>
              )}
              {myJourneys?.filter(j => j.status === 'Completed').map((j) => (
                <Card key={j.id} className="rounded-3xl border-none shadow-sm hover:shadow-xl transition-all bg-card overflow-hidden group">
                  <CardHeader className="pb-3 border-b border-border p-5 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-black">{j.startTime ? format(new Date(j.startTime), 'MMM d, yyyy') : 'Date unavailable'}</span>
                      </div>
                      <Badge variant="secondary" className="text-[9px] bg-secondary text-primary border-none font-black px-2 py-0.5 uppercase">COMPLETED</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Origin</p>
                      <p className="font-bold text-sm truncate">{j.startLocationDescription}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Destination</p>
                      <p className="font-black text-primary text-sm truncate">{j.endLocationDescription}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default function JourneyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <JourneyContent />
    </Suspense>
  )
}
