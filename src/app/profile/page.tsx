
"use client"

import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase, useAuth } from "@/firebase"
import { doc, collection, query, where, deleteDoc } from "firebase/firestore"
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
  Clock,
  Loader2,
  Menu,
  UserMinus
} from "lucide-react"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"

export default function ProfilePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData, isLoading: isUserDocLoading } = useDoc(userRef)

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "trustedContacts")
  }, [db, user])
  const { data: contacts, isLoading: isContactsLoading } = useCollection(contactsQuery)

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

  const handleRemoveFriend = async (contactId: string) => {
    if (!db || !user) return
    try {
      await deleteDoc(doc(db, "users", user.uid, "trustedContacts", contactId))
      toast({ title: "Friend Removed", description: "The contact has been removed from your circle." })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove friend." })
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
    : user?.displayName || "User"

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="h-16 border-b flex items-center justify-between px-6 bg-card sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden">
            <Menu className="h-6 w-6" />
          </SidebarTrigger>
          <h2 className="text-xl font-bold tracking-tight">Security Hub</h2>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={() => router.push("/settings")}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      <main className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
        <section className="flex flex-col md:flex-row items-center gap-8 bg-card p-8 rounded-[2.5rem] shadow-sm border border-border">
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
                <span className="flex items-center justify-center md:justify-start gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5" />
                  {user?.email}
                </span>
                <span className="flex items-center justify-center md:justify-start gap-1.5 truncate">
                  <Phone className="h-3.5 w-3.5" />
                  {userData?.phoneNumber || "No phone linked"}
                </span>
              </div>
            </div>
            <Button 
              className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20 w-full md:w-auto"
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
              <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg shrink-0">
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
              <div className="h-16 w-16 bg-accent rounded-2xl flex items-center justify-center text-primary shadow-lg shrink-0">
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
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Trusted Circle</h3>
            <Badge variant="outline" className="text-[10px] border-primary/20 text-primary font-bold">{contacts?.length || 0} FRIENDS</Badge>
          </div>
          
          {isContactsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !contacts || contacts.length === 0 ? (
            <div className="p-10 text-center bg-card rounded-[2rem] border-2 border-dashed border-border text-muted-foreground text-sm font-medium">
              No friends in your network yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {contacts.map((contact) => (
                <Card key={contact.id} className="rounded-2xl border-none shadow-sm bg-card hover:shadow-md transition-all h-20">
                  <CardContent className="p-3 flex items-center justify-between h-full">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-base shrink-0">
                        {contact.contactName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs tracking-tight truncate">{contact.contactName}</h3>
                        <p className="text-[9px] text-muted-foreground uppercase font-medium">Verified Connection</p>
                      </div>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
                      onClick={() => handleRemoveFriend(contact.id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Preferences</h3>
          <div className="bg-card rounded-[2rem] border border-border overflow-hidden divide-y divide-border">
            {[
              { label: "Alerts Details", icon: Bell, href: "/alerts" },
              { label: "Settings", icon: Settings, href: "/settings" },
              { label: "Help & Support", icon: HelpCircle, href: "/support" }
            ].map((item) => (
              <button 
                key={item.label}
                onClick={() => router.push(item.href)}
                className="w-full p-6 flex items-center justify-between hover:bg-muted transition-colors group"
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

        <Button 
          variant="destructive" 
          className="w-full h-16 rounded-[2rem] font-black text-lg shadow-xl shadow-destructive/20 mt-8"
          onClick={handleLogout}
        >
          <LogOut className="h-6 w-6 mr-3" />
          LOG OUT
        </Button>
      </main>
    </div>
  )
}
