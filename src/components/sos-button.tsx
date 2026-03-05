"use client"

import { useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
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

export function SOSButton() {
  const [isSending, setIsSending] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [aiMessage, setAiMessage] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSOS = async () => {
    setIsSending(true)
    try {
      // In a real app, we'd fetch real location
      const result = await generateEmergencyMessage({
        location: "123 Main St, New Delhi",
        situation: "Immediate assistance needed. SOS triggered manually.",
      })
      setAiMessage(result.message)
      
      // Simulate dispatch
      setTimeout(() => {
        toast({
          title: "SOS Alert Sent",
          description: "All trusted contacts have been notified with your location.",
        })
        setIsSending(false)
        setIsOpen(false)
      }, 1500)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send SOS. Please try calling emergency services.",
      })
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-card rounded-3xl shadow-lg border border-primary/10">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="relative group">
            <div className="absolute inset-0 bg-destructive/20 rounded-full animate-ping group-active:animate-none" />
            <div className="relative h-32 w-32 rounded-full bg-destructive flex items-center justify-center shadow-xl shadow-destructive/40 active:scale-95 transition-transform duration-100 sos-pulse">
              <span className="text-white text-3xl font-black tracking-tighter">SOS</span>
            </div>
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Emergency SOS Confirmation
            </DialogTitle>
            <DialogDescription>
              This will instantly alert all your trusted contacts with your current location and a distress message.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <div className="p-4 bg-muted rounded-lg text-sm italic">
                {aiMessage ? `AI Composed Message: "${aiMessage}"` : "Our AI will compose a concise distress message including your current location automatically."}
             </div>
          </div>
          <DialogFooter className="flex flex-col gap-2">
            <Button 
              variant="destructive" 
              className="w-full h-12 text-lg font-bold"
              onClick={handleSOS}
              disabled={isSending}
            >
              {isSending ? <Loader2 className="animate-spin mr-2" /> : null}
              CONFIRM SOS
            </Button>
            <Button variant="outline" className="w-full h-12" onClick={() => setIsOpen(false)}>
              CANCEL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <p className="mt-6 text-muted-foreground font-medium text-center text-sm">
        Tap and hold for 3 seconds <br /> or tap once to open confirmation
      </p>
    </div>
  )
}