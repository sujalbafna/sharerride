
"use client"

import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, orderBy, limit, doc, updateDoc, getDocs, where, addDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { MapPin, Navigation, CheckCircle2, ShieldAlert, Compass, Clock, History, Loader2, Users, ShieldCheck, MessageCircle, AlertTriangle, Menu } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { StartJourneyDialog } from "@/components/start-journey-dialog"
import { EmergencyProtocolDisplay } from "@/components/emergency-protocol-display"
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

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData } = useDoc(userRef)

  const userName = userData?.firstName && userData?.lastName 
    ? `${userData.firstName} ${userData.lastName}` 
    : (user?.displayName || user?.email?.split('@')[0] || "User")

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

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "trustedContacts")
  }, [db, user])
  const { data: contacts } = useCollection(contactsQuery)

  const alertsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "emergencyAlerts"),
      orderBy("timestamp", "desc"),
      limit(1)
    )
  }, [db, user])

  const { data: latestAlerts } = useCollection(alertsQuery)
  const isEmergencyActive = latestAlerts && latestAlerts.length > 0 && latestAlerts[0].status !== 'Resolved'

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

      // Inform friends and clear start notifications
      if (contacts && contacts.length > 0) {
        for (const friendContact of contacts) {
          const friendId = friendContact.appUserId;
          if (!friendId) continue;

          // Clear existing "Start" notifications for this friend
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

          // Send "End" notification
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
      <header className="h-16 border-b flex items-center justify-between px-6 bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden">
            <Menu className="h-6 w-6" />
          </SidebarTrigger>
          <h2 className="text-xl font-bold tracking-tight">Journeys</h2>
        </div>
        {activeJourney && (
          <Badge variant={isEmergencyActive ? "destructive" : "secondary"} className={cn("uppercase", !isEmergencyActive && "bg-accent/20 text-primary border-accent animate-pulse")}>
            {isEmergencyActive ? "EMERGENCY PROTOCOL" : "LIVE TRACKING"}
          </Badge>
        )}
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading journey records...</p>
          </div>
        ) : activeJourney ? (
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <Compass className="h-4 w-4" />
              Active Session
            </div>
            <Card className={cn(
              "rounded-[2.5rem] border-none shadow-2xl overflow-hidden transition-colors duration-500",
              isEmergencyActive ? "bg-destructive text-white" : "bg-primary text-primary-foreground"
            )}>
              <CardContent className="p-6 md:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  <div className="space-y-8 min-w-0">
                    <div>
                      <h3 className="text-2xl md:text-4xl font-black mb-2 leading-tight">
                        {isEmergencyActive ? "Emergency Response" : "Transit in Progress"}
                      </h3>
                      <p className="opacity-80 text-sm md:text-base">
                        {isEmergencyActive 
                          ? "SOS Protocol is active." 
                          : "Safe sharing is enabled with your friends."}
                      </p>
                    </div>

                    <div className="h-[250px] md:h-[300px] w-full">
                      <GoogleMap 
                        variant={isEmergencyActive ? "alert" : "active"}
                        address={activeJourney.endLocationDescription}
                        className="h-full w-full"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between text-[10px] md:text-xs font-black uppercase tracking-widest opacity-80">
                        <span>Route Progress</span>
                        <span>{isEmergencyActive ? "SOS DISPATCHED" : "Tracking..."}</span>
                      </div>
                      <Progress value={20} className={cn("h-3", isEmergencyActive ? "bg-white/30" : "bg-white/20")} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold"
                        onClick={handleEndJourney}
                      >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        END JOURNEY
                      </Button>
                      {!isEmergencyActive && (
                        <Button className="h-14 rounded-2xl bg-accent text-primary hover:bg-accent/90 font-black">
                          <ShieldAlert className="mr-2 h-5 w-5" />
                          SOS ALERT
                        </Button>
                      )}
                    </div>

                    {isEmergencyActive ? (
                      <EmergencyProtocolDisplay />
                    ) : (
                      <Card className="rounded-2xl border-none bg-white/10 backdrop-blur-md border border-white/10">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-accent" />
                              Travel Capacity
                            </h4>
                            <Badge variant="outline" className="text-[9px] border-accent/30 text-accent uppercase">
                              {activeJourney.availableSeats || 0} SEATS LEFT
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            <p className="text-sm font-medium leading-relaxed">
                              {activeJourney.joinedUserIds?.length || 0} friends have joined this journey so far.
                            </p>
                            <div className="flex gap-2">
                              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                                <Users className="h-4 w-4 opacity-60" />
                              </div>
                              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                                <MessageCircle className="h-4 w-4 opacity-60" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  <div className={cn(
                    "rounded-3xl p-6 md:p-8 backdrop-blur-sm space-y-6 min-w-0",
                    isEmergencyActive ? "bg-white/20" : "bg-white/10"
                  )}>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                          isEmergencyActive ? "bg-white text-destructive" : "bg-accent text-primary"
                        )}>
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs font-black uppercase opacity-60">Starting Point</p>
                          <p className="font-bold truncate text-sm">{activeJourney.startLocationDescription}</p>
                        </div>
                      </div>
                      <div className="h-8 w-px bg-white/20 ml-5" />
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
                          <Navigation className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs font-black uppercase opacity-60">Destination</p>
                          <p className="font-bold truncate text-sm">{activeJourney.endLocationDescription}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center py-8 md:py-12 text-center lg:text-left">
            <div className="space-y-8 min-w-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-tight">
                Ready for your next safe travel?
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto lg:mx-0">
                Setu provides virtual companionship and real-time tracking for every step of your journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <div className="w-full sm:w-auto">
                  <StartJourneyDialog />
                </div>
                <Button variant="outline" className="h-16 px-8 rounded-2xl text-lg font-bold border-2 w-full sm:w-auto">
                  <History className="mr-2 h-6 w-6" />
                  HISTORY
                </Button>
              </div>
            </div>
            <GoogleMap variant="hero" className="h-[250px] md:h-[400px] w-full" />
          </section>
        )}

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <History className="h-4 w-4" />
            Recent History
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!isLoading && (!journeys || journeys.filter(j => j.status === 'Completed').length === 0) && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-2xl border-2 border-dashed">
                No past journeys recorded.
              </div>
            )}
            {journeys?.filter(j => j.status === 'Completed').map((j) => (
              <Card key={j.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-3 border-b border-muted/30">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-bold">{j.startTime ? format(new Date(j.startTime), 'MMM d, yyyy') : 'Date unavailable'}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">COMPLETED</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">From</p>
                    <p className="font-bold text-sm truncate">{j.startLocationDescription}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">To</p>
                    <p className="font-bold text-sm truncate">{j.endLocationDescription}</p>
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
