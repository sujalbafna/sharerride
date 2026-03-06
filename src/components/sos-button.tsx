
"use client"

import { useState, useRef, useCallback } from "react"
import { AlertCircle, Loader2, ShieldAlert, Car, Wrench, Mountain, HeartPulse } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { collection, addDoc, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { generateEmergencyMessage } from "@/ai/flows/emergency-message-composer-flow"

const emergencyTypes = [
  { id: "accident", label: "Accident", icon: Car, color: "text-destructive", bg: "bg-secondary" },
  { id: "vehicle", label: "Vehicle Issue", icon: Wrench, color: "text-primary", bg: "bg-secondary" },
  { id: "natural", label: "Natural Disaster", icon: Mountain, color: "text-primary", bg: "bg-secondary" },
  { id: "medical", label: "Medical", icon: HeartPulse, color: "text-destructive", bg: "bg-secondary" },
]

const HOLD_DURATION = 3000

export function SOSButton() {
  const [isSending, setIsSending] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isHolding, setIsHolding] = useState(false)
  const holdTimer = useRef<NodeJS.Timeout | null>(null)
  
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData } = useDoc(userRef)
  
  const senderName = userData ? `${userData.firstName} ${userData.lastName}` : (user?.displayName || "User")

  const triggerSmsAlert = useCallback(async () => {
    if (!user || !db || !userData?.emergencySmsNumbers?.length) {
      toast({ 
        variant: "destructive", 
        title: "Setup Required", 
        description: "Please configure 3 emergency mobile numbers in the SOS settings first." 
      })
      return
    }

    setIsSending(true)
    try {
      // Composition with AI
      const { message: baseMessage } = await generateEmergencyMessage({
        location: "My Current Live GPS Location",
        situation: "Immediate Emergency Assistance Required"
      })

      const googleMapsUrl = `https://www.google.com/maps?q=12.9716,77.5946`
      const finalMessage = `${baseMessage}\n\nTrack me: ${googleMapsUrl}`
      const numbers = userData.emergencySmsNumbers.join(",")
      
      // Open SMS app with recipient numbers and body
      const smsUri = `sms:${numbers}?body=${encodeURIComponent(finalMessage)}`
      window.open(smsUri, '_blank')

      // Also record in Firestore
      await addDoc(collection(db, "users", user.uid, "emergencyAlerts"), {
        userId: user.uid,
        timestamp: new Date().toISOString(),
        alertLocationDescription: "Current GPS Location",
        alertLatitude: 12.9716,
        alertLongitude: 77.5946,
        alertMessage: finalMessage,
        status: "Sent",
        emergencyType: "QuickHold",
        recipientsContactIds: []
      })

      toast({
        title: "SMS Protocol Triggered",
        description: "Emergency message composed for your 3 trusted contacts.",
      })
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "Protocol Failed", description: "Failed to initialize SMS alert." })
    } finally {
      setIsSending(false)
      setIsHolding(false)
    }
  }, [user, db, userData, toast])

  const startHold = () => {
    setIsHolding(true)
    holdTimer.current = setTimeout(() => {
      triggerSmsAlert()
    }, HOLD_DURATION)
  }

  const cancelHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
    setIsHolding(false)
  }

  const handleSOS = async () => {
    if (!user || !db || !selectedType) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select an emergency category." })
      return
    }

    setIsSending(true)
    try {
      const typeLabel = emergencyTypes.find(t => t.id === selectedType)?.label || "Emergency"
      const message = `SOS ALERT from ${senderName}: I am facing a ${typeLabel} emergency. My current coordinates are tracked. Please check my live location.`
      
      await addDoc(collection(db, "users", user.uid, "emergencyAlerts"), {
        userId: user.uid,
        timestamp: new Date().toISOString(),
        alertLocationDescription: "Current GPS Location",
        alertLatitude: 12.9716,
        alertLongitude: 77.5946,
        alertMessage: message,
        status: "Sent",
        emergencyType: selectedType,
        recipientsContactIds: []
      })

      toast({
        title: "SOS Protocol Activated",
        description: `Your friends have been notified. Emergency type: ${typeLabel}.`,
      })
      
      setIsSending(false)
      setTimeout(() => setIsOpen(false), 1500)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Alert Failure",
        description: "Communication link failed. Please try again.",
      })
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button 
          className="relative group outline-none"
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={startHold}
          onTouchEnd={cancelHold}
        >
          <div className={cn(
            "absolute inset-0 bg-white/20 rounded-full transition-all duration-300",
            isHolding ? "animate-none scale-110" : "animate-ping"
          )} />
          <div className={cn(
            "relative h-40 w-40 rounded-full bg-destructive flex flex-col items-center justify-center shadow-xl transition-all duration-300 border-8 border-white/10",
            isHolding ? "scale-95 bg-red-800" : "active:scale-90"
          )}>
            {isSending ? (
              <Loader2 className="h-10 w-10 text-white animate-spin" />
            ) : (
              <>
                <ShieldAlert className="h-10 w-10 text-white mb-2" />
                <span className="text-white text-4xl font-black tracking-tighter">SOS</span>
                {isHolding && (
                  <span className="absolute bottom-4 text-[8px] font-black text-white uppercase tracking-widest animate-pulse">
                    HOLDING...
                  </span>
                )}
              </>
            )}
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl p-8 border-none shadow-2xl bg-card">
        <DialogHeader className="text-center space-y-4">
          <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <DialogTitle className="text-3xl font-black tracking-tight text-destructive">
            Emergency Dispatch
          </DialogTitle>
          <DialogDescription className="text-base font-medium">
            Select emergency type for system broadcast, or <span className="text-destructive font-black">Hold for 3s</span> to trigger SMS.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3 py-6">
          {emergencyTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2",
                selectedType === type.id 
                  ? "border-destructive bg-secondary" 
                  : "border-muted hover:border-destructive/30 bg-card"
              )}
            >
              <div className={cn("p-2 rounded-xl", type.bg)}>
                <type.icon className={cn("h-6 w-6", type.color)} />
              </div>
              <span className="text-xs font-bold uppercase tracking-tight">{type.label}</span>
            </button>
          ))}
        </div>

        <DialogFooter className="flex flex-col gap-3">
          <Button 
            variant="destructive" 
            className="w-full h-16 text-xl font-black rounded-2xl shadow-lg"
            onClick={handleSOS}
            disabled={isSending || !selectedType}
          >
            {isSending ? <Loader2 className="animate-spin mr-3 h-6 w-6" /> : null}
            ACTIVATE PROTOCOL
          </Button>
          <Button variant="ghost" className="w-full h-12 font-bold text-muted-foreground" onClick={() => setIsOpen(false)}>
            CANCEL
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
