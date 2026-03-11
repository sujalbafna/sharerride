
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useUser, useFirestore } from "@/firebase"
import { initiateEmailSignIn, initiateEmailSignUp } from "@/firebase/non-blocking-login"
import { doc, setDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Loader2, Mail, Lock, UserPlus, LogIn, User, Phone, GraduationCap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { onAuthStateChanged, updateProfile } from "firebase/auth"
import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function LoginPage() {
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  const [fullName, setFullName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<"student" | "faculty">("student")

  const authImage = PlaceHolderImages.find(img => img.id === 'auth-bg')

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (newUser) => {
      if (newUser && db && fullName) {
        try {
          await updateProfile(newUser, { displayName: fullName })
          const userRef = doc(db, "users", newUser.uid)
          const publicRef = doc(db, "publicProfiles", newUser.uid)
          
          const names = fullName.trim().split(/\s+/)
          const fName = names[0] || "User"
          const lName = names.slice(1).join(' ') || ""

          const userData = {
            id: newUser.uid,
            firstName: fName,
            lastName: lName,
            email: newUser.email || regEmail,
            phoneNumber: mobileNumber,
            role: role,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          const publicData = {
            userId: newUser.uid,
            displayName: fullName,
            email: newUser.email || regEmail,
            photoURL: newUser.photoURL || "",
            role: role
          }

          await setDoc(userRef, userData, { merge: true })
          await setDoc(publicRef, publicData, { merge: true })
        } catch (e) {
          console.error("Error creating profile:", e)
        }
      }
    })
    return () => unsub()
  }, [auth, db, fullName, regEmail, mobileNumber, role])

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) return
    setIsLoading(true)
    initiateEmailSignIn(auth, loginEmail, loginPassword)
  }

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !regEmail || !mobileNumber || !regPassword || !confirmPassword || !role) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in all registration fields." })
      return
    }

    if (regPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords Mismatch", description: "Password and Confirm Password must be identical." })
      return
    }

    setIsLoading(true)
    initiateEmailSignUp(auth, regEmail, regPassword)
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {authImage && (
        <div className="absolute inset-0 z-0">
          <Image 
            src={authImage.imageUrl} 
            alt="Background" 
            fill 
            className="object-cover opacity-20"
            data-ai-hint={authImage.imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background/90" />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center w-full p-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="flex items-center gap-3 transition-transform hover:scale-105 duration-300">
            <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">SETU</h1>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest animate-in fade-in slide-in-from-top-2 duration-1000 delay-500 text-center">
            Developed and Hosted by{" "}
            <a 
              href="https://www.linkedin.com/in/sujal-bafna/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline transition-all font-black"
            >
              Sujal Bafna
            </a>
          </p>
        </div>

        <Card className="w-full max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-card/95 backdrop-blur-md">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-16 bg-muted p-0 rounded-t-[2.5rem] overflow-hidden">
              <TabsTrigger value="login" className="rounded-none data-[state=active]:bg-card data-[state=active]:text-primary font-black text-xs tracking-widest h-full transition-all">
                LOGIN
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-none data-[state=active]:bg-card data-[state=active]:text-primary font-black text-xs tracking-widest h-full transition-all">
                REGISTER
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0 animate-in fade-in zoom-in-95 duration-300">
              <form onSubmit={handleSignIn}>
                <CardHeader className="pt-8 text-center">
                  <CardTitle className="text-2xl font-black">Welcome Back</CardTitle>
                  <CardDescription>Secure entry to your safety hub.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-login">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input id="email-login" type="email" placeholder="abc@gmail.com" className="pl-10 h-12 rounded-xl transition-all focus:shadow-md" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-login">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input id="password-login" type="password" className="pl-10 h-12 rounded-xl transition-all focus:shadow-md" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pb-8">
                  <Button className="w-full h-14 rounded-2xl font-black text-lg bg-primary shadow-lg shadow-primary/20 transition-all active:scale-95" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <LogIn className="h-5 w-5 mr-2" />}
                    SIGN IN
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-0 animate-in fade-in zoom-in-95 duration-300">
              <form onSubmit={handleSignUp}>
                <CardHeader className="pt-8 text-center">
                  <CardTitle className="text-2xl font-black">Join Network</CardTitle>
                  <CardDescription>Start your first safe journey today.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[400px] overflow-y-auto px-6 custom-scrollbar">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={(val: any) => setRole(val)}>
                      <SelectTrigger className="h-12 rounded-xl bg-card border">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      <Input placeholder="Sujal Bafna" className="pl-10 h-12 rounded-xl" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      <Input type="email" placeholder="abc@gmail.com" className="pl-10 h-12 rounded-xl" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number</Label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      <Input type="tel" placeholder="XXXXXXXXXX" className="pl-10 h-12 rounded-xl" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      <Input type="password" className="pl-10 h-12 rounded-xl" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      <Input type="password" className="pl-10 h-12 rounded-xl" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pb-8 pt-4">
                  <Button className="w-full h-14 rounded-2xl font-black text-lg bg-primary shadow-lg shadow-primary/20 transition-all active:scale-95" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <UserPlus className="h-5 w-5 mr-2" />}
                    CREATE ACCOUNT
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
