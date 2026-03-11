
"use client"

import { useState, useEffect } from "react"
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, orderBy, limit, doc, updateDoc, getDocs, where, addDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
  Users
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

export default function JourneyPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'unsupported'>('loading')

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData } = useDoc(userRef)

  const userName = userData?.firstName && userData?.lastName 
    ? `${userData.firstName} ${userData.lastName}` 
    : (user?.displayName || user?.email?.split('@')[0] || "User")

  // Fetch my own journeys
  const journeysQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "journeys"),
      orderBy("startTime", "desc"),
      limit(10)
    )
  }, [db, user])
  const { data: journeys, isLoading } = useCollection(journeysQuery)

  const activeJourney = journeys?.find(j => j.status === 'InProgress' || j.status === 'Started')

  // Fetch joined friends data for the active journey
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

  const handleEndJourney = async () => {
    if (!db || !user || !activeJourney) return
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

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b flex items-center justify-between px-6 bg-card sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden">
            <Menu className="h-6 w-6" />
          </SidebarTrigger>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Journeys</h2>
        </div>
        {activeJourney && (
          <Badge variant="outline" className="text-primary border-primary bg-primary/5 uppercase animate-pulse">
            LIVE TRACKING
          </Badge>
        )}
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {locationStatus === 'denied' && (
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
            <p className="text-sm text-muted-foreground">Loading journey records...</p>
          </div>
        ) : activeJourney ? (
          <section className="space-y-4">
            <Card className="rounded-[2rem] border-none shadow-2xl overflow-hidden bg-primary text-primary-foreground">
              <CardContent className="p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  <div className="space-y-6 min-w-0">
                    <div>
                      <h3 className="text-3xl md:text-4xl font-black mb-1 leading-tight tracking-tighter">
                        Transit in Progress
                      </h3>
                      <p className="opacity-80 text-sm font-medium">
                        Safe sharing is enabled with your friends.
                      </p>
                    </div>

                    <div className="h-[300px] md:h-[450px] w-full rounded-[2.5rem] overflow-hidden border-4 border-white/20 shadow-inner bg-muted">
                      <GoogleMap 
                        variant="active"
                        origin={activeJourney.startLocationDescription}
                        destination={activeJourney.endLocationDescription}
                        address={activeJourney.endLocationDescription}
                        className="h-full w-full rounded-none border-none"
                        lat={userLocation?.lat}
                        lng={userLocation?.lng}
                      />
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-80">
                        <span>Route Progress</span>
                        <span>Tracking Secure</span>
                      </div>
                      <Progress value={30} className="h-3 bg-white/20" />
                      
                      <div className="flex gap-4">
                        <Button 
                          variant="secondary" 
                          className="flex-1 h-14 rounded-2xl font-black shadow-xl text-primary transition-all active:scale-95"
                          onClick={handleEndJourney}
                        >
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          END JOURNEY
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] p-8 space-y-8 shadow-sm text-foreground">
                      <div className="relative space-y-12">
                        {/* Vertical Path Line */}
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

                    <Card className="rounded-[2rem] border-none bg-white/10 backdrop-blur-md text-white shadow-xl h-fit border border-white/20">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            Companion Link
                          </h4>
                          <Badge variant="outline" className="text-[8px] border-white/30 text-white font-black">
                            {activeJourney.availableSeats || 0} SLOTS FREE
                          </Badge>
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
                              No friends have joined this journey yet.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
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

        <section className="space-y-6 pt-12">
          <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
            <History className="h-4 w-4" />
            Travel History
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!isLoading && (!journeys || journeys.filter(j => j.status === 'Completed').length === 0) && (
              <div className="col-span-full py-16 text-center text-muted-foreground bg-card rounded-[2.5rem] border-2 border-dashed border-border font-bold text-xs uppercase tracking-[0.2em]">
                No past journeys found.
              </div>
            )}
            {journeys?.filter(j => j.status === 'Completed').map((j) => (
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
      </main>
    </div>
  )
}
