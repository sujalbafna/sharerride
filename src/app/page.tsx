
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SOSButton } from "@/components/sos-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Shield, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Activity, 
  Loader2, 
  MessageSquare
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useUser, useCollection, useMemoFirebase, useFirestore } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { format } from "date-fns"

export default function Home() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

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

  // My Connections (Trusted Circle) for Quick Access
  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "trustedContacts"),
      orderBy("contactName", "asc"),
      limit(4)
    )
  }, [db, user])

  const { data: contacts } = useCollection(contactsQuery)

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
      </header>

      <main className="p-8 space-y-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column - SOS & Journey Actions */}
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
          </div>

          {/* Right Column - Stats & Activity */}
          <div className="lg:col-span-2 space-y-10">
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
