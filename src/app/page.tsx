"use client"

import { SOSButton } from "@/components/sos-button"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Shield, MapPin, Clock, ArrowRight, UserPlus, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="p-6 bg-primary text-primary-foreground shadow-lg rounded-b-[2rem]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Setu Guardian</h1>
            <p className="text-xs opacity-80 font-medium">Your Personal Safety Companion</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold border-2 border-white/20">
            JD
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 bg-white/10 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
          <Shield className="h-5 w-5 text-accent" />
          <div className="text-sm">
            <p className="font-semibold">Security Status: Active</p>
            <p className="text-xs opacity-70">3 trusted contacts online</p>
          </div>
        </div>
      </header>

      <main className="px-6 -mt-4 space-y-6">
        {/* SOS Button Area */}
        <SOSButton />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full bg-accent/20 text-primary flex items-center justify-center mb-2">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-1">Start Journey</h3>
              <p className="text-[10px] text-muted-foreground leading-tight">Track your transit in real-time</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                <UserPlus className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-1">Add Contact</h3>
              <p className="text-[10px] text-muted-foreground leading-tight">Secure your safety network</p>
            </CardContent>
          </Card>
        </div>

        {/* Active/Recent Journey */}
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Recent Journey
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">COMPLETED</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <div className="w-0.5 h-6 bg-muted-foreground/30" />
                <div className="h-3 w-3 rounded-full bg-accent" />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium text-xs">Airport Terminal 3</p>
                <div className="my-2 border-t border-dashed w-full opacity-20" />
                <p className="font-medium text-xs">Home, Saket</p>
              </div>
              <Button size="icon" variant="ghost" className="rounded-full">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Tip */}
        <div className="bg-accent/10 border border-accent/20 p-4 rounded-2xl flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
             <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-primary">Guardian AI Tip</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Based on your location, we recommend sharing your journey with "Sarah" as you are in an unfamiliar area.
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}