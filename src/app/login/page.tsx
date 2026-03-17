
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useUser, useFirestore } from "@/firebase"
import { initiateEmailSignIn, initiateEmailSignUp } from "@/firebase/non-blocking-login"
import { doc, setDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Mail, Lock, UserPlus, LogIn, User, Phone, MapPin, CheckCircle2, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { onAuthStateChanged, updateProfile, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth"
import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { Badge } from "@/components/ui/badge"
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
  
  // Login State
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Register State
  const [fullName, setFullName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [address, setAddress] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<"student" | "faculty">("student")

  // OTP State
  const [otp, setOtp] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const confirmationResultRef = useRef<ConfirmationResult | null>(null)
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null)

  const authImage = PlaceHolderImages.find(img => img.id === 'auth-bg')

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  const setupRecaptcha = () => {
    try {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response: any) => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          toast({ variant: "destructive", title: "reCAPTCHA Expired", description: "Please try sending the OTP again." })
        }
      });
    } catch (e) {
      console.error("Recaptcha setup error", e);
    }
  }

  const handleSendOtp = async () => {
    if (!mobileNumber || mobileNumber.length < 10) {
      toast({ variant: "destructive", title: "Invalid Number", description: "Please enter a valid 10-digit mobile number." })
      return
    }

    setVerificationLoading(true)
    try {
      setupRecaptcha()
      const formattedNumber = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber.replace(/\D/g, '')}`
      
      const verifier = recaptchaVerifierRef.current
      if (!verifier) throw new Error("Verifier not initialized")

      const confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, verifier)
      confirmationResultRef.current = confirmationResult
      setIsOtpSent(true)
      toast({ title: "OTP Sent", description: "A 6-digit verification code has been sent to your mobile." })
    } catch (error: any) {
      console.error(error)
      let msg = error.message || "Could not send verification code."
      if (error.code === 'auth/captcha-check-failed') {
        msg = "Domain verification failed. Please ensure your domain is added to Firebase Authorized Domains."
      }
      toast({ variant: "destructive", title: "SMS Failed", description: msg })
      // Clear verifier on error to allow retry
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setVerificationLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({ variant: "destructive", title: "Invalid OTP", description: "Please enter the 6-digit code received via SMS." })
      return
    }

    setVerificationLoading(true)
    try {
      if (confirmationResultRef.current) {
        await confirmationResultRef.current.confirm(otp)
        setIsPhoneVerified(true)
        setIsOtpSent(false)
        toast({ title: "Phone Verified", description: "Mobile identity confirmed successfully." })
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: "The OTP entered is incorrect or expired." })
    } finally {
      setVerificationLoading(false)
    }
  }

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) return
    setIsLoading(true)
    initiateEmailSignIn(auth, loginEmail, loginPassword)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !regEmail || !mobileNumber || !regPassword || !confirmPassword || !role || !address) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in all registration fields." })
      return
    }

    if (!isPhoneVerified) {
      toast({ variant: "destructive", title: "Phone Not Verified", description: "Please complete mobile OTP verification first." })
      return
    }

    if (regPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords Mismatch", description: "Password and Confirm Password must be identical." })
      return
    }

    setIsLoading(true)
    try {
      initiateEmailSignUp(auth, regEmail, regPassword)
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sign Up Failed", description: error.message })
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (newUser) => {
      if (newUser && isPhoneVerified && !isLoading) {
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
          address: address,
          role: role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emergencySmsNumbers: []
        }

        const publicData = {
          userId: newUser.uid,
          displayName: fullName,
          email: newUser.email || regEmail,
          photoURL: newUser.photoURL || "",
          phoneNumber: mobileNumber,
          address: address,
          role: role
        }

        try {
          await updateProfile(newUser, { displayName: fullName })
          await setDoc(userRef, userData, { merge: true })
          await setDoc(publicRef, publicData, { merge: true })
          router.push("/")
        } catch (e) {
          console.error("Error saving profile:", e)
        }
      }
    })
    return () => unsubscribe()
  }, [auth, isPhoneVerified, db, fullName, regEmail, mobileNumber, address, role, router])

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden py-12">
      <div id="recaptcha-container"></div>
      
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
        
        <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="h-24 w-24 relative mb-2">
            <Image 
              src="https://i.postimg.cc/XvjD0vWw/cropped-circle-image.png" 
              alt="MIT University Logo" 
              fill 
              className="object-contain"
            />
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-center leading-tight">
            MIT Art, Design & Technology
          </h2>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">
            Supported By Crieya
          </p>
        </div>

        <div className="flex flex-col items-center mb-10 gap-2">
          <div className="flex items-center gap-3 transition-transform hover:scale-105 duration-300">
            <h1 className="text-2xl font-black tracking-tighter uppercase">SHARERIDE</h1>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
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
                      <Input id="password-login" type="password" placeholder="••••••••" className="pl-10 h-12 rounded-xl transition-all focus:shadow-md" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
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
                <CardContent className="space-y-4 max-h-[450px] overflow-y-auto px-6 custom-scrollbar pb-6">
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
                    <div className="flex justify-between items-center">
                      <Label>Mobile Number</Label>
                      {isPhoneVerified && (
                        <Badge variant="secondary" className="bg-accent/20 text-primary border-none text-[10px] font-black uppercase flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="relative group flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                        <Input 
                          type="tel" 
                          placeholder="XXXXXXXXXX" 
                          className="pl-10 h-12 rounded-xl" 
                          value={mobileNumber} 
                          onChange={(e) => setMobileNumber(e.target.value)} 
                          disabled={isPhoneVerified || isOtpSent}
                          required 
                        />
                      </div>
                      {!isPhoneVerified && !isOtpSent && (
                        <Button 
                          type="button" 
                          onClick={handleSendOtp} 
                          disabled={verificationLoading || !mobileNumber}
                          className="h-12 rounded-xl px-4 font-black text-[10px] bg-secondary text-primary hover:bg-muted"
                        >
                          {verificationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "SEND OTP"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isOtpSent && !isPhoneVerified && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <Label>Enter 6-Digit Code</Label>
                      <div className="flex gap-2">
                        <div className="relative group flex-1">
                          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                          <Input 
                            placeholder="_ _ _ _ _ _" 
                            className="pl-10 h-12 rounded-xl text-center font-black tracking-widest" 
                            value={otp} 
                            onChange={(e) => setOtp(e.target.value)} 
                            maxLength={6}
                          />
                        </div>
                        <Button 
                          type="button" 
                          onClick={handleVerifyOtp} 
                          disabled={verificationLoading || otp.length !== 6}
                          className="h-12 rounded-xl px-4 font-black text-[10px] bg-primary text-white"
                        >
                          {verificationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "VERIFY"}
                        </Button>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setIsOtpSent(false)} 
                        className="text-[10px] font-bold text-muted-foreground underline uppercase tracking-widest mt-1 hover:text-primary"
                      >
                        Change Number
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Address</Label>
                    <div className="relative group">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      <Input placeholder="123 College Ave, Campus" className="pl-10 h-12 rounded-xl" value={address} onChange={(e) => setAddress(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      <Input type="password" placeholder="••••••••" className="pl-10 h-12 rounded-xl" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      <Input type="password" placeholder="••••••••" className="pl-10 h-12 rounded-xl" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pb-8 pt-4">
                  <Button 
                    className="w-full h-14 rounded-2xl font-black text-lg bg-primary shadow-lg shadow-primary/20 transition-all active:scale-95" 
                    disabled={isLoading || !isPhoneVerified}
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <UserPlus className="h-5 w-5 mr-2" />}
                    {isPhoneVerified ? "CREATE ACCOUNT" : "VERIFY PHONE TO START"}
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
