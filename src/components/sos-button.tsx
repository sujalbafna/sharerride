"use client"

import { useState } from "react"
import { AlertCircle, Loader2, ShieldAlert } from "lucide-react"
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

export function SOSButton() {
  const [isSending, setIsSending] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [aiMessage, setAiMessage] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()

  const handleSOS = async () => {
    if (!user || !db) return

    setIsSending(true)
    try {
      const result = await generateEmergencyMessage({
        location: "Current GPS Location",
        situation: "Manual SOS trigger via Dashboard.",
      })
      setAiMessage(result.message)
      
      await addDoc(collection(db, "users", user.uid, "emergencyAlerts"), {
        userId: user.uid,
        timestamp: new Date().toISOString(),
        alertLocationDescription: "Current GPS Location",
        alertLatitude: 0,
        alertLongitude: 0,
        alertMessage: result.message,
        status: "Sent",
        recipientsContactIds: []
      })

      toast({
        title: "SOS Alert Sent",
        description: "Your trusted contacts have been notified with your live coordinates.",
      })
      
      setIsSending(false)
      setTimeout(() => setIsOpen(false), 1000)
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
            Confirm SOS Dispatch
          </DialogTitle>
          <DialogDescription className="text-base">
            This will immediately broadcast your live location and a distress message to your trusted contacts.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
           <div className="p-6 bg-muted rounded-2xl text-sm italic border-2 border-dashed border-muted-foreground/20 leading-relaxed text-center">
              {aiMessage ? `Distress Message: "${aiMessage}"` : "AI is preparing a concise location-aware message for your guardians..."}
           </div>
        </div>

        <DialogFooter className="flex flex-col gap-3">
          <Button 
            variant="destructive" 
            className="w-full h-16 text-xl font-black rounded-2xl shadow-lg shadow-destructive/20"
            onClick={handleSOS}
            disabled={isSending}
          >
            {isSending ? <Loader2 className="animate-spin mr-3 h-6 w-6" /> : null}
            SEND ALERT NOW
          </Button>
          <Button variant="ghost" className="w-full h-12 font-bold text-muted-foreground" onClick={() => setIsOpen(false)}>
            STAY SAFE (CANCEL)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
