
"use client"

import { useState } from "react"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, addDoc } from "firebase/firestore"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navigation, Shield, Loader2, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export function StartJourneyDialog() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startLoc, setStartLoc] = useState("")
  const [endLoc, setEndLoc] = useState("")

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "trustedContacts")
  }, [db, user])

  const { data: contacts } = useCollection(contactsQuery)

  const handleStart = async () => {
    if (!user || !db || !startLoc || !endLoc) return

    setIsSubmitting(true)
    const allFriendIds = contacts?.map(c => c.id) || []
    
    const journeyData = {
      userId: user.uid,
      journeyType: "General",
      status: "InProgress",
      startTime: new Date().toISOString(),
      startLocationDescription: startLoc,
      startLatitude: 12.9716,
      startLongitude: 77.5946,
      endLocationDescription: endLoc,
      endLatitude: 12.9720,
      endLongitude: 77.5950,
      sharedWithContactIds: allFriendIds,
      createdAt: new Date().toISOString()
    }

    const journeysRef = collection(db, "users", user.uid, "journeys")
    
    try {
      await addDoc(journeysRef, journeyData)
      
      // Notify all friends automatically
      if (contacts && contacts.length > 0) {
        for (const friendContact of contacts) {
          if (friendContact.appUserId) {
            await addDoc(collection(db, "users", friendContact.appUserId, "supportRequests"), {
              userId: friendContact.appUserId,
              senderId: user.uid,
              senderName: user.displayName || "Member",
              requestType: "JourneyNotification",
              description: `has started a journey from ${startLoc} to ${endLoc}. You are a designated friend for this trip.`,
              timestamp: new Date().toISOString(),
              status: "Pending"
            })
          }
        }
      }

      toast({
        title: "Journey Started",
        description: contacts && contacts.length > 0 
          ? `All ${contacts.length} friends have been notified and tracking is active.`
          : "Your journey has started. Tracking is active.",
      })
      setIsOpen(false)
      setStartLoc("")
      setEndLoc("")
    } catch (error) {
      const contextualError = new FirestorePermissionError({
        operation: 'create',
        path: journeysRef.path,
        requestResourceData: journeyData
      })
      errorEmitter.emit('permission-error', contextualError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="h-16 px-8 rounded-2xl text-lg font-black bg-primary">
          <Navigation className="mr-2 h-6 w-6" />
          START NEW JOURNEY
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-8 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Initialize Journey
          </DialogTitle>
          <DialogDescription>
            Enter your route details. Your entire friend circle will be notified automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start">Starting Point</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="start" 
                  placeholder="e.g. Current Location or Home" 
                  className="pl-10 h-12 rounded-xl"
                  value={startLoc}
                  onChange={(e) => setStartLoc(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Final Destination</Label>
              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="end" 
                  placeholder="e.g. Office or Central Mall" 
                  className="pl-10 h-12 rounded-xl"
                  value={endLoc}
                  onChange={(e) => setEndLoc(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            className="w-full h-14 rounded-2xl font-black text-lg bg-primary shadow-xl" 
            onClick={handleStart}
            disabled={isSubmitting || !startLoc || !endLoc}
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            BROADCAST ITINERARY
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
