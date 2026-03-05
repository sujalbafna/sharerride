
"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Loader2, KeyRound, UserCheck, ShieldPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OTPVerificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OTPVerificationDialog({ open, onOpenChange }: OTPVerificationDialogProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [otpRider, setOtpRider] = useState("")
  const [otpFriend, setOtpFriend] = useState("")
  const { toast } = useToast()

  const handleVerify = async () => {
    if (otpRider.length !== 4 || otpFriend.length !== 4) return
    
    setIsVerifying(true)
    // Simulate 3-way verification logic
    setTimeout(() => {
      setIsVerifying(false)
      toast({
        title: "Protocol Validated",
        description: "Three-way verification complete. Assistant identity confirmed.",
      })
      onOpenChange(false)
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-8 border-none shadow-2xl">
        <DialogHeader className="text-center space-y-4">
          <div className="h-16 w-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
            <ShieldPlus className="h-10 w-10 text-accent" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight">
            3-Way Verification
          </DialogTitle>
          <DialogDescription className="text-sm">
            Strict security protocol for Extended Network assistance. Enter OTPs from both ends.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                <KeyRound className="h-3 w-3" />
                Your OTP (Rider)
              </Label>
              <Input 
                placeholder="0000" 
                maxLength={4} 
                className="h-14 text-center text-2xl font-black tracking-[1rem] rounded-2xl"
                value={otpRider}
                onChange={(e) => setOtpRider(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                <UserCheck className="h-3 w-3" />
                Mutual Friend's OTP
              </Label>
              <Input 
                placeholder="0000" 
                maxLength={4} 
                className="h-14 text-center text-2xl font-black tracking-[1rem] rounded-2xl"
                value={otpFriend}
                onChange={(e) => setOtpFriend(e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <p className="text-[10px] font-medium leading-relaxed opacity-70 italic text-center">
              The Assistant's device is already verified via system-level token. 
              OTP entry finalizes the trust link.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            className="w-full h-16 rounded-2xl font-black text-lg bg-primary shadow-xl"
            onClick={handleVerify}
            disabled={isVerifying || otpRider.length < 4 || otpFriend.length < 4}
          >
            {isVerifying ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <ShieldCheck className="h-6 w-6 mr-2" />}
            VALIDATE IDENTITY
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
