
"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth, useUser, useFirestore } from "@/firebase"
import { initiateEmailSignIn } from "@/firebase/non-blocking-login"
import { doc, setDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Mail, Lock, UserPlus, LogIn, User, Phone, MapPin, CheckCircle2, MessageSquare, ArrowLeft, ShieldCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  updateProfile, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  EmailAuthProvider,
  linkWithCredential,
  sendPasswordResetEmail
} from "firebase/auth"
import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { Badge } from "@/components/ui/badge"

function LoginContent() {
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  
  // Tab State
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login"
  const [activeTab, setActiveTab] = useState(initialTab)

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

  // OTP State
  const [otp, setOtp] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)
  const [verificationLoading, setVerificationLoading] = useState(false)
  
  // Refs for Phone Verification
  const confirmationResultRef = useRef<ConfirmationResult | null>(null)
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null)

  const authImage = PlaceHolderImages.find(img => img.id === 'auth-bg')

  useEffect(() => {
    if (user && !isUserLoading && !isRegistering && !isPhoneVerified) {
      router.push("/dashboard")
    }
  }, [user, isUserLoading, router, isRegistering, isPhoneVerified])

  const setupRecaptcha = () => {
    if (typeof window === 'undefined') return;

    try {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response: any) => {},
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
      toast({ variant: "destructive", title: "SMS Failed", description: msg })
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
        toast({ title: "Phone Verified", description: "Mobile identity confirmed. Please complete the rest of the form to register." })
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

  const handleResetPassword = async () => {
    if (!loginEmail) {
      toast({ 
        variant: "destructive", 
        title: "Email Required", 
        description: "Please enter your email address in the field above to receive a reset link." 
      })
      return
    }

    setIsLoading(true)
    try {
      await sendPasswordResetEmail(auth, loginEmail)
      toast({ 
        title: "Reset Link Sent", 
        description: "Password reset instructions have been sent to your inbox." 
      })
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Request Failed", 
        description: error.message || "Could not send reset link." 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !regEmail || !mobileNumber || !regPassword || !confirmPassword || !address) {
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
    setIsRegistering(true)
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Session lost. Please verify phone again.");

      const credential = EmailAuthProvider.credential(regEmail, regPassword);
      await linkWithCredential(currentUser, credential);

      await updateProfile(currentUser, { displayName: fullName });
      
      const userRef = doc(db, "users", currentUser.uid);
      const publicRef = doc(db, "publicProfiles", currentUser.uid);
      
      const names = fullName.trim().split(/\s+/);
      const fName = names[0] || "User";
      const lName = names.slice(1).join(' ') || "";

      const userData = {
        id: currentUser.uid,
        firstName: fName,
        lastName: lName,
        email: regEmail,
        phoneNumber: mobileNumber,
        address: address,
        role: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emergencySmsNumbers: []
      };

      const publicData = {
        userId: currentUser.uid,
        displayName: fullName,
        email: regEmail,
        photoURL: "",
        phoneNumber: mobileNumber,
        address: address,
        role: "user"
      };

      await setDoc(userRef, userData, { merge: true });
      await setDoc(publicRef, publicData, { merge: true });

      toast({ title: "Welcome!", description: "Account created successfully with ShareRide." });
      setIsRegistering(false);
      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Sign Up Failed", description: error.message });
      setIsLoading(false);
      setIsRegistering(false);
    }
  }

  if (isUserLoading && !isPhoneVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-background relative overflow-hidden pt-0 pb-12">
      <div id="recaptcha-container"></div>
      
      {authImage && (
        <div className="absolute inset-0 z-0">
          <Image 
            src={authImage.imageUrl} 
            alt="Background" 
            fill 
            className="object-cover opacity-60"
            data-ai-hint={authImage.imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 to-background/70" />
        </div>
      )}

      {/* Absolute positioned Back Button */}
      <div className="fixed top-6 left-6 z-50">
        <Button 
          className="rounded-full bg-primary text-white font-black hover:bg-primary/90 shadow-2xl shadow-primary/40 h-14 px-8 transition-all active:scale-95 flex items-center gap-2 border-2 border-white/20"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="hidden sm:inline">BACK TO HOME</span>
        </Button>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full p-4 animate-in fade-in slide-in-from-top-8 duration-700 pt-20 sm:pt-24">
        
        <div className="flex flex-col items-center mb-10">
          <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl backdrop-blur-md border border-white/20">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <div className="flex items-center gap-3 transition-transform hover:scale-105 duration-300">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-primary drop-shadow-sm">SHARERIDE</h1>
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] text-center mt-4 bg-white/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/30">
            Developed and Hosted by{" "}
            <a 
              href="https://www.linkedin.com/in/sujal-bafna/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline transition-all"
            >
              Sujal Bafna
            </a>
          </p>
        </div>

        <Card className="w-full max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-card/95 backdrop-blur-md">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                    <div className="flex justify-end pt-1">
                      <button 
                        type="button" 
                        onClick={handleResetPassword}
                        className="text-[10px] font-black text-muted-foreground hover:text-primary underline uppercase tracking-widest transition-colors"
                      >
                        Forgot Password?
                      </button>
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
                  <p className="text-[10px] font-black text-destructive uppercase tracking-widest mt-1">Fill All Details</p>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[450px] overflow-y-auto px-6 custom-scrollbar pb-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      <Input 
                        placeholder="ENTER FULL NAME" 
                        className="pl-10 h-12 rounded-xl uppercase" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value.toUpperCase())} 
                        required 
                      />
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
                    <Label htmlFor="address-reg">Address</Label>
                    <div className="relative group">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      <Input id="address-reg" placeholder="Your Address" className="pl-10 h-12 rounded-xl" value={address} onChange={(e) => setAddress(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-reg">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      <Input id="password-reg" type="password" placeholder="••••••••" className="pl-10 h-12 rounded-xl" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password-reg">Confirm Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      <Input id="confirm-password-reg" type="password" placeholder="••••••••" className="pl-10 h-12 rounded-xl" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <LoginContent />
    </Suspense>
  )
}
