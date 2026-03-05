"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Users, ShieldCheck, Loader2, Info, Handshake } from "lucide-react"
import { calculateMeetingPoints, type MeetingPointsOutput } from "@/ai/flows/meeting-points-generator-flow"
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase"
import { collection, addDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

interface MeetingPointsDisplayProps {
  startLocation: string
  destination: string
  userId: string
}

export function MeetingPointsDisplay({ startLocation, destination, userId }: MeetingPointsDisplayProps) {
  const [points, setPoints] = useState<MeetingPointsOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const db = useFirestore()
  const { toast } = useToast()

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !userId) return null
    return collection(db, "users", userId, "trustedContacts")
  }, [db, userId])

  const { data: contacts } = useCollection(contactsQuery)

  useEffect(() => {
    async function fetchPoints() {
      if (!startLocation || !destination || !contacts) return
      setIsLoading(true)
      try {
        const result = await calculateMeetingPoints({
          startLocation,
          destination,
          availableContacts: contacts.map(c => ({
            id: c.id,
            name: c.contactName,
            relationship: c.relationshipToUser
          }))
        })
        setPoints(result)
      } catch (error) {
        console.error("Failed to calculate meeting points", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPoints()
  }, [startLocation, destination, contacts])

  const handleRequestMeeting = async (point: any) => {
    if (!db || !userId) return
    
    setRequestingId(point.id)
    const requestData = {
      userId: userId,
      requestType: "MeetingCompanion",
      description: `I'd like to meet at ${point.pointName} for safety coordination. Estimated time: ${point.estimatedTimeFromStart}.`,
      timestamp: new Date().toISOString(),
      status: "Pending",
      targetLocationDescription: point.pointName,
      requestedContactIds: point.nearbyGuardians,
      currentJourneyId: "active-journey" // In a real app, pass the actual journey ID
    }

    try {
      await addDoc(collection(db, "users", userId, "supportRequests"), requestData)
      toast({
        title: "Meeting Request Sent",
        description: `Nearby guardians have been prompted for a rendezvous at ${point.pointName}.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: "Could not send the meeting prompt. Please try again.",
      })
    } finally {
      setRequestingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4 bg-muted/20 rounded-3xl border-2 border-dashed">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Calculating Optimal Route Checkpoints...</p>
      </div>
    )
  }

  if (!points) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          Optimal Meeting Points
        </h4>
        <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">KNN & CURVE CALCULATED</Badge>
      </div>

      <div className="grid gap-3">
        {points.meetingPoints.map((point) => (
          <Card key={point.id} className="rounded-2xl border-none shadow-sm bg-white/5 backdrop-blur-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-sm text-white">{point.pointName}</p>
                    <span className="text-[10px] font-black text-accent">{point.safetyScore}% SAFETY</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{point.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex flex-col gap-1">
                   <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-white/40">
                    <Users className="h-3 w-3" />
                    {point.nearbyGuardians.length} Proximate Guardians
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-white/40">
                    <Info className="h-3 w-3" />
                    ETA: {point.estimatedTimeFromStart}
                  </div>
                </div>
                {point.nearbyGuardians.length > 0 && (
                  <Button 
                    size="sm" 
                    className="h-8 rounded-lg bg-accent text-primary hover:bg-accent/90 text-[10px] font-black uppercase"
                    onClick={() => handleRequestMeeting(point)}
                    disabled={requestingId === point.id}
                  >
                    {requestingId === point.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Handshake className="h-3 w-3 mr-1" />}
                    PROMPT MEETING
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
