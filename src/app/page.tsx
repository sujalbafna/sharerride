
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SOSButton } from "@/components/sos-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, MapPin, Clock, ArrowRight, UserPlus, Zap, Bell, Activity, Loader2 } from "lucide-react"
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

  const journeysQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "journeys"),
      orderBy("startTime", "desc"),
      limit(3)
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

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b flex items-center justify-between px-8 bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold tracking-tight">Overview</h2>
          <Badge variant="outline" className="text-[10px] border-primary/20 bg-primary/5">
            <Activity className="h-3 w-3 mr-1 text-primary" />
            LIVE SYSTEM
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" className="relative rounded-full">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <Card className="rounded-3xl border-none shadow-xl bg-primary text-primary-foreground overflow-hidden">
              <CardContent className="p-8 text-center space-y-6">
                <SOSButton />
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">Emergency Response</h3>
                  <p className="text-sm opacity-80">Triggering SOS notifies all your registered guardians immediately with your location.</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="secondary" className="h-24 rounded-2xl flex flex-col gap-2 font-bold bg-card shadow-sm border-none hover:shadow-md transition-all">
                <MapPin className="h-6 w-6 text-primary" />
                NEW JOURNEY
              </Button>
              <Button variant="secondary" className="h-24 rounded-2xl flex flex-col gap-2 font-bold bg-card shadow-sm border-none hover:shadow-md transition-all">
                <UserPlus className="h-6 w-6 text-primary" />
                ADD GUARDIAN
              </Button>
            </div>

            <Card className="rounded-2xl border-none shadow-sm bg-accent/10 border-accent/20">
              <CardContent className="p-6 flex gap-4">
                <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-primary">Safety Intelligence</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    System monitors your routes to suggest real-time safety measures.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="rounded-2xl border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Active Guardians</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-black text-primary">{contacts?.length || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total registered emergency contacts</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Safe Journeys</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-black text-accent">{allJourneys?.length || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total journeys logged securely</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Activity
                </h3>
                <Button variant="link" className="text-xs font-bold uppercase tracking-wider">View All</Button>
              </div>

              {isJourneysLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)}
                </div>
              ) : !journeys || journeys.length === 0 ? (
                <Card className="rounded-2xl border-dashed border-2 bg-transparent">
                  <CardContent className="p-12 text-center">
                    <p className="text-sm text-muted-foreground">No recent journeys found. Start your first safe journey today.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {journeys.map((j) => (
                    <Card key={j.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                              <MapPin className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="font-bold">{j.startLocationDescription}</p>
                              <p className="text-xs text-muted-foreground">
                                {j.startTime ? format(new Date(j.startTime), "MMM d, h:mm a") : "Active now"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={j.status === 'Completed' ? 'secondary' : 'default'} className="uppercase text-[10px]">
                              {j.status}
                            </Badge>
                            <Button size="icon" variant="ghost" className="rounded-full">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
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
