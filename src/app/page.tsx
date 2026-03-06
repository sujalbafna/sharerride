
"use client"

import { useEffect, useState } from "react"
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
  Bell,
  CheckCircle2,
  Check
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

function JourneyAlertCard({ alert, onJoin, onDismiss, currentUserName }: { alert: any, onJoin: (a: any) => void, onDismiss: (id: string) => void, currentUserName: string }) {
  const db = useFirestore()
  const profileRef = useMemoFirebase(() => {
    if (!db || !alert.senderId) return null
    return doc(db, "publicProfiles", alert.senderId)
  }, [db, alert.senderId])
  const { data: profile } = useDoc(profileRef)
  
  const senderName = profile?.displayName || alert.senderName || "User"

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
          <span className="text-primary">{senderName}</span> {alert.description}
        </p>
        {alert.requestType === 'JourneyNotification' ? (
          <Button 
            variant="outline"
            className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5"
            onClick={() => onJoin(alert)}
          >
            WANTS TO JOIN
          </Button>
        ) : (
          <Button 
            variant="ghost"
            className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-accent/5"
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
  const [searchQuery, setSearchQuery] = useState("")

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
      limit(5)
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

  const alertsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "supportRequests"),
      where("status", "==", "Pending"),
      where("requestType", "in", ["JourneyNotification", "JourneyEndNotification"])
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

  const filteredJourneys = journeys?.filter(j => 
    j.endLocationDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-background/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <h2 className="text-2xl font-black tracking-tighter">Overview</h2>
          <Badge variant="outline" className="text-[10px] border-primary/20 bg-primary/5 px-3 py-1 rounded-full">
            <Activity className="h-3 w-3 mr-1.5 text-primary" />
            LIVE SYSTEM
          </Badge>
        </div>
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search journeys or status..." 
              className="pl-12 h-12 bg-white/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/40 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="p-8 space-y-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-8">
            
            {journeyAlerts && journeyAlerts.length > 0 && (
              <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                {journeyAlerts.map((alert) => (
                  <JourneyAlertCard 
                    key={alert.id} 
                    alert={alert} 
                    onJoin={handleJoinRequest} 
                    onDismiss={handleDismiss} 
                    currentUserName={userName}
                  />
                ))}
              </div>
            )}

            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
              <CardContent className="p-10 text-center space-y-8">
                <SOSButton />
                <div className="space-y-3">
                  <h3 className="text-2xl font-black tracking-tight">Emergency Response</h3>
                  <p className="text-sm opacity-90 leading-relaxed font-medium">
                    Triggering SOS notifies all your registered friends immediately with your live coordinates.
                  </p>
                </div>
              </CardContent>
            </Card>

            {activeJourney ? (
              <Button 
                className="w-full h-16 rounded-2xl text-lg font-black bg-destructive/10 hover:bg-destructive/20 text-destructive border-2 border-destructive/20"
                onClick={handleEndJourney}
              >
                <CheckCircle2 className="mr-2 h-6 w-6" />
                END ACTIVE JOURNEY
              </Button>
            ) : (
              <Button 
                className="w-full h-16 rounded-2xl text-lg font-black bg-white/5 hover:bg-white/10 text-primary border-2 border-primary/20"
                onClick={() => router.push("/journey")}
              >
                <MapPin className="mr-2 h-6 w-6" />
                START NEW JOURNEY
              </Button>
            )}
          </div>

          <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-cols-1 gap-6">
              <Card className="rounded-3xl border-none shadow-sm bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Friend Circle</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-5xl font-black text-primary tracking-tighter">{contacts?.length || 0}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-2">Verified safety connections</p>
                </CardContent>
              </Card>
            </div>

            <section className="space-y-6">
              <h3 className="font-black text-lg flex items-center gap-3 text-primary">
                <Users className="h-5 w-5" />
                My Friend Circle
              </h3>
              
              {isContactsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !contacts || contacts.length === 0 ? (
                <Card className="rounded-[2.5rem] border-dashed border-2 bg-transparent border-primary/10">
                  <CardContent className="p-12 text-center space-y-4">
                    <p className="text-sm font-bold text-muted-foreground">Search and connect with friends in the navigation hub.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contacts.map((contact) => (
                    <Card key={contact.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all group bg-card">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                            {contact.contactName?.[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm tracking-tight">{contact.contactName}</h3>
                            <Badge variant="outline" className="text-[9px] uppercase border-primary/20 text-primary font-bold">CONNECTED</Badge>
                          </div>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-10 w-10 rounded-full text-primary hover:bg-primary/10"
                          onClick={() => router.push(`/chat?with=${contact.appUserId}&name=${encodeURIComponent(contact.contactName)}`)}
                        >
                          <MessageSquare className="h-5 w-5" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <div className="space-y-6">
              <h3 className="font-black text-lg flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </h3>

              {isJourneysLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card/40 animate-pulse rounded-3xl" />)}
                </div>
              ) : !filteredJourneys || filteredJourneys.length === 0 ? (
                <Card className="rounded-[2.5rem] border-dashed border-2 bg-transparent border-white/5">
                  <CardContent className="p-16 text-center space-y-4">
                    <p className="text-sm font-bold text-muted-foreground">No recent journeys recorded.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredJourneys.map((j) => (
                    <Card key={j.id} className="rounded-3xl border-none shadow-sm hover:shadow-xl hover:bg-card/80 transition-all group">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                              <MapPin className="h-7 w-7" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-black text-lg tracking-tight truncate max-w-[200px]">{j.endLocationDescription}</p>
                              <div className="flex items-center gap-3">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                  {j.startTime ? format(new Date(j.startTime), "MMM d, h:mm a") : "Active"}
                                </p>
                                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                <Badge variant="secondary" className="text-[9px] uppercase font-black">{j.status}</Badge>
                              </div>
                            </div>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="rounded-xl h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all"
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
          </div>
        </div>
      </main>
    </div>
  )
}
