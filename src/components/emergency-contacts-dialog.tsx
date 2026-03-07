
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
import { Edit2, Loader2, Phone, ShieldCheck, AlertCircle } from "lucide-react"
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
      setNumbers(userData.emergencySmsNumbers)
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
        <Button variant="ghost" size="sm" className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full hover:bg-primary-foreground/20 text-primary-foreground bg-primary/20">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl bg-card">
        <DialogHeader className="space-y-4">
          <div className="h-12 w-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center">
            <Phone className="h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight">SMS Contacts</DialogTitle>
          <DialogDescription className="text-sm font-medium">
            Configure up to 3 mobile numbers. These will receive an automated SMS with your live location when the SOS button is held for 3 seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          {numbers.map((num, i) => (
            <div key={i} className="space-y-2">
              <Label htmlFor={`num-${i}`} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Emergency Contact #{i + 1}
              </Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id={`num-${i}`}
                  placeholder="+1 (555) 000-0000" 
                  className="h-12 pl-12 rounded-xl bg-secondary border-none"
                  value={num}
                  onChange={(e) => updateNumber(i, e.target.value)}
                />
              </div>
            </div>
          ))}
          
          <div className="flex items-start gap-3 p-4 bg-muted rounded-2xl border-l-4 border-primary mt-2">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] font-medium leading-relaxed italic text-muted-foreground">
              SMS protocol requires manual confirmation on your device to send. Ensure these numbers are correct and include country codes.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            className="w-full h-14 rounded-2xl font-black text-lg bg-primary shadow-xl shadow-primary/20"
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
