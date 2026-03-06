"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { SOSButton } from "@/components/sos-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MapPin, 
  Clock, 
  ArrowRight, 
  Activity, 
  Loader2, 
  MessageSquare,
  Search,
  Users,
  Car,
  CheckCircle2,
  Check,
  Menu,
  Filter,
  Navigation
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
  const profileRef = useMemoFirebase(() => {
    if (!db || !alert.senderId) return null
    return doc(db, "publicProfiles", alert.senderId)
  }, [db, alert.senderId])
  const { data: profile } = useDoc(profileRef)
  
  const senderName = profile?.displayName || alert.senderName || "Friend"

  return (
    <Card className="rounded-3xl border-none shadow-xl bg-card border-l-4 border-l-primary overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          {alert.requestType === 'JourneyNotification' ? <Car className="h-4 w-4 text-primary" /> : <CheckCircle2 className="h-4 w-4 text-accent" />}
          <span className="text-[10px] font-black uppercase text-primary tracking-widest">
            {alert.requestType === 'JourneyNotification' ? 'Travel Alert' : 'Arrival Update'}
          </span>
        </div>
        <p className="text-sm font-bold leading-tight">
          <span className="text-primary font-black">{senderName}</span> {alert.description}
        </p>
        {alert.requestType === 'JourneyNotification' ? (
          <Button 
            variant="outline"
            className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest border-primary/20 text-primary bg-secondary hover:bg-muted"
            onClick={() => onJoin(alert)}
          >
            WANTS TO JOIN
          </Button>
        ) : (
          <Button 
            variant="ghost"
            className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground bg-muted hover:bg-muted/80"
            onClick={() => onDismiss(alert.id)}
          >
            <Check className="h-4 w-4 mr-2" />
            OKAY
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
  const [globalSearch, setGlobalSearch] = useState("")
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
      limit(10)
    )
  }, [db, user])

  const { data: journeys, isLoading: isJourneysLoading } = useCollection(journeysQuery)
  const activeJourney = journeys?.find(j => j.status === 'InProgress' || j.status === 'Started')

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
      where("requestType", "in", ["JourneyNotification", "JourneyEndNotification"])
    )
  }, [db, user])

  const { data: journeyAlerts, isLoading: isAlertsLoading } = useCollection(alertsQuery)

  // Advanced Global Filtering
  const search = globalSearch.toLowerCase();

  const filteredAlerts = useMemo(() => {
    if (!journeyAlerts) return []
    if (!search) return journeyAlerts
    return journeyAlerts.filter(a => 
      (a.senderName || "").toLowerCase().includes(search) ||
      (a.description || "").toLowerCase().includes(search) ||
      (a.startLocation || "").toLowerCase().includes(search) ||
      (a.endLocation || "").toLowerCase().includes(search)
    )
  }, [journeyAlerts, search])

  const filteredJourneys = useMemo(() => {
    if (!journeys) return []
    if (!search) return journeys
    return journeys.filter(j => 
      userName.toLowerCase().includes(search) ||
      (j.startLocationDescription || "").toLowerCase().includes(search) ||
      (j.endLocationDescription || "").toLowerCase().includes(search) ||
      (j.status || "").toLowerCase().includes(search)
    )
  }, [journeys, search, userName])

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

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-20 border-b flex items-center justify-between px-6 bg-card sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden">
            <Menu className="h-6 w-6" />
          </SidebarTrigger>
          <h2 className="text-xl font-black tracking-tighter hidden sm:block">Overview</h2>
        </div>
        <div className="flex-1 max-w-xs mx-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search people, origin or destination..." 
              className="pl-10 h-10 bg-secondary border-none rounded-xl text-xs focus-visible:ring-primary/20"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-8 space-y-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-8">
            
            {filteredAlerts && filteredAlerts.length > 0 && (
              <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary ml-2">
                  <Activity className="h-3.5 w-3.5" />
                  Live Travel Updates
                </div>
                {filteredAlerts.map((alert) => (
                  <JourneyAlertCard 
                    key={alert.id} 
                    alert={alert} 
                    onJoin={handleJoinRequest} 
                    onDismiss={handleDismiss} 
                  />
                ))}
              </div>
            )}

            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-primary text-primary-foreground overflow-hidden">
              <CardContent className="p-10 text-center space-y-8">
                <SOSButton />
                <div className="space-y-3">
                  <h3 className="text-2xl font-black tracking-tight">Emergency Response</h3>
                  <p className="text-sm opacity-90 leading-relaxed font-medium">
                    Triggering SOS notifies all your registered friends immediately.
                  </p>
                </div>
              </CardContent>
            </Card>

            {activeJourney ? (
              <Button 
                className="w-full h-16 rounded-2xl text-lg font-black bg-destructive text-destructive-foreground hover:bg-destructive/90 border-none shadow-xl"
                onClick={handleEndJourney}
              >
                <CheckCircle2 className="mr-2 h-6 w-6" />
                END ACTIVE JOURNEY
              </Button>
            ) : (
              <Button 
                className="w-full h-16 rounded-2xl text-lg font-black bg-secondary hover:bg-muted text-primary border-none shadow-lg"
                onClick={() => router.push("/journey")}
              >
                <MapPin className="mr-2 h-6 w-6" />
                START NEW JOURNEY
              </Button>
            )}
          </div>

          <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-cols-1 gap-6">
              <Card className="rounded-3xl border-none shadow-sm bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Friend Circle</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-5xl font-black text-primary tracking-tighter">{contacts?.length || 0}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-2">Verified safety connections</p>
                </CardContent>
              </Card>
            </div>

            {/* RECENT ACTIVITY SECTION */}
            <div className="space-y-6">
              <h3 className="font-black text-lg flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </h3>

              {isJourneysLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card animate-pulse rounded-3xl" />)}
                </div>
              ) : !filteredJourneys || filteredJourneys.length === 0 ? (
                <Card className="rounded-[2.5rem] border-dashed border-2 bg-secondary border-border">
                  <CardContent className="p-16 text-center space-y-4">
                    <p className="text-sm font-bold text-muted-foreground">
                      {globalSearch ? "No matching journeys found." : "No recent journeys recorded."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredJourneys.map((j) => (
                    <Card key={j.id} className="rounded-3xl border-none shadow-sm hover:shadow-xl transition-all group bg-card">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5 flex-1 min-w-0">
                            <div className="h-14 w-14 rounded-2xl bg-secondary text-primary flex items-center justify-center shadow-inner shrink-0">
                              <Car className="h-7 w-7" />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
                                <Activity className="h-3 w-3" />
                                {userName}
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
                                  variant={j.status === 'InProgress' || j.status === 'Started' ? 'default' : 'secondary'} 
                                  className="text-[9px] uppercase font-black"
                                >
                                  {j.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="rounded-xl h-10 w-10 bg-secondary hover:bg-muted text-primary transition-all shrink-0 ml-4"
                            onClick={() => router.push("/journey")}
                          >
                            <ArrowRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* MY FRIEND CIRCLE SECTION */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-black text-lg flex items-center gap-3 text-primary">
                  <Users className="h-5 w-5" />
                  My Friend Circle
                </h3>
                <div className="relative w-full sm:w-64">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Filter your circle..." 
                    className="pl-9 h-9 bg-secondary border-none rounded-xl text-xs focus-visible:ring-primary/20"
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
                <Card className="rounded-[2.5rem] border-dashed border-2 bg-secondary border-primary/10">
                  <CardContent className="p-12 text-center space-y-4">
                    <p className="text-sm font-bold text-muted-foreground">Search and connect with friends in the navigation hub.</p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredFriends.map((contact) => (
                      <Card key={contact.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all group bg-card h-20">
                        <CardContent className="p-3 flex items-center justify-between h-full">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-base shrink-0">
                              {contact.contactName?.[0]}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-xs tracking-tight truncate">{contact.contactName}</h3>
                              <Badge variant="outline" className="text-[8px] uppercase border-primary/20 text-primary font-bold px-1.5 h-4">CONNECTED</Badge>
                            </div>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 rounded-full text-primary bg-secondary hover:bg-muted shrink-0"
                            onClick={() => router.push(`/chat?with=${contact.appUserId}&name=${encodeURIComponent(contact.contactName)}`)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredFriends.length === 0 && friendFilter && (
                      <div className="col-span-full py-12 text-center text-muted-foreground text-xs font-bold uppercase tracking-widest bg-secondary rounded-2xl border-none">
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
