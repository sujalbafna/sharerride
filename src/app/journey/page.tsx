
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, orderBy, limit, doc, updateDoc, getDocs, where, addDoc } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
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
  Route
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

const LIBRARIES: ("places")[] = ["places"];

export default function JourneyPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const riderIdParam = searchParams.get("riderId")
  const journeyIdParam = searchParams.get("journeyId")

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'unsupported'>('loading')
  const [meetingPointInput, setMeetingPointInput] = useState("")
  const [meetingPointCoords, setMeetingPointCoords] = useState<{lat: number, lng: number} | null>(null)
  const [isUpdatingMeetingPoint, setIsUpdatingMeetingPoint] = useState(false)
  const [routeInfo, setRouteInfo] = useState<{ distance: string, duration: string } | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

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
    if (!navigator.geolocation) {
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

  const trackingLat = !isRider && activeJourney?.currentLat ? activeJourney.currentLat : userLocation?.lat
  const trackingLng = !isRider && activeJourney?.currentLng ? activeJourney.currentLng : userLocation?.lng

  const mapMarkers = useMemo(() => {
    const markers = [];
    if (activeJourney?.meetingPointLat && activeJourney?.meetingPointLng) {
      markers.push({
        lat: activeJourney.meetingPointLat,
        lng: activeJourney.meetingPointLng,
        type: 'meeting' as const
      });
    }
    return markers;
  }, [activeJourney?.meetingPointLat, activeJourney?.meetingPointLng]);

  const isLoading = isLoadingMy || isLoadingShared

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

      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {locationStatus === 'denied' && isRider && (
          <Card className="rounded-2xl border-none bg-destructive/10 text-destructive animate-in fade-in slide-in-from-top-2">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest leading-tight">
                  Location services are disabled. Live tracking will not be accurate.
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                className="h-8 rounded-lg text-[10px] font-black shrink-0 px-4"
                onClick={handleRequestLocation}
              >
                ENABLE LOCATION
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

                    <div className="relative h-[300px] md:h-[450px] w-full rounded-[2.5rem] overflow-hidden border-4 border-white/20 shadow-inner bg-muted">
                      <GoogleMap 
                        variant="active"
                        origin={activeJourney.startLocationDescription}
                        destination={activeJourney.endLocationDescription}
                        address={activeJourney.endLocationDescription}
                        className="h-full w-full rounded-none border-none"
                        lat={trackingLat}
                        lng={trackingLng}
                        markers={mapMarkers}
                        onRouteInfo={(info) => setRouteInfo(info)}
                      />
                      
                      {routeInfo && activeJourney.status === 'InProgress' && (
                        <div className="absolute top-6 left-6 right-6 animate-in slide-in-from-top-4 duration-500">
                          <Card className="rounded-2xl border-none bg-white text-primary shadow-2xl border-l-8 border-l-accent overflow-hidden">
                            <CardContent className="p-4 flex items-center justify-between gap-6">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                  <Route className="h-6 w-6" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Arriving In</p>
                                  <p className="text-xl font-black tracking-tight">{routeInfo.duration}</p>
                                </div>
                              </div>
                              <div className="h-10 w-px bg-border hidden sm:block" />
                              <div className="hidden sm:block">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Remaining</p>
                                <p className="text-xl font-black tracking-tight">{routeInfo.distance}</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
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
                    <div className="bg-white rounded-[2rem] p-8 space-y-8 shadow-sm text-foreground">
                      <div className="relative space-y-12">
                        <div className="absolute left-6 top-8 bottom-8 w-px bg-muted-foreground/20 border-dashed border-l" />
                        
                        <div className="flex items-start gap-6 relative z-10">
                          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm border border-primary/5">
                            <MapPin className="h-6 w-6" />
                          </div>
                          <div className="min-w-0 overflow-hidden pt-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Starting Point</p>
                            <p className="font-black text-xl tracking-tight truncate">{activeJourney.startLocationDescription}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-6 relative z-10">
                          <div className="h-12 w-12 rounded-full bg-secondary text-primary flex items-center justify-center shrink-0 shadow-sm border border-primary/5">
                            <Navigation className="h-6 w-6" />
                          </div>
                          <div className="min-w-0 overflow-hidden pt-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Destination</p>
                            <p className="font-black text-xl tracking-tight truncate">{activeJourney.endLocationDescription}</p>
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
                              <Badge variant="outline" className="text-[8px] border-white/30 text-white font-black">
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
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        ) : (
          <section className="flex flex-col items-center justify-center py-12 md:py-24 text-center space-y-8 max-w-3xl mx-auto animate-in fade-in duration-700">
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Compass className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight text-foreground">
              Ready for your next safe travel?
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed">
              ShareRide provides virtual companionship and real-time tracking for every step of your journey.
            </p>
            <div className="pt-4">
              <StartJourneyDialog />
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
                      <Badge variant="secondary" className="text-[9px] bg-secondary text-primary border-none font-black px-2 py-0.5">COMPLETED</Badge>
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
