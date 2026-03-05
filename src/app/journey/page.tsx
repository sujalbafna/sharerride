"use client"

import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { MapPin, Navigation, CheckCircle2, Share2, Compass, ShieldAlert, Clock, History, Loader2, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { StartJourneyDialog } from "@/components/start-journey-dialog"

export default function JourneyPage() {
  const { user } = useUser()
  const db = useFirestore()

  const journeysQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "journeys"),
      orderBy("startTime", "desc")
    )
  }, [db, user])

  const { data: journeys, isLoading } = useCollection(journeysQuery)
  const activeJourney = journeys?.find(j => j.status === 'InProgress' || j.status === 'Started')

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b flex items-center justify-between px-8 bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <h2 className="text-xl font-bold tracking-tight">Journeys</h2>
        {activeJourney && (
          <Badge variant="secondary" className="bg-accent/20 text-primary border-accent animate-pulse">
            LIVE TRACKING
          </Badge>
        )}
      </header>

      <main className="p-8 max-w-6xl mx-auto space-y-12">
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
            <Card className="rounded-[2.5rem] bg-primary text-primary-foreground border-none shadow-2xl overflow-hidden">
              <CardContent className="p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-4xl font-black mb-2">Transit in Progress</h3>
                      <p className="opacity-80">Safe sharing is enabled with your primary guardians.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest opacity-80">
                        <span>Route Progress</span>
                        <span>Tracking...</span>
                      </div>
                      <Progress value={20} className="h-3 bg-white/20" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold">
                        <Share2 className="mr-2 h-5 w-5" />
                        Share Link
                      </Button>
                      <Button className="h-14 rounded-2xl bg-accent text-primary hover:bg-accent/90 font-black">
                        <ShieldAlert className="mr-2 h-5 w-5" />
                        SOS ALERT
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 rounded-3xl p-8 backdrop-blur-sm space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-accent text-primary flex items-center justify-center shrink-0">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase opacity-60">Starting Point</p>
                          <p className="font-bold">{activeJourney.startLocationDescription}</p>
                        </div>
                      </div>
                      <div className="h-8 w-px bg-white/20 ml-5" />
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
                          <Navigation className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase opacity-60">Destination</p>
                          <p className="font-bold">{activeJourney.endLocationDescription}</p>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-white/10 pt-6">
                      <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4">Watching Guardians</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 opacity-60" />
                        <span>{activeJourney.sharedWithContactIds?.length || 0} contacts are receiving updates.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-12">
            <div className="space-y-8">
              <h1 className="text-5xl font-black tracking-tighter leading-tight">Ready for your next safe travel?</h1>
              <p className="text-muted-foreground text-xl">
                Setu Guardian provides discrete virtual companionship and real-time tracking for every step of your journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <StartJourneyDialog />
                <Button variant="outline" className="h-16 px-8 rounded-2xl text-lg font-bold border-2">
                  <History className="mr-2 h-6 w-6" />
                  HISTORY
                </Button>
              </div>
            </div>
            <div className="relative h-[400px] w-full bg-muted rounded-[3rem] overflow-hidden shadow-2xl border-4 border-card">
              <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/map/800/800')] opacity-50 grayscale" data-ai-hint="map city" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 bg-card/90 backdrop-blur-md p-6 rounded-2xl shadow-xl flex items-center gap-4 border">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nearby Status</p>
                  <p className="font-bold">System is ready for tracking</p>
                </div>
              </div>
            </div>
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
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">From</p>
                    <p className="font-bold text-sm truncate">{j.startLocationDescription}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">To</p>
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
