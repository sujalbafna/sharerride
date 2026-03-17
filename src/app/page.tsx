
"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MapPin, 
  Clock, 
  ArrowRight, 
  Activity, 
  Loader2, 
  MessageSquare,
  Users,
  Car,
  CheckCircle2,
  Check,
  Filter,
  Navigation,
  Wind,
  Calendar,
  Milestone,
  Eye,
  ShieldAlert
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser, useCollection, useMemoFirebase, useFirestore, useDoc } from "@/firebase"
import { collection, query, orderBy, limit, where, addDoc, doc, updateDoc, getDocs } from "firebase/firestore"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"

function JourneyAlertCard({ alert, onJoin, onDismiss }: { alert: any, onJoin: (a: any) => void, onDismiss: (id: string) => void }) {
  const db = useFirestore()
  const router = useRouter()
  const profileRef = useMemoFirebase(() => {
    if (!db || !alert.senderId) return null
    return doc(db, "publicProfiles", alert.senderId)
  }, [db, alert.senderId])
  const { data: profile } = useDoc(profileRef)
  
  const senderName = profile?.displayName || alert.senderName || "Friend"

  if (alert.requestType === 'JoinApproved') {
    return (
      <Card className="rounded-3xl border-none shadow-xl bg-primary/5 border-l-4 border-l-primary overflow-hidden animate-in slide-in-from-top-4 duration-500">
         <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                Live Tracking Authorized
              </span>
            </div>
            <Badge variant="outline" className="text-[8px] h-4 border-primary/30 text-primary">SECURE LINK</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              <span className="font-black">{senderName}</span> has approved your companion request.
            </p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Tracking enabled for the duration of this transit</p>
          </div>
          <Button 
            className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest bg-primary text-white hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
            onClick={() => router.push(`/journey?riderId=${alert.riderId}&journeyId=${alert.targetJourneyId}`)}
          >
            TRACK LIVE NOW
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-3xl border-none shadow-xl bg-card border-l-4 border-l-accent overflow-hidden animate-in slide-in-from-top-4 duration-500">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {alert.requestType === 'JourneyNotification' ? <Car className="h-4 w-4 text-accent" /> : <CheckCircle2 className="h-4 w-4 text-accent" />}
            <span className="text-[10px] font-black uppercase text-accent tracking-widest">
              {alert.requestType === 'JourneyNotification' ? 'Travel Broadcast' : 'Arrival Update'}
            </span>
          </div>
          <Badge variant="outline" className="text-[8px] h-4 border-accent/30 text-accent">NEW ALERT</Badge>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-black">
              {senderName[0]}
            </div>
            <div>
              <p className="text-sm font-black leading-tight text-foreground">{senderName}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Verified Contact</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50">
             <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border">
                <MapPin className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Origin</p>
                <p className="text-xs font-bold truncate">{alert.startLocation}</p>
              </div>
            </div>
            {alert.routeVia && (
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border">
                  <Milestone className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Route Via</p>
                  <p className="text-xs font-bold truncate italic">{alert.routeVia}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20">
                <Navigation className="h-3 w-3 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-black text-accent tracking-widest">Destination</p>
                <p className="text-xs font-black truncate">{alert.endLocation}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
            <div className="space-y-0.5">
              <p className="text-[9px] uppercase font-black text-muted-foreground tracking-tight">Vehicle</p>
              <div className="flex items-center gap-1">
                <Car className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-[9px] font-bold truncate">{alert.vehicleName || 'Private'}</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] uppercase font-black text-muted-foreground tracking-tight">Status</p>
              <div className="flex items-center gap-1">
                <Wind className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-[9px] font-bold">{alert.acStatus}</span>
              </div>
            </div>
             <div className="space-y-0.5">
              <p className="text-[9px] uppercase font-black text-muted-foreground tracking-tight">Time</p>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-[9px] font-bold">{alert.journeyStartTime ? format(new Date(alert.journeyStartTime), "h:mm a") : 'Now'}</span>
              </div>
            </div>
          </div>
        </div>

        {alert.requestType === 'JourneyNotification' ? (
          <Button 
            variant="outline"
            className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest border-accent/30 text-accent bg-background hover:bg-accent/5 transition-all active:scale-95 shadow-sm"
            onClick={() => onJoin(alert)}
          >
            REQUEST TO JOIN
          </Button>
        ) : (
          <Button 
            variant="ghost"
            className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground bg-muted/50 hover:bg-muted transition-all active:scale-95"
            onClick={() => onDismiss(alert.id)}
          >
            <Check className="h-4 w-4 mr-2" />
            ACKNOWLEDGE
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function Home() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [friendFilter, setFriendFilter] = useState("")

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

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
      limit(20)
    )
  }, [db, user])

  const { data: journeys, isLoading: isJourneysLoading } = useCollection(journeysQuery)
  const activeJourney = journeys?.find(j => j.status === 'InProgress' || j.status === 'Broadcasted')

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "trustedContacts"),
      orderBy("contactName", "asc")
    )
  }, [db, user])

  const { data: contacts, isLoading: isContactsLoading } = useCollection(contactsQuery)

  const filteredFriends = useMemo(() => {
    if (!contacts) return []
    return contacts.filter(c => 
      c.contactName.toLowerCase().includes(friendFilter.toLowerCase())
    )
  }, [contacts, friendFilter])

  const alertsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "supportRequests"),
      where("status", "==", "Pending"),
      where("requestType", "in", ["JourneyNotification", "JourneyEndNotification", "JoinApproved"])
    )
  }, [db, user])

  const { data: journeyAlerts, isLoading: isAlertsLoading } = useCollection(alertsQuery)

  const handleJoinRequest = async (alert: any) => {
    if (!db || !user || !alert.targetJourneyId) return
    try {
      await addDoc(collection(db, "users", alert.senderId, "supportRequests"), {
        userId: alert.senderId,
        senderId: user.uid,
        senderName: userName,
        requestType: "JoinJourneyRequest",
        description: "wants to join your journey.",
        timestamp: new Date().toISOString(),
        status: "Pending",
        targetJourneyId: alert.targetJourneyId
      })
      
      const alertRef = doc(db, "users", user.uid, "supportRequests", alert.id)
      updateDoc(alertRef, {
        status: "Read"
      }).catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: alertRef.path,
          operation: 'update',
          requestResourceData: { status: "Read" },
        });
        errorEmitter.emit('permission-error', permissionError);
      })

      toast({ 
        title: "Request Sent", 
        description: "Your request to join has been sent to your friend." 
      })
    } catch (e) {
      console.error(e)
      toast({ variant: "destructive", title: "Error", description: "Failed to send join request." })
    }
  }

  const handleDismiss = async (alertId: string) => {
    if (!db || !user) return
    const alertRef = doc(db, "users", user.uid, "supportRequests", alertId)
    updateDoc(alertRef, { status: "Read" })
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
          const snapshot = await getDocs(q)
          for (const d of snapshot.docs) {
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

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-700">
      <header className="h-24 border-b flex items-center justify-between px-6 bg-card sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4 w-full">
          <SidebarTrigger />
          <div className="flex items-center gap-4 flex-1">
            <div className="h-14 w-14 relative shrink-0">
              <Image 
                src="https://i.postimg.cc/XvjD0vWw/cropped-circle-image.png" 
                alt="MIT Logo" 
                fill 
                className="object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground truncate">
                MIT Art, Design & Technology
              </p>
              <h2 className="text-xl font-black tracking-tighter leading-tight truncate">
                Welcome, {userName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[8px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-accent animate-pulse" />
                  ShareRide Portal
                </span>
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                  by Sujal Bafna
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-8 space-y-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-8">
            
            {journeyAlerts && journeyAlerts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary ml-2">
                  <Activity className="h-3.5 w-3.5 animate-pulse" />
                  Live Travel Updates
                </div>
                <div className="space-y-4">
                  {journeyAlerts.map((alert) => (
                    <JourneyAlertCard 
                      key={alert.id} 
                      alert={alert} 
                      onJoin={handleJoinRequest} 
                      onDismiss={handleDismiss} 
                    />
                  ))}
                </div>
              </div>
            )}

            {activeJourney ? (
              <div className="space-y-4 animate-in zoom-in duration-300">
                <Card className="rounded-[2rem] border-none shadow-2xl bg-destructive text-destructive-foreground overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest">Active Transit</span>
                      </div>
                      <Badge variant="outline" className="border-white/30 text-white text-[8px] font-black">{activeJourney.status}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-black leading-tight truncate">{activeJourney.endLocationDescription}</p>
                      <p className="text-xs opacity-80 font-medium">Tracking is active. Your network is notified.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="secondary"
                        className="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
                        onClick={() => router.push("/journey")}
                      >
                        VIEW MAP
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all active:scale-95"
                        onClick={handleEndJourney}
                      >
                        END TRIP
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Button 
                className="w-full h-16 rounded-2xl text-lg font-black bg-primary text-primary-foreground hover:bg-primary/90 border-none shadow-2xl transition-all active:scale-95 hover:scale-[1.02] animate-in zoom-in duration-300"
                onClick={() => router.push("/journey")}
              >
                <MapPin className="mr-2 h-6 w-6" />
                START NEW JOURNEY
              </Button>
            )}

            <Card className="rounded-[2rem] border-none shadow-sm bg-accent/5 overflow-hidden">
               <CardContent className="p-6 space-y-4 text-center">
                  <div className="h-12 w-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto text-accent">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase tracking-tight">Safety Network Active</h4>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Global Watch Protocols Enabled</p>
                  </div>
               </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-cols-1 gap-6">
              <Card className="rounded-3xl border-none shadow-sm bg-card transition-all hover:shadow-md duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Friend Circle</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-5xl font-black text-primary tracking-tighter">{contacts?.length || 0}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-2">Verified safety connections</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <h3 className="font-black text-lg flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                Recent Transit Activity
              </h3>

              {isJourneysLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card animate-pulse rounded-3xl" />)}
                </div>
              ) : !journeys || journeys.length === 0 ? (
                <Card className="rounded-[2.5rem] border-dashed border-2 bg-secondary/50 border-border animate-in fade-in duration-500">
                  <CardContent className="p-16 text-center space-y-4">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                      Your travel history will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {journeys.map((j) => (
                      <Card key={j.id} className="rounded-3xl border-none shadow-sm hover:shadow-xl transition-all group bg-card animate-in slide-in-from-left-4 duration-500">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5 flex-1 min-w-0">
                              <div className="h-14 w-14 rounded-2xl bg-secondary text-primary flex items-center justify-center shadow-inner shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                <Car className="h-7 w-7" />
                              </div>
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
                                  <Navigation className="h-3 w-3" />
                                  {j.userName || userName}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-sm text-muted-foreground truncate">{j.startLocationDescription}</p>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                                  <p className="font-black text-base tracking-tight truncate text-primary">{j.endLocationDescription}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    {j.startTime ? format(new Date(j.startTime), "MMM d, h:mm a") : "Active"}
                                  </p>
                                  <span className="h-1 w-1 rounded-full bg-border" />
                                  <Badge 
                                    variant={j.status === 'InProgress' || j.status === 'Broadcasted' ? 'default' : 'secondary'} 
                                    className="text-[9px] uppercase font-black px-2 h-4"
                                  >
                                    {j.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="rounded-xl h-10 w-10 bg-secondary hover:bg-muted text-primary transition-all shrink-0 ml-4 active:scale-95"
                              onClick={() => router.push(j.status === 'InProgress' ? "/journey" : "/journey")}
                            >
                              <ArrowRight className="h-5 w-5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-black text-lg flex items-center gap-3 text-primary">
                  <Users className="h-5 w-5" />
                  My Trusted Circle
                </h3>
                <div className="relative w-full sm:w-64 group">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Search circle..." 
                    className="pl-9 h-10 bg-secondary border-none rounded-xl text-xs focus-visible:ring-primary/20 transition-all shadow-inner"
                    value={friendFilter}
                    onChange={(e) => setFriendFilter(e.target.value)}
                  />
                </div>
              </div>
              
              {isContactsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !contacts || contacts.length === 0 ? (
                <Card className="rounded-[2.5rem] border-dashed border-2 bg-secondary/30 border-primary/10 animate-in fade-in duration-500">
                  <CardContent className="p-12 text-center space-y-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">Connect with friends to enable virtual companionship.</p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredFriends.map((contact) => (
                      <Card key={contact.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all group bg-card h-20 animate-in zoom-in-95 duration-300">
                        <CardContent className="p-3 flex items-center justify-between h-full">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-base shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                              {contact.contactName?.[0]}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-xs tracking-tight truncate">{contact.contactName}</h3>
                              <Badge variant="outline" className="text-[8px] uppercase border-primary/20 text-primary font-bold px-1.5 h-4">CONNECTED</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 rounded-full text-primary bg-secondary hover:bg-muted shrink-0 transition-all active:scale-95"
                              onClick={() => router.push(`/chat?with=${contact.appUserId}&name=${encodeURIComponent(contact.contactName)}`)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredFriends.length === 0 && friendFilter && (
                      <div className="col-span-full py-12 text-center text-muted-foreground text-xs font-bold uppercase tracking-widest bg-secondary/50 rounded-2xl border-none animate-in fade-in duration-300">
                        No matches found in your circle.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
