
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useUser } from "@/firebase"
import { initiateEmailSignIn, initiateEmailSignUp } from "@/firebase/non-blocking-login"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Loader2, Mail, Lock, UserPlus, LogIn, User, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
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
  const [regPassword, setRegPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) return
    setIsLoading(true)
    initiateEmailSignIn(auth, loginEmail, loginPassword)
  }

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !regEmail || !mobileNumber || !regPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill in all registration fields.",
      })
      return
    }

    if (regPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords Mismatch",
        description: "Password and Confirm Password must be identical.",
      })
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg">
          <Shield className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-black tracking-tighter">SETU GUARDIAN</h1>
      </div>

      <Card className="w-full max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-[#0F293A]">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-16 bg-[#0B1E2B] p-0 rounded-t-[2.5rem] overflow-hidden">
            <TabsTrigger 
              value="login" 
              className="rounded-none data-[state=active]:bg-[#0F293A] data-[state=active]:text-primary data-[state=active]:shadow-none font-black text-xs tracking-widest h-full transition-all border-r border-white/5"
            >
              LOGIN
            </TabsTrigger>
            <TabsTrigger 
              value="register" 
              className="rounded-none data-[state=active]:bg-[#0F293A] data-[state=active]:text-primary data-[state=active]:shadow-none font-black text-xs tracking-widest h-full transition-all"
            >
              REGISTER
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-0">
            <form onSubmit={handleSignIn}>
              <CardHeader className="pt-8 text-center">
                <CardTitle className="text-2xl font-black text-white">Welcome Back</CardTitle>
                <CardDescription className="text-slate-400">Enter your credentials to access your safety dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login" className="text-slate-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      id="email-login" 
                      type="email" 
                      placeholder="name@example.com" 
                      className="pl-10 h-12 rounded-xl bg-[#0B1E2B] border-none text-white placeholder:text-slate-600"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login" className="text-slate-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      id="password-login" 
                      type="password" 
                      className="pl-10 h-12 rounded-xl bg-[#0B1E2B] border-none text-white"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pb-8">
                <Button className="w-full h-14 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <LogIn className="h-5 w-5 mr-2" />}
                  SIGN IN
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-0">
            <form onSubmit={handleSignUp}>
              <CardHeader className="pt-8 text-center">
                <CardTitle className="text-2xl font-black text-white">Create Account</CardTitle>
                <CardDescription className="text-slate-400">Join the network to start your first safe journey.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname" className="text-slate-300">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      id="fullname" 
                      placeholder="John Doe" 
                      className="pl-10 h-12 rounded-xl bg-[#0B1E2B] border-none text-white placeholder:text-slate-600"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-reg" className="text-slate-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      id="email-reg" 
                      type="email" 
                      placeholder="name@example.com" 
                      className="pl-10 h-12 rounded-xl bg-[#0B1E2B] border-none text-white placeholder:text-slate-600"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-slate-300">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      id="mobile" 
                      type="tel" 
                      placeholder="+1 (555) 000-0000" 
                      className="pl-10 h-12 rounded-xl bg-[#0B1E2B] border-none text-white placeholder:text-slate-600"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-reg" className="text-slate-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      id="password-reg" 
                      type="password" 
                      className="pl-10 h-12 rounded-xl bg-[#0B1E2B] border-none text-white"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-slate-300">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      className="pl-10 h-12 rounded-xl bg-[#0B1E2B] border-none text-white"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pb-8">
                <Button className="w-full h-14 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <UserPlus className="h-5 w-5 mr-2" />}
                  CREATE ACCOUNT
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
      
      <p className="mt-8 text-sm text-slate-500 max-w-xs text-center leading-relaxed">
        By continuing, you agree to our terms of service and high-security privacy protocols.
      </p>
    </div>
  )
}
