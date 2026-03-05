
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, ShieldAlert, Phone, Users, Landmark, Wrench, Fuel, HeartPulse, Hotel, Loader2, ShieldCheck } from "lucide-react"
import { useFirestore, useUser } from "@/firebase"
import { collection, addDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { OTPVerificationDialog } from "./otp-verification-dialog"

const nearbyFacilities = [
  { id: "f1", name: "Metro General Hospital", type: "Hospital", icon: HeartPulse, dist: "1.2km" },
  { id: "f2", name: "District Police Outpost", type: "Police", icon: Landmark, dist: "0.8km" },
  { id: "f3", name: "Precision Auto Garage", type: "Garage", icon: Wrench, dist: "2.4km" },
  { id: "f4", name: "Sunset Plaza Hotel", type: "Hotel", icon: Hotel, dist: "3.1km" },
]

export function EmergencyProtocolDisplay() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [isRequestingExtended, setIsRequestingExtended] = useState(false)
  const [showOTP, setShowOTP] = useState(false)

  const handleRequestExtendedNetwork = async () => {
    setIsRequestingExtended(true)
    // Simulated delay for finding a "friend's friend"
    setTimeout(() => {
      setIsRequestingExtended(false)
      setShowOTP(true)
      toast({
        title: "Extended Network Match",
        description: "A friend's friend is nearby. Initializing 3-Way OTP Verification.",
      })
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-accent" />
          Emergency Support Link
        </h4>
        <Badge variant="destructive" className="text-[10px] animate-pulse">SOS ACTIVE</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {nearbyFacilities.map((facility) => (
          <Card key={facility.id} className="rounded-2xl border-none bg-white/10 backdrop-blur-sm border border-white/10">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <facility.icon className="h-4 w-4 opacity-80" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase opacity-60 truncate">{facility.type}</p>
                  <p className="text-xs font-bold truncate">{facility.name}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-[10px] font-bold opacity-60">{facility.dist} away</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-white/20">
                  <Phone className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-none bg-accent/20 border-2 border-dashed border-accent/40">
        <CardContent className="p-6 text-center space-y-4">
          <div className="h-12 w-12 bg-accent rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-sm">Request Extended Network</h5>
            <p className="text-[11px] opacity-70 leading-relaxed">
              Direct contacts unavailable? Request assistance from a "Friend's Friend" nearby. 
              Protected by 3-Way OTP Security.
            </p>
          </div>
          <Button 
            className="w-full h-11 rounded-xl bg-accent text-primary font-black text-xs uppercase"
            onClick={handleRequestExtendedNetwork}
            disabled={isRequestingExtended}
          >
            {isRequestingExtended ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Find Mutual Friend
          </Button>
        </CardContent>
      </Card>

      <OTPVerificationDialog open={showOTP} onOpenChange={setShowOTP} />
    </div>
  )
}
