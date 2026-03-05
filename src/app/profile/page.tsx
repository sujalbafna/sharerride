
"use client"

import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase, useAuth } from "@/firebase"
import { doc, collection, query, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Mail, 
  Phone, 
  Users, 
  Bell, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Edit2, 
  ChevronRight,
  ShieldCheck,
  Clock,
  Loader2
} from "lucide-react"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Fetch User Document
  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData, isLoading: isUserDocLoading } = useDoc(userRef)

  // Fetch Trusted Contacts (Close Friends)
  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "trustedContacts")
  }, [db, user])
  const { data: contacts } = useCollection(contactsQuery)

  // Fetch Pending Support Requests
  const pendingRequestsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "supportRequests"),
      where("status", "==", "Pending")
    )
  }, [db, user])
  const { data: pendingRequests } = useCollection(pendingRequestsQuery)

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast({ title: "Logged Out", description: "Session closed securely." })
      router.push("/login")
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to sign out." })
    }
  }

  if (isUserLoading || isUserDocLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const displayName = userData?.firstName && userData?.lastName 
    ? `${userData.firstName} ${userData.lastName}`
    : user?.displayName || "Member"

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="h-16 border-b flex items-center justify-between px-8 bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <h2 className="text-xl font-bold tracking-tight">Security Hub</h2>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      <main className="p-8 max-w-4xl mx-auto space-y-8">
        <section className="flex flex-col md:flex-row items-center gap-8 bg-card p-8 rounded-[2.5rem] shadow-sm border border-border/50">
          <Avatar className="h-32 w-32 border-4 border-primary/10 shadow-xl">
            <AvatarImage src={userData?.profileImageUrl || ""} />
            <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary uppercase">
              {displayName[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight">{displayName}</h1>
              <div className="flex flex-col md:flex-row gap-4 text-sm text-muted-foreground font-medium">
                <span className="flex items-center justify-center md:justify-start gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user?.email}
                </span>
                <span className="flex items-center justify-center md:justify-start gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {userData?.phoneNumber || "No phone linked"}
                </span>
              </div>
            </div>
            <Button 
              className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20"
              onClick={() => router.push("/profile/edit")}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              EDIT PROFILE
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-[2rem] border-none shadow-sm bg-primary/5">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-black text-primary">{contacts?.length || 0}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Close Friends</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-sm bg-accent/10">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="h-16 w-16 bg-accent rounded-2xl flex items-center justify-center text-primary shadow-lg">
                <Clock className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-black text-primary">{pendingRequests?.length || 0}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pending Requests</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Preferences & Safety</h3>
          <div className="bg-card rounded-[2rem] border border-border/50 overflow-hidden divide-y divide-border/50">
            {[
              { label: "Alerts Details", icon: Bell, href: "/alerts" },
              { label: "Settings", icon: Settings, href: "/settings" },
              { label: "Help & Support", icon: HelpCircle, href: "/support" }
            ].map((item) => (
              <button 
                key={item.label}
                onClick={() => router.push(item.href)}
                className="w-full p-6 flex items-center justify-between hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-center gap-3 p-6 bg-accent/5 rounded-[2rem] border-2 border-dashed border-accent/20">
          <ShieldCheck className="h-6 w-6 text-accent" />
          <p className="text-xs font-bold text-primary uppercase tracking-widest">End-to-End Encryption Active</p>
        </div>

        <Button 
          variant="destructive" 
          className="w-full h-16 rounded-[2rem] font-black text-lg shadow-xl shadow-destructive/20"
          onClick={handleLogout}
        >
          <LogOut className="h-6 w-6 mr-3" />
          LOG OUT
        </Button>
      </main>
    </div>
  )
}
