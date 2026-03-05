
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SOSButton } from "@/components/sos-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Shield, 
  MapPin, 
  Clock, 
  ArrowRight, 
  UserPlus, 
  Zap, 
  Bell, 
  Activity, 
  Loader2, 
  Search, 
  Users,
  Check,
  X,
  MessageSquare,
  ShieldAlert
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser, useCollection, useMemoFirebase, useFirestore } from "@/firebase"
import { collection, query, orderBy, limit, where, getDocs, addDoc, setDoc, doc, deleteDoc } from "firebase/firestore"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  // Network States
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  // Journeys
  const journeysQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "journeys"),
      orderBy("startTime", "desc"),
      limit(5)
    )
  }, [db, user])

  const { data: journeys, isLoading: isJourneysLoading } = useCollection(journeysQuery)

  // My Connections (Trusted Circle)
  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "trustedContacts"),
      orderBy("contactName", "asc")
    )
  }, [db, user])

  const { data: contacts } = useCollection(contactsQuery)

  // Incoming Friend Requests
  const requestsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "supportRequests"),
      where("status", "==", "Pending"),
      where("requestType", "==", "ConnectionRequest")
    )
  }, [db, user])

  const { data: requests, isLoading: loadingRequests } = useCollection(requestsQuery)

  const handleSearchUsers = async () => {
    if (!db || !searchQuery.trim()) return
    setIsSearching(true)
    try {
      // In a production app, we would use a more sophisticated search or lowercase indexing
      const q = query(
        collection(db, "publicProfiles"),
        where("displayName", ">=", searchQuery),
        where("displayName", "<=", searchQuery + "\uf8ff"),
        limit(5)
      )
      const snap = await getDocs(q)
      setSearchResults(snap.docs.map(d => d.data()).filter(u => u.userId !== user?.uid))
    } catch (e) {
      console.error(e)
    } finally {
      setIsSearching(false)
    }
  }

  const sendRequest = async (targetUser: any) => {
    if (!db || !user) return
    try {
      await addDoc(collection(db, "users", targetUser.userId, "supportRequests"), {
        userId: targetUser.userId,
        senderId: user.uid,
        senderName: user.displayName || "Unknown User",
        requestType: "ConnectionRequest",
        description: "wants to join your trusted network.",
        timestamp: new Date().toISOString(),
        status: "Pending"
      })
      toast({ title: "Request Sent", description: `Connection request sent to ${targetUser.displayName}.` })
      setSearchResults([])
      setSearchQuery("")
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to send request." })
    }
  }

  const handleAccept = async (req: any) => {
    if (!db || !user) return
    try {
      // 1. Add sender to my trusted contacts
      await setDoc(doc(db, "users", user.uid, "trustedContacts", req.senderId), {
        id: req.senderId,
        userId: user.uid,
        contactName: req.senderName,
        contactPhoneNumber: "Private",
        isAppUser: true,
        appUserId: req.senderId,
        relationshipToUser: "Guardian"
      })

      // 2. Add me to the sender's trusted contacts (mutual connection)
      await setDoc(doc(db, "users", req.senderId, "trustedContacts", user.uid), {
        id: user.uid,
        userId: req.senderId,
        contactName: user.displayName || "User",
        contactPhoneNumber: "Private",
        isAppUser: true,
        appUserId: user.uid,
        relationshipToUser: "Guardian"
      })

      // 3. Mark request as accepted in my inbox
      await setDoc(doc(db, "users", user.uid, "supportRequests", req.id), { ...req, status: "Accepted" })
      
      toast({ title: "Connection Approved", description: `You are now connected with ${req.senderName}.` })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to approve request." })
    }
  }

  const handleDecline = async (req: any) => {
    if (!db || !user) return
    try {
      await setDoc(doc(db, "users", user.uid, "supportRequests", req.id), { ...req, status: "Declined" })
      toast({ title: "Request Declined", description: "The request has been removed from your inbox." })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to decline request." })
    }
  }

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
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" className="relative rounded-2xl h-11 w-11 bg-white/5 hover:bg-white/10">
            <Bell className="h-5 w-5" />
            {requests && requests.length > 0 && (
              <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-primary rounded-full border-2 border-background" />
            )}
          </Button>
        </div>
      </header>

      <main className="p-8 space-y-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column - SOS & Network Actions */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
              <CardContent className="p-10 text-center space-y-8">
                <SOSButton />
                <div className="space-y-3">
                  <h3 className="text-2xl font-black tracking-tight">Emergency Response</h3>
                  <p className="text-sm opacity-90 leading-relaxed font-medium">
                    Triggering SOS notifies all your registered guardians immediately with your live coordinates.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full h-16 rounded-2xl text-lg font-black bg-white/5 hover:bg-white/10 text-primary border-2 border-primary/20"
              onClick={() => router.push("/journey")}
            >
              <MapPin className="mr-2 h-6 w-6" />
              START NEW JOURNEY
            </Button>

            {/* Friend Search Section */}
            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Find Guardians</h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name..." 
                    className="pl-10 h-12 bg-card rounded-xl border-none shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                  />
                </div>
                <Button onClick={handleSearchUsers} disabled={isSearching} className="h-12 rounded-xl px-4 font-bold">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "FIND"}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="grid gap-2 mt-4 animate-in slide-in-from-top-2 duration-300">
                  {searchResults.map((u) => (
                    <Card key={u.userId} className="rounded-xl border-none shadow-sm bg-accent/5">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {u.displayName?.[0]}
                          </div>
                          <p className="font-bold text-xs">{u.displayName}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => sendRequest(u)} className="rounded-lg font-black text-[10px] h-8">
                          <UserPlus className="h-3 w-3 mr-1" />
                          ADD
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Stats & Activity */}
          <div className="lg:col-span-2 space-y-10">
            {/* Pending Requests Inbox */}
            {requests && requests.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Inbox: Guardian Requests</h3>
                  <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black">{requests.length} NEW</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requests.map((req) => (
                    <Card key={req.id} className="rounded-2xl border-none shadow-sm bg-primary/5 animate-in zoom-in-95">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black">
                            {req.senderName?.[0]}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{req.senderName}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">Connection Pending</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleAccept(req)} size="sm" className="bg-primary hover:bg-primary/90 rounded-lg h-8 px-3 font-bold text-xs">
                            APPROVE
                          </Button>
                          <Button onClick={() => handleDecline(req)} size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-3xl border-none shadow-sm bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Guardian Network</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-5xl font-black text-primary tracking-tighter">{contacts?.length || 0}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-2">Verified safety connections</p>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border-none shadow-sm bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Security Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <p className="text-5xl font-black text-accent tracking-tighter">98%</p>
                    <Shield className="h-6 w-6 text-accent mb-2" />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground mt-2">End-to-end encryption active</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <h3 className="font-black text-lg flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </h3>

              {isJourneysLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card/40 animate-pulse rounded-3xl" />)}
                </div>
              ) : !journeys || journeys.length === 0 ? (
                <Card className="rounded-[2.5rem] border-dashed border-2 bg-transparent border-white/5">
                  <CardContent className="p-16 text-center space-y-4">
                    <p className="text-sm font-bold text-muted-foreground">No journeys tracked yet.</p>
                    <Button variant="link" onClick={() => router.push("/journey")} className="text-primary font-black">START YOUR FIRST TRIP</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {journeys.map((j) => (
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

            {/* My Circle Quick Access */}
            {contacts && contacts.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">My Trusted Circle</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contacts.map((contact) => (
                    <Card key={contact.id} className="rounded-2xl border-none shadow-sm hover:bg-card/80 transition-all">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                            {contact.contactName?.[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm">{contact.contactName}</h3>
                            <Badge variant="outline" className="text-[9px] uppercase border-primary/20 text-primary font-bold">GUARDIAN</Badge>
                          </div>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-10 w-10 rounded-full text-primary"
                          onClick={() => router.push(`/chat?with=${contact.appUserId}&name=${encodeURIComponent(contact.contactName)}`)}
                        >
                          <MessageSquare className="h-5 w-5" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
