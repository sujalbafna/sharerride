
"use client"

import { useState } from "react"
import { AlertCircle, Loader2, ShieldAlert, Car, Wrench, Mountain, HeartPulse, Shield, Landmark } from "lucide-react"
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
import { generateEmergencyMessage } from "@/ai/flows/emergency-message-composer-flow"
import { useFirestore, useUser } from "@/firebase"
import { collection, addDoc } from "firebase/firestore"
import { cn } from "@/lib/utils"

const emergencyTypes = [
  { id: "accident", label: "Accident", icon: Car, color: "text-red-500", bg: "bg-red-50" },
  { id: "vehicle", label: "Vehicle Issue", icon: Wrench, color: "text-orange-500", bg: "bg-orange-50" },
  { id: "natural", label: "Natural Disaster", icon: Mountain, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "medical", label: "Medical", icon: HeartPulse, color: "text-pink-500", bg: "bg-pink-50" },
]

export function SOSButton() {
  const [isSending, setIsSending] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [aiMessage, setAiMessage] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()

  const handleSOS = async () => {
    if (!user || !db || !selectedType) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select an emergency category." })
      return
    }

    setIsSending(true)
    try {
      const typeLabel = emergencyTypes.find(t => t.id === selectedType)?.label || "Emergency"
      const result = await generateEmergencyMessage({
        location: "Current GPS Location",
        situation: `${typeLabel} - Manual SOS trigger via Dashboard.`,
      })
      setAiMessage(result.message)
      
      await addDoc(collection(db, "users", user.uid, "emergencyAlerts"), {
        userId: user.uid,
        timestamp: new Date().toISOString(),
        alertLocationDescription: "Current GPS Location",
        alertLatitude: 12.9716,
        alertLongitude: 77.5946,
        alertMessage: result.message,
        status: "Sent",
        emergencyType: selectedType,
        recipientsContactIds: []
      })

      toast({
        title: "SOS Protocol Activated",
        description: `Nearest person on route notified. Emergency type: ${typeLabel}.`,
      })
      
      setIsSending(false)
      setTimeout(() => setIsOpen(false), 1500)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Alert Failure",
        description: "Communication link failed. Please use cellular backup for SOS.",
      })
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="relative group">
          <div className="absolute inset-0 bg-white/20 rounded-full animate-ping group-active:animate-none group-hover:bg-white/40" />
          <div className="relative h-40 w-40 rounded-full bg-destructive flex flex-col items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.4)] active:scale-90 transition-all duration-300 border-8 border-white/10 group-hover:border-white/20">
            <ShieldAlert className="h-10 w-10 text-white mb-2" />
            <span className="text-white text-4xl font-black tracking-tighter">SOS</span>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl p-8 border-none shadow-2xl">
        <DialogHeader className="text-center space-y-4">
          <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <DialogTitle className="text-3xl font-black tracking-tight text-destructive">
            Emergency Dispatch
          </DialogTitle>
          <DialogDescription className="text-base">
            Select the emergency category to notify your friends and nearest specialized responders.
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
                  ? "border-destructive bg-destructive/5" 
                  : "border-muted hover:border-destructive/30"
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
            className="w-full h-16 text-xl font-black rounded-2xl shadow-lg shadow-destructive/20"
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
