
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  Home, 
  LogOut,
  User,
  Shield,
  Search,
  UserPlus,
  X,
  Loader2,
  Bell
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { signOut } from "firebase/auth"
import { collection, query, where, getDocs, limit, addDoc, doc, setDoc, deleteDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

const items = [
  { title: "Dashboard", url: "/", icon: Home },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const { toast } = useToast()
  const [mounted, setMounted] = React.useState(false)

  // Search States
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<any[]>([])
  const [isSearching, setIsSearching] = React.useState(false)

  // Defer rendering until after hydration
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch current user's document to get their name reliably
  const currentUserRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: currentUserDoc } = useDoc(currentUserRef)

  // Fetch Pending Requests
  const requestsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "supportRequests"),
      where("status", "==", "Pending"),
      where("requestType", "==", "ConnectionRequest")
    )
  }, [db, user])

  const { data: requests, isLoading: loadingRequests } = useCollection(requestsQuery)

  const handleSearch = async () => {
    if (!db || !searchQuery.trim()) return
    setIsSearching(true)
    try {
      const q = query(
        collection(db, "publicProfiles"),
        where("displayName", ">=", searchQuery),
        where("displayName", "<=", searchQuery + "\uf8ff"),
        limit(3)
      )
      const snap = await getDocs(q)
      setSearchResults(snap.docs.map(d => d.data()).filter(u => u.userId !== user?.uid))
    } catch (e) {
      console.error(e)
    } finally {
      setIsSearching(false)
    }
  }

  const sendRequest = async (targetUser: any) => {
    if (!db || !user) return
    
    // Fallback chain for sender name:
    // 1. Current User's Document in Firestore (most reliable)
    // 2. Auth Display Name
    // 3. Email (prefix)
    const senderName = 
      (currentUserDoc?.firstName && currentUserDoc?.lastName ? `${currentUserDoc.firstName} ${currentUserDoc.lastName}` : null) ||
      user.displayName || 
      user.email?.split('@')[0] || 
      "Guardian"

    try {
      await addDoc(collection(db, "users", targetUser.userId, "supportRequests"), {
        userId: targetUser.userId,
        senderId: user.uid,
        senderName: senderName,
        requestType: "ConnectionRequest",
        description: "wants to join your trusted network.",
        timestamp: new Date().toISOString(),
        status: "Pending"
      })
      toast({ title: "Request Sent", description: `Connection request sent to ${targetUser.displayName}.` })
      setSearchResults([])
      setSearchQuery("")
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to send request." })
    }
  }

  const handleAccept = async (req: any) => {
    if (!db || !user) return
    try {
      await setDoc(doc(db, "users", user.uid, "trustedContacts", req.senderId), {
        id: req.senderId,
        userId: user.uid,
        contactName: req.senderName,
        contactPhoneNumber: "Private",
        isAppUser: true,
        appUserId: req.senderId,
        relationshipToUser: "Guardian"
      })
      
      const myName = (currentUserDoc?.firstName && currentUserDoc?.lastName ? `${currentUserDoc.firstName} ${currentUserDoc.lastName}` : null) || user.displayName || "Guardian"

      await setDoc(doc(db, "users", req.senderId, "trustedContacts", user.uid), {
        id: user.uid,
        userId: req.senderId,
        contactName: myName,
        contactPhoneNumber: "Private",
        isAppUser: true,
        appUserId: user.uid,
        relationshipToUser: "Guardian"
      })
      await setDoc(doc(db, "users", user.uid, "supportRequests", req.id), { ...req, status: "Accepted" })
      toast({ title: "Connection Approved", description: `You are now connected with ${req.senderName}.` })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to approve request." })
    }
  }

  const handleDecline = async (req: any) => {
    if (!db || !user) return
    try {
      await setDoc(doc(db, "users", user.uid, "supportRequests", req.id), { ...req, status: "Declined" })
      toast({ title: "Request Declined", description: "The request has been removed." })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to decline request." })
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast({ title: "Logged Out", description: "Your session has been securely closed." })
      router.push("/login")
    } catch (error) {
      toast({ variant: "destructive", title: "Logout Failed", description: "Could not close session correctly." })
    }
  }

  const isLoginPage = pathname === "/login"
  if (!mounted || isLoginPage || (!isUserLoading && !user)) return null

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center justify-center border-b">
        <div className="flex items-center gap-2 px-4 w-full">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <span className="font-black text-lg tracking-tight group-data-[collapsible=icon]:hidden uppercase">SETU</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="py-4 space-y-6">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                <Link href={item.url}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden px-4">
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
            Network Hub
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-4">
            {/* Find Guardians Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Find name..." 
                  className="pl-9 h-10 bg-muted/30 border-none rounded-xl text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-2 pt-2">
                  {searchResults.map((u) => (
                    <div key={u.userId} className="flex items-center justify-between bg-primary/5 p-2 rounded-lg">
                      <span className="text-[10px] font-bold truncate pr-2">{u.displayName}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md hover:bg-primary hover:text-white" onClick={() => sendRequest(u)}>
                        <UserPlus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inbox */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                  <Bell className="h-3 w-3" /> Inbox
                </span>
                {requests && requests.length > 0 && (
                  <Badge className="h-4 px-1.5 text-[8px] bg-primary/20 text-primary border-none">
                    {requests.length} NEW
                  </Badge>
                )}
              </div>
              
              {!requests || requests.length === 0 ? (
                <p className="text-[9px] text-center text-muted-foreground opacity-50 py-2">No pending requests</p>
              ) : (
                <div className="space-y-2">
                  {requests.map((req) => (
                    <div key={req.id} className="p-3 bg-accent/5 rounded-xl border border-accent/10 space-y-2 animate-in slide-in-from-left-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[9px] font-black bg-accent/20 text-primary">
                            {req.senderName?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] font-bold truncate flex-1">{req.senderName}</span>
                        <Button size="icon" variant="ghost" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => handleDecline(req)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button size="sm" className="w-full h-8 text-[10px] font-black uppercase rounded-lg" onClick={() => handleAccept(req)}>
                        APPROVE
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-auto py-2" onClick={() => router.push("/profile")}>
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                  {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ml-2">
                <span className="truncate font-semibold">{user?.displayName || "Member"}</span>
                <span className="truncate text-xs opacity-70">{user?.email || "Account Active"}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-2">
            <SidebarMenuButton className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">Logout Session</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
