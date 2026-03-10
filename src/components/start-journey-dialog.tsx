
"use client"

import { useState } from "react"
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, addDoc, doc } from "firebase/firestore"
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
import { Navigation, Shield, Loader2, MapPin, Users, Car } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function StartJourneyDialog() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startLoc, setStartLoc] = useState("")
  const [endLoc, setEndLoc] = useState("")
  const [seats, setSeats] = useState("0")
  const [vehicleName, setVehicleName] = useState("")
  const [acStatus, setAcStatus] = useState("AC")

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData } = useDoc(userRef)
  
  const userName = userData?.firstName && userData?.lastName 
    ? `${userData.firstName} ${userData.lastName}` 
    : (user?.displayName || user?.email?.split('@')[0] || "User")

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "trustedContacts")
  }, [db, user])

  const { data: contacts } = useCollection(contactsQuery)

  const handleStart = async () => {
    if (!user || !db || !startLoc || !endLoc) return

    setIsSubmitting(true)
    const availableSeatsCount = parseInt(seats) || 0
    const currentTimestamp = new Date().toISOString()
    
    const journeyData = {
      userId: user.uid,
      journeyType: "General",
      status: "InProgress",
      startTime: currentTimestamp,
      startLocationDescription: startLoc,
      startLatitude: 0,
      startLongitude: 0,
      endLocationDescription: endLoc,
      endLatitude: 0,
      endLongitude: 0,
      sharedWithContactIds: contacts?.map(c => c.appUserId).filter(Boolean) || [],
      availableSeats: availableSeatsCount,
      joinedUserIds: [],
      createdAt: currentTimestamp,
      vehicleName: vehicleName,
      acStatus: acStatus
    }

    try {
      const journeyDoc = await addDoc(collection(db, "users", user.uid, "journeys"), journeyData)
      const journeyId = journeyDoc.id;
      
      if (contacts && contacts.length > 0) {
        for (const friendContact of contacts) {
          if (friendContact.appUserId) {
            await addDoc(collection(db, "users", friendContact.appUserId, "supportRequests"), {
              userId: friendContact.appUserId,
              senderId: user.uid,
              senderName: userName,
              requestType: "JourneyNotification",
              description: `has started a journey from ${startLoc} to ${endLoc} in a ${acStatus} ${vehicleName || 'vehicle'}. You are a designated friend for this trip.`,
              timestamp: currentTimestamp,
              status: "Pending",
              targetJourneyId: journeyId,
              startLocation: startLoc,
              endLocation: endLoc
            })
          }
        }
      }

      toast({
        title: "Journey Started",
        description: `All your friends have been notified and tracking is active.`,
      })
      setIsOpen(false)
      setStartLoc("")
      setEndLoc("")
      setSeats("0")
      setVehicleName("")
      setAcStatus("AC")
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not start journey.",
      })
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
            Enter your route details to notify your network.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start">Origin</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="start" 
                  placeholder="Starting point..." 
                  className="pl-10 h-12 rounded-xl"
                  value={startLoc}
                  onChange={(e) => setStartLoc(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Destination</Label>
              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="end" 
                  placeholder="Where are you going?" 
                  className="pl-10 h-12 rounded-xl"
                  value={endLoc}
                  onChange={(e) => setEndLoc(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle Name</Label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="vehicle" 
                    placeholder="e.g. White Swift" 
                    className="pl-10 h-12 rounded-xl"
                    value={vehicleName}
                    onChange={(e) => setVehicleName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Comfort Status</Label>
                <RadioGroup value={acStatus} onValueChange={setAcStatus} className="flex h-12 items-center gap-4 bg-secondary/50 rounded-xl px-4 border border-input/20">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="AC" id="ac" />
                    <Label htmlFor="ac" className="text-xs font-bold cursor-pointer">AC</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Non-AC" id="non-ac" />
                    <Label htmlFor="non-ac" className="text-xs font-bold cursor-pointer">NON-AC</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seats">Seats Available</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="seats" 
                  type="number"
                  min="0"
                  placeholder="Enter capacity" 
                  className="pl-10 h-12 rounded-xl"
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
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
