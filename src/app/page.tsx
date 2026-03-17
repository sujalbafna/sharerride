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
  ShieldAlert,
  UserPlus,
  IndianRupee,
  Gift,
  Bell
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
import { SearchFriendsDialog } from "@/components/search-friends-dialog"

export default function Home() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  
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

  const userName = useMemo(() => {
    if (userData) {
      const first = userData.firstName || ""
      const last = userData.lastName || ""
      const full = `${first} ${last}`.trim()
      if (full) return full
    }
    return user?.displayName || user?.email?.split('@')[0] || "User"
  }, [userData, user])

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
      collection(db, "users", user.uid, "trustedContacts")
    )
  }, [db, user])

  const { data: contacts } = useCollection(contactsQuery)

  const pendingRequestsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "supportRequests"),
      where("status", "==", "Pending")
    )
  }, [db, user])

  const { data: pendingRequests } = useCollection(pendingRequestsQuery)

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

            <SearchFriendsDialog userName={userName}>
              <Card className="rounded-[2rem] border-none shadow-2xl bg-primary text-primary-foreground overflow-hidden cursor-pointer active:scale-95 transition-all">
                 <CardContent className="p-6 space-y-4 text-center">
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                      <UserPlus className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-black uppercase tracking-tight">Connect with Friends</h4>
                      <p className="text-[10px] opacity-90 font-bold leading-relaxed uppercase tracking-widest">
                        Search by name to send connection requests and build your trusted safety network.
                      </p>
                    </div>
                 </CardContent>
              </Card>
            </SearchFriendsDialog>
          </div>

          <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-cols-1 gap-6">
              <Card className="rounded-3xl border-none shadow-sm bg-card transition-all hover:shadow-md duration-300 cursor-pointer" onClick={() => router.push("/contacts")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Friend Circle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-5xl font-black text-primary tracking-tighter">{contacts?.length || 0}</p>
                      <p className="text-xs font-bold text-muted-foreground mt-2">Verified safety connections</p>
                    </div>
                    <Button variant="ghost" className="rounded-full h-12 w-12 bg-secondary/50 text-primary">
                      <ArrowRight className="h-6 w-6" />
                    </Button>
                  </div>
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
                                  {j.paymentType === "Paid" ? (
                                    <Badge variant="outline" className="text-[9px] uppercase font-black border-primary/30 text-primary h-4">₹{j.feeAmount}</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[9px] uppercase font-black border-accent/30 text-accent h-4">FREE</Badge>
                                  )}
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
          </div>
        </div>
      </main>
    </div>
  )
}
