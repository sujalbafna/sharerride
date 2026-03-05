
"use client"

import { useState, useEffect } from "react"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { updateEmail, updatePassword } from "firebase/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Save, 
  ArrowLeft, 
  Loader2, 
  ShieldCheck 
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function EditProfilePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  // Fetch Current User Data
  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData, isLoading: isUserDocLoading } = useDoc(userRef)

  // Form State
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (userData) {
      setFirstName(userData.firstName || "")
      setLastName(userData.lastName || "")
      setEmail(userData.email || "")
      setPhone(userData.phoneNumber || "")
    }
  }, [userData])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !user) return

    if (newPassword && newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "New password and confirmation must match.",
      })
      return
    }

    setIsSaving(true)
    try {
      // 1. Update Firestore Profile
      const updateData: any = {
        firstName,
        lastName,
        email,
        phoneNumber: phone,
        updatedAt: new Date().toISOString()
      }
      
      await updateDoc(doc(db, "users", user.uid), updateData)

      // 2. Optional: Update Auth Credentials (requires recent login)
      if (email !== user.email) {
        try {
          await updateEmail(user, email)
        } catch (authError: any) {
          console.error("Failed to update email in auth:", authError)
          // Often fails without recent login, but we still updated the DB record
        }
      }

      if (newPassword) {
        try {
          await updatePassword(user, newPassword)
        } catch (authError: any) {
          console.error("Failed to update password in auth:", authError)
          toast({
            variant: "destructive",
            title: "Security Update Required",
            description: "Please log out and back in to change your password for security reasons.",
          })
        }
      }

      toast({
        title: "Profile Updated",
        description: "Your personal information has been securely saved.",
      })
      router.push("/profile")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not save changes to the database.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isUserLoading || isUserDocLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="h-16 border-b flex items-center justify-between px-8 bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => router.push("/profile")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold tracking-tight">Edit Profile</h2>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
        <form onSubmit={handleSave}>
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
            <CardHeader className="pt-10 text-center space-y-2">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-2">
                <User className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-black">Personal Information</CardTitle>
              <CardDescription>Update your contact details for your trusted network.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="firstName" 
                      placeholder="First Name" 
                      className="pl-10 h-12 rounded-xl"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="lastName" 
                      placeholder="Last Name" 
                      className="pl-10 h-12 rounded-xl"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    className="pl-10 h-12 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+1 (555) 000-0000" 
                    className="pl-10 h-12 rounded-xl"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Security Update</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password (Leave blank to keep current)</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="newPassword" 
                        type="password" 
                        className="pl-10 h-12 rounded-xl"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        className="pl-10 h-12 rounded-xl"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-8 bg-muted/30">
              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                SAVE CHANGES
              </Button>
            </CardFooter>
          </Card>
        </form>

        <div className="flex items-center justify-center gap-3 p-6 bg-accent/5 rounded-[2.5rem] border-2 border-dashed border-accent/20">
          <ShieldCheck className="h-6 w-6 text-accent" />
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest text-center">
            Your data is protected by industry-standard encryption protocols
          </p>
        </div>
      </main>
    </div>
  )
}
