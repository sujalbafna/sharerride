
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SOSButton } from "@/components/sos-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, MapPin, Clock, ArrowRight, UserPlus, Zap, Bell, Activity, Loader2, Search, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser, useCollection, useMemoFirebase, useFirestore } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { format } from "date-fns"

export default function Home() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  const journeysQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "journeys"),
      orderBy("startTime", "desc"),
      limit(10) // Fetch a few more for better local filtering
    )
  }, [db, user])

  const { data: journeys, isLoading: isJourneysLoading } = useCollection(journeysQuery)

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "trustedContacts")
  }, [db, user])

  const { data: contacts } = useCollection(contactsQuery)

  const journeysTotalQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "journeys")
  }, [db, user])

  const { data: allJourneys } = useCollection(journeysTotalQuery)

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  const filteredJourneys = journeys?.filter(j => 
    j.startLocationDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.endLocationDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredContacts = contacts?.filter(c =>
    c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.relationshipToUser.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const hasResults = (filteredJourneys?.length || 0) > 0 || (filteredContacts?.length || 0) > 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-background/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <h2 className="text-2xl font-black tracking-tighter">Overview</h2>
          <Badge variant="outline" className="text-[10px] border-primary/20 bg-primary/5 px-3 py-1 rounded-full hidden sm:flex">
            <Activity className="h-3 w-3 mr-1.5 text-primary" />
            LIVE SYSTEM
          </Badge>
        </div>

        <div className="flex-1 max-w-xl mx-4 sm:mx-12">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search journeys, status, or guardians..." 
              className="pl-12 h-12 bg-white/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/40 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" className="relative rounded-2xl h-11 w-11 bg-white/5 hover:bg-white/10">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-primary rounded-full border-2 border-background" />
          </Button>
        </div>
      </header>

      <main className="p-8 space-y-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column - SOS & Actions */}
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

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="secondary" 
                className="h-28 rounded-3xl flex flex-col gap-3 font-black bg-card shadow-sm border-none hover:shadow-xl hover:-translate-y-1 transition-all"
                onClick={() => router.push("/journey")}
              >
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                NEW JOURNEY
              </Button>
              <Button 
                variant="secondary" 
                className="h-28 rounded-3xl flex flex-col gap-3 font-black bg-card shadow-sm border-none hover:shadow-xl hover:-translate-y-1 transition-all"
                onClick={() => router.push("/contacts")}
              >
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                ADD GUARDIAN
              </Button>
            </div>

            <Card className="rounded-3xl border-none shadow-sm bg-accent/5 border border-accent/10">
              <CardContent className="p-6 flex gap-5">
                <div className="h-12 w-12 rounded-2xl bg-accent/20 flex items-center justify-center shrink-0">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-sm text-accent tracking-wide uppercase">Safety Intelligence</h4>
                  <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                    Setu Guardian is monitoring your environment to suggest real-time safety measures.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats & Activity */}
          <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-3xl border-none shadow-sm bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Active Guardians</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-5xl font-black text-primary tracking-tighter">{contacts?.length || 0}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-2">Verified emergency contacts in your circle</p>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border-none shadow-sm bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Safe Journeys</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-5xl font-black text-accent tracking-tighter">{allJourneys?.length || 0}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-2">Total trips logged with end-to-end encryption</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-black text-lg flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  {searchQuery ? "Search Results" : "Recent Activity"}
                </h3>
                {!searchQuery && (
                  <Button 
                    variant="link" 
                    className="text-xs font-black uppercase tracking-widest text-primary hover:no-underline"
                    onClick={() => router.push("/journey")}
                  >
                    View All
                  </Button>
                )}
              </div>

              {isJourneysLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card/40 animate-pulse rounded-3xl" />)}
                </div>
              ) : !hasResults ? (
                <Card className="rounded-[2.5rem] border-dashed border-2 bg-transparent border-white/5">
                  <CardContent className="p-20 text-center space-y-4">
                    <p className="text-sm font-bold text-muted-foreground">
                      {searchQuery ? `No matches found for "${searchQuery}"` : "Your journey history is empty. Start a trip to enable tracking."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Filtered Journeys */}
                  {filteredJourneys && filteredJourneys.length > 0 && (
                    <div className="space-y-4">
                      {searchQuery && <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-2">Journeys</p>}
                      {filteredJourneys.map((j) => (
                        <Card key={j.id} className="rounded-3xl border-none shadow-sm hover:shadow-xl hover:bg-card/80 transition-all group">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-5">
                                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                                  <MapPin className="h-7 w-7" />
                                </div>
                                <div className="space-y-1">
                                  <p className="font-black text-lg tracking-tight">{j.startLocationDescription}</p>
                                  <div className="flex items-center gap-3">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                      {j.startTime ? format(new Date(j.startTime), "MMM d, h:mm a") : "Active now"}
                                    </p>
                                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                    <p className="text-[10px] font-black text-primary/70 uppercase tracking-widest">
                                      {j.journeyType}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge 
                                  variant={j.status === 'Completed' ? 'secondary' : 'default'} 
                                  className="uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-lg"
                                >
                                  {j.status}
                                </Badge>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="rounded-xl h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all group-hover:translate-x-1"
                                  onClick={() => router.push("/journey")}
                                >
                                  <ArrowRight className="h-5 w-5" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Filtered Guardians (Only shown when searching) */}
                  {searchQuery && filteredContacts && filteredContacts.length > 0 && (
                    <div className="space-y-4 pt-4">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-2">Guardians</p>
                      {filteredContacts.map((c) => (
                        <Card key={c.id} className="rounded-3xl border-none shadow-sm hover:shadow-xl hover:bg-card/80 transition-all">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-5">
                                <div className="h-14 w-14 rounded-2xl bg-accent/10 text-primary flex items-center justify-center shadow-inner">
                                  <Users className="h-7 w-7" />
                                </div>
                                <div className="space-y-1">
                                  <p className="font-black text-lg tracking-tight">{c.contactName}</p>
                                  <p className="text-[10px] font-black text-accent uppercase tracking-widest">
                                    {c.relationshipToUser}
                                  </p>
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                className="rounded-xl font-bold h-10 px-4"
                                onClick={() => router.push(`/chat?with=${c.appUserId}&name=${encodeURIComponent(c.contactName)}`)}
                              >
                                CHAT
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
