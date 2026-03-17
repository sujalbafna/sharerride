
"use client"

import { useState, useEffect } from "react"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc } from "firebase/firestore"
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
import { Loader2, Phone, ShieldCheck, AlertCircle, Settings2, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function EmergencyContactsDialog() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [numbers, setNumbers] = useState<string[]>(["", "", ""])

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData } = useDoc(userRef)

  useEffect(() => {
    if (userData?.emergencySmsNumbers) {
      // Pad array to ensure 3 slots
      const existing = userData.emergencySmsNumbers
      const padded = [...existing, "", "", ""].slice(0, 3)
      setNumbers(padded)
    }
  }, [userData])

  const handleSave = async () => {
    if (!user || !db) return
    
    setIsSaving(true)
    try {
      const filteredNumbers = numbers.filter(n => n.trim() !== "")
      await updateDoc(doc(db, "users", user.uid), {
        emergencySmsNumbers: filteredNumbers,
        updatedAt: new Date().toISOString()
      })
      toast({ title: "Contacts Saved", description: "Your emergency SMS recipients have been updated." })
      setIsOpen(false)
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save contacts." })
    } finally {
      setIsSaving(false)
    }
  }

  const updateNumber = (index: number, val: string) => {
    const next = [...numbers]
    next[index] = val
    setNumbers(next)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 text-white transition-all shadow-2xl flex-shrink-0"
        >
          <Settings2 className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2rem] p-8 border-none shadow-2xl bg-card">
        <DialogHeader className="space-y-6">
          <div className="h-14 w-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg">
            <Phone className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-3xl font-black tracking-tighter text-foreground">SMS Contacts</DialogTitle>
            <DialogDescription className="text-sm font-medium leading-relaxed text-muted-foreground pr-4">
              Configure up to 3 mobile numbers. These will receive an automated SMS with your live location when the SOS button is triggered.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-8">
          <div className="space-y-5">
            {numbers.map((num, i) => (
              <div key={i} className="space-y-2">
                <Label htmlFor={`num-${i}`} className="text-[10px] font-black uppercase tracking-[0.15em] text-primary/70 ml-1">
                  EMERGENCY CONTACT #{i + 1}
                </Label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    id={`num-${i}`}
                    placeholder="Enter phone number..." 
                    className="h-14 pl-12 rounded-2xl bg-muted/50 border-2 border-transparent focus-visible:border-primary focus-visible:ring-0 text-sm font-bold shadow-inner"
                    value={num}
                    onChange={(e) => updateNumber(i, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-start gap-4 p-5 bg-muted/80 rounded-2xl border-l-[6px] border-primary animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-[11px] font-bold leading-relaxed italic text-muted-foreground uppercase tracking-tight">
              SMS protocol requires manual confirmation on your device to send. Ensure these numbers are correct and include country codes.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            className="w-full h-16 rounded-[1.25rem] font-black text-lg bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ShieldCheck className="h-5 w-5 mr-2" />}
            SECURE CONTACTS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
