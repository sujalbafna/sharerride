
"use client"

import { useState } from "react"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  Filter, 
  ArrowUpDown, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Phone, 
  ShieldAlert,
  Loader2,
  ArrowLeft
} from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GoogleMap } from "@/components/google-map"

export default function AlertsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  const alertsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    let baseQuery = query(
      collection(db, "users", user.uid, "emergencyAlerts"),
      orderBy("timestamp", sortOrder)
    )
    
    if (filterStatus) {
      baseQuery = query(baseQuery, where("status", "==", filterStatus))
    }
    
    return baseQuery
  }, [db, user, sortOrder, filterStatus])

  const { data: alerts, isLoading } = useCollection(alertsQuery)

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="h-16 border-b flex items-center justify-between px-8 bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => router.push("/profile")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold tracking-tight">Alerts History</h2>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl h-9">
                <Filter className="h-4 w-4 mr-2" />
                {filterStatus || "Filter"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterStatus(null)}>All Alerts</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Sent")}>Sent</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Acknowledged")}>Acknowledged</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Resolved")}>Resolved</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl h-9"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortOrder === "desc" ? "Newest" : "Oldest"}
          </Button>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">
            <Bell className="h-4 w-4" />
            Security Event Log
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Retrieving security logs...</p>
            </div>
          ) : !alerts || alerts.length === 0 ? (
            <Card className="rounded-[2rem] border-dashed border-2 bg-transparent">
              <CardContent className="p-16 text-center space-y-6">
                <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                  <ShieldAlert className="h-10 w-10 text-primary/20" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold">No Alerts Recorded</h4>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
                    Your safety log is currently empty. Any emergency activations or safety checks will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {alerts.map((alert, index) => (
                <Card key={alert.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
                  <CardHeader className="p-6 pb-4 bg-muted/20">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                          <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-black">Alert {alerts.length - index}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(alert.timestamp), "MMM d, yyyy • h:mm a")}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge 
                        variant={alert.status === 'Resolved' ? 'secondary' : 'destructive'}
                        className="rounded-lg uppercase text-[9px] font-black tracking-widest px-2"
                      >
                        {alert.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Description</p>
                          <p className="text-sm font-medium leading-relaxed italic text-primary/80">
                            "{alert.alertMessage}"
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Location</p>
                          <div className="flex items-center gap-2 text-sm font-bold mb-3">
                            <MapPin className="h-4 w-4 text-destructive" />
                            {alert.alertLocationDescription}
                          </div>
                          {/* Mini Map Preview for Alerts */}
                          <div className="h-32 w-full rounded-xl overflow-hidden border">
                            <GoogleMap 
                              variant="alert" 
                              interactive={false} 
                              className="h-full w-full rounded-none border-none" 
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-border/50 md:pl-6">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Action Taken</p>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                              <Phone className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs font-bold">Network Broadcast</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{alert.recipientsContactIds?.length || 0} Guardians Contacted</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <ShieldAlert className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs font-bold">Status Update</p>
                              <p className="text-[10px] text-muted-foreground uppercase">Manual Override Recorded</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <div className="p-6 bg-accent/5 rounded-[2.5rem] border-2 border-dashed border-accent/20 text-center">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-relaxed">
            All security logs are cryptographically sealed and stored for 90 days in compliance with transit safety protocols.
          </p>
        </div>
      </main>
    </div>
  )
}
