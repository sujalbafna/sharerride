"use client"

import { useState } from "react"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { MapPin, Users, Navigation, CheckCircle2, Share2, Compass, ShieldAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function JourneyPage() {
  const [isJourneyActive, setIsJourneyActive] = useState(false)

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="p-6 bg-white border-b sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-black text-primary tracking-tight">Active Journey</h1>
        {isJourneyActive && <Badge variant="secondary" className="bg-accent/20 text-primary border-accent animate-pulse">LIVE TRACKING</Badge>}
      </header>

      <main className="p-6 space-y-6">
        {!isJourneyActive ? (
          <div className="space-y-6">
            <div className="relative h-64 w-full bg-muted rounded-3xl overflow-hidden border shadow-inner flex items-center justify-center">
              <Compass className="h-12 w-12 text-muted-foreground/30 animate-spin-slow" />
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl border flex items-center gap-3">
                 <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                   <MapPin className="h-4 w-4 text-primary" />
                 </div>
                 <div className="flex-1">
                   <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Current Location</p>
                   <p className="text-sm font-bold truncate">Terminal 3, International Airport</p>
                 </div>
              </div>
            </div>

            <Card className="rounded-3xl border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold">Journey Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-2xl border border-dashed space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <p className="text-sm font-medium">Pickup: Airport Terminal 3</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-accent" />
                    <p className="text-sm font-medium text-muted-foreground italic">Set destination...</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                   <Button onClick={() => setIsJourneyActive(true)} className="h-14 rounded-2xl text-lg font-bold bg-primary hover:bg-primary/90">
                     <Navigation className="mr-2 h-5 w-5" />
                     START JOURNEY
                   </Button>
                   <Button variant="outline" className="h-14 rounded-2xl font-bold border-2">
                     <Users className="mr-2 h-5 w-5" />
                     VIRTUAL COMPANION
                   </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="rounded-3xl bg-primary text-primary-foreground border-none overflow-hidden shadow-xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">On the way</h3>
                    <p className="text-xs opacity-70">ETA: 14 Mins • 5.2 km remaining</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-accent text-primary flex items-center justify-center font-bold border-2 border-white/20">
                    JD
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-80">
                    <span>Progress</span>
                    <span>65%</span>
                  </div>
                  <Progress value={65} className="h-2 bg-white/20" />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-8">
                   <Button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl h-12">
                     <Share2 className="mr-2 h-4 w-4" />
                     Share Link
                   </Button>
                   <Button className="bg-accent text-primary hover:bg-accent/90 font-bold rounded-xl h-12">
                     <ShieldAlert className="mr-2 h-4 w-4" />
                     Help Me
                   </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
               <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Tracking Guardians</h3>
               <div className="flex -space-x-3 mb-6">
                 {[1, 2, 3].map((i) => (
                   <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold overflow-hidden">
                     <img src={`https://picsum.photos/seed/guard${i}/40/40`} alt="Guardian" />
                   </div>
                 ))}
                 <div className="h-10 w-10 rounded-full border-2 border-background bg-accent text-primary flex items-center justify-center text-xs font-bold">
                   +2
                 </div>
               </div>
            </div>

            <Button onClick={() => setIsJourneyActive(false)} variant="outline" className="w-full h-14 rounded-2xl border-primary text-primary font-black text-lg border-2">
               I HAVE ARRIVED
               <CheckCircle2 className="ml-2 h-6 w-6 text-accent" />
            </Button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}