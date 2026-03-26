"use client"

import { useUser } from "@/firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, Package, UserCircle, MapPin, ChevronRight } from "lucide-react"

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
  const { user } = useUser()

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b flex items-center justify-between px-8 bg-card sticky top-0 z-20">
        <h2 className="text-xl font-bold tracking-tight">On-Demand Support</h2>
      </header>

      <main className="p-8 max-w-6xl mx-auto space-y-12">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl font-black tracking-tighter leading-tight">Discrete help, whenever you need it.</h1>
            <p className="text-muted-foreground text-xl">
              Send specific requests to your trusted network without triggering a full SOS alert.
              Perfect for ride requests, safety check-ins, or transport assistance.
            </p>
            <div className="flex items-center gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/10 max-w-md">
              <MapPin className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium">Automatic location sharing enabled for all support requests.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {supportOptions.map((opt) => (
              <Card key={opt.id} className="rounded-2xl border-none shadow-sm hover:shadow-xl hover:translate-x-2 transition-all cursor-pointer group">
                <CardContent className="p-6 flex items-center gap-6">
                  <div className={`h-16 w-16 rounded-2xl ${opt.color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                    <opt.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{opt.title}</h4>
                    <p className="text-sm text-muted-foreground">{opt.desc}</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
