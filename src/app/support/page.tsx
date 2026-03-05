"use client"

import { BottomNav } from "@/components/layout/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, Package, UserCircle, MapPin, ChevronRight, MessageCircle } from "lucide-react"

const supportOptions = [
  { 
    id: "ride", 
    title: "Need a Ride", 
    desc: "Ask your trusted network for a pickup nearby.", 
    icon: Car, 
    color: "bg-blue-500" 
  },
  { 
    id: "goods", 
    title: "Transport Goods", 
    desc: "Request help moving packages or delivery.", 
    icon: Package, 
    color: "bg-purple-500" 
  },
  { 
    id: "meet", 
    title: "Meeting Companion", 
    desc: "Invite someone to meet you at a point.", 
    icon: UserCircle, 
    color: "bg-teal-500" 
  }
]

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="p-6 bg-white border-b sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-black text-primary tracking-tight">On-Demand Support</h1>
      </header>

      <main className="p-6 space-y-6">
        <div className="bg-primary p-6 rounded-[2rem] text-primary-foreground shadow-lg">
           <h2 className="text-xl font-bold mb-2">Discrete Support</h2>
           <p className="text-sm opacity-80 leading-relaxed mb-6">
             Send specific requests to your trusted network without sounding an alarm.
           </p>
           <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl">
              <MapPin className="h-5 w-5 text-accent" />
              <span className="text-xs font-medium">Auto-sharing location with requests</span>
           </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">How can we help?</h3>
          {supportOptions.map((opt) => (
            <Card key={opt.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl ${opt.color} flex items-center justify-center shrink-0`}>
                   <opt.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{opt.title}</h4>
                  <p className="text-xs text-muted-foreground leading-tight">{opt.desc}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="pt-4">
          <Card className="rounded-2xl border-none shadow-sm bg-muted/30">
            <CardHeader>
               <CardTitle className="text-sm font-bold flex items-center gap-2">
                 <MessageCircle className="h-4 w-4 text-primary" />
                 Active Requests
               </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
               <div className="text-center py-8">
                 <p className="text-sm text-muted-foreground">You have no active support requests.</p>
                 <Button variant="link" className="text-primary font-bold text-xs mt-2 uppercase tracking-widest">
                   View History
                 </Button>
               </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}