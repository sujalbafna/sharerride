"use client"

import { useState, useEffect } from "react"
import { Bell, ShieldCheck, X, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if browser supports notifications and if they haven't been asked/blocked yet
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default' && !isDismissed) {
        // Small delay to ensure landing/dashboard is settled
        const timer = setTimeout(() => setShowPrompt(true), 2000)
        return () => clearTimeout(timer)
      }
    }
  }, [isDismissed])

  const handleRequestPermission = async () => {
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setShowPrompt(false)
        toast({
          title: "Alerts Enabled",
          description: "You'll now receive background safety notifications.",
        })
        
        // Show initial success notification if service worker is ready
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready
          registration.showNotification('ShareRide Connected', {
            body: 'Background safety link is now operational.',
            icon: 'https://i.postimg.cc/SxdPPWsv/cropped-circle-image-(1).png'
          })
        }
      } else {
        setShowPrompt(false)
        setIsDismissed(true)
      }
    } catch (error) {
      console.error("Notification request failed", error)
    }
  }

  if (!showPrompt) return null

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-top-4 duration-500">
      <Card className="rounded-[2rem] border-none shadow-2xl bg-primary text-primary-foreground overflow-hidden border-2 border-white/20">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Bell className="h-6 w-6 text-white animate-bounce" />
            </div>
            <div className="flex-1 space-y-3 min-w-0">
              <div className="space-y-1">
                <h4 className="text-sm font-black uppercase tracking-tight leading-tight">Enable Mobile Alerts?</h4>
                <p className="text-[11px] opacity-90 font-medium leading-relaxed">
                  Receive SOS alerts and journey updates even when your phone screen is locked.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <Button 
                  size="sm" 
                  className="flex-1 rounded-xl bg-white text-primary hover:bg-slate-100 font-black text-[10px] uppercase tracking-widest h-9"
                  onClick={handleRequestPermission}
                >
                  ENABLE NOW
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-9 w-9 rounded-xl hover:bg-white/10 text-white shrink-0"
                  onClick={() => {
                    setShowPrompt(false)
                    setIsDismissed(true)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}