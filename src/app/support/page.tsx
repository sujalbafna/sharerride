"use client"

import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, Package, UserCircle, MapPin, ChevronRight, MessageCircle, HelpCircle, Loader2 } from "lucide-react"

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
  const db = useFirestore()

  const requestsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "supportRequests"),
      orderBy("timestamp", "desc")
    )
  }, [db, user])

  const { data: requests, isLoading } = useCollection(requestsQuery)

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b flex items-center justify-between px-8 bg-card/50 backdrop-blur-md sticky top-0 z-20">
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

        <section className="space-y-6 pt-12">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
            <MessageCircle className="h-4 w-4" />
            Active & Past Requests
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Retrieving support history...</p>
            </div>
          ) : !requests || requests.length === 0 ? (
            <Card className="rounded-[2rem] border-dashed border-2 bg-transparent">
              <CardContent className="p-16 text-center space-y-4">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <HelpCircle className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="space-y-2">
                  <p className="font-bold">No active requests found</p>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    When you request assistance, it will appear here. Your network will be notified immediately.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.map((req) => (
                <Card key={req.id} className="rounded-2xl border-none shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-widest text-primary">{req.requestType}</span>
                      <Badge variant="outline" className="text-[9px]">{req.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm font-medium mb-4 line-clamp-3">{req.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      <Clock className="h-3 w-3" />
                      {new Date(req.timestamp).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
