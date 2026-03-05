
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
import { Shield, Loader2, Mail, Lock, UserPlus, LogIn } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setIsLoading(true)
    initiateEmailSignIn(auth, email, password)
    // Non-blocking call. Redirect happens via useEffect on auth state change.
  }

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setIsLoading(true)
    initiateEmailSignUp(auth, email, password)
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

      <Card className="w-full max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 bg-primary/10 p-1 rounded-none">
            <TabsTrigger 
              value="login" 
              className="rounded-none data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-none font-black text-xs tracking-widest"
            >
              LOGIN
            </TabsTrigger>
            <TabsTrigger 
              value="register" 
              className="rounded-none data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-none font-black text-xs tracking-widest"
            >
              REGISTER
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-0">
            <form onSubmit={handleSignIn}>
              <CardHeader className="pt-8 text-center">
                <CardTitle className="text-2xl font-black">Welcome Back</CardTitle>
                <CardDescription>Enter your credentials to access your safety dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email-login" 
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
                  <Label htmlFor="password-login">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password-login" 
                      type="password" 
                      className="pl-10 h-12 rounded-xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pb-8">
                <Button className="w-full h-14 rounded-2xl font-black text-lg" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <LogIn className="h-5 w-5 mr-2" />}
                  SIGN IN
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-0">
            <form onSubmit={handleSignUp}>
              <CardHeader className="pt-8 text-center">
                <CardTitle className="text-2xl font-black">Create Account</CardTitle>
                <CardDescription>Join the network to start your first safe journey.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-reg">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email-reg" 
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
                  <Label htmlFor="password-reg">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password-reg" 
                      type="password" 
                      className="pl-10 h-12 rounded-xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pb-8">
                <Button className="w-full h-14 rounded-2xl font-black text-lg" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <UserPlus className="h-5 w-5 mr-2" />}
                  CREATE ACCOUNT
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
      
      <p className="mt-8 text-sm text-muted-foreground max-w-xs text-center leading-relaxed">
        By continuing, you agree to our terms of service and high-security privacy protocols.
      </p>
    </div>
  )
}
