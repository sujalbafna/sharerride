"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { 
  Home, 
  LogOut,
  User,
  Search,
  UserPlus,
  X,
  Loader2,
  Bell,
  Car,
  CheckCircle2,
  Check,
  MapPin,
  Navigation,
  Clock,
  Wind,
  ShieldCheck,
  Mail,
  Phone,
  Info,
  Milestone,
  Eye,
  Activity,
  IndianRupee,
  Gift,
  Users
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
import { collection, query, where, getDocs, limit, addDoc, doc, setDoc, updateDoc, increment, arrayUnion, orderBy } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

const items = [
  { title: "Home Dashboard", url: "/", icon: Home },
  { title: "My Network", url: "/contacts", icon: Users },
  { title: "Live Journeys", url: "/journey", icon: Car },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const { toast } = useToast()
  const [mounted, setMounted] = React.useState(false)

  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<any[]>([])
  const [isSearching, setIsSearching] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const currentUserRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: currentUserDoc } = useDoc(currentUserRef)

  const requestsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "supportRequests"),
      where("status", "==", "Pending")
    )
  }, [db, user])

  const { data: allRequests } = useCollection(requestsQuery)
  
  const activeTrackingLinks = React.useMemo(() => {
    return allRequests?.filter(r => r.status === "Pending" && r.requestType === "JoinApproved") || []
  }, [allRequests])

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

  const currentUserDisplayName = React.useMemo(() => {
    if (currentUserDoc) {
      const first = currentUserDoc.firstName || ""
      const last = currentUserDoc.lastName || ""
      const full = `${first} ${last}`.trim()
      if (full) return full
    }
    return user?.displayName || user?.email?.split('@')[0] || "User"
  }, [currentUserDoc, user])

  const currentUserRole = currentUserDoc?.role || "student"

  const sendRequest = async (targetUser: any) => {
    if (!db || !user) return
    
    try {
      await addDoc(collection(db, "users", targetUser.userId, "supportRequests"), {
        userId: targetUser.userId,
        senderId: user.uid,
        senderName: currentUserDisplayName,
        requestType: "ConnectionRequest",
        description: "wants to join your trusted network.",
        timestamp: new Date().toISOString(),
        status: "Pending"
      })
      toast({ title: "Request Sent", description: `Friend request sent to ${targetUser.displayName}.` })
      setSearchResults([])
      setSearchQuery("")
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to send request." })
    }
  }

  const handleTrackFriend = (riderId: string, journeyId: string) => {
    router.push(`/journey?riderId=${riderId}&journeyId=${journeyId}`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast({ title: "Logged Out", description: "Session closed securely." })
      router.push("/login")
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to sign out." })
    }
  }

  const isLoginPage = pathname === "/login"
  if (!mounted || isLoginPage || (!isUserLoading && !user)) return null

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-20 flex flex-col items-center justify-center border-b bg-sidebar overflow-hidden">
        <div className="flex items-center gap-2 px-4 w-full">
          <span className="font-black text-lg tracking-tight group-data-[collapsible=icon]:hidden uppercase text-sidebar-foreground">SHARERIDE</span>
        </div>
        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest group-data-[collapsible=icon]:hidden mt-1 px-4 w-full truncate text-center">
          by <a href="https://www.linkedin.com/in/sujal-bafna/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline transition-all">Sujal Bafna</a>
        </p>
      </SidebarHeader>
      
      <SidebarContent className="py-4 space-y-4 bg-sidebar">
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
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-sidebar-foreground/70 mb-4">
            Security & Connections
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
                <Input 
                  placeholder="FIND FRIEND..." 
                  className="pl-9 h-10 bg-secondary border-none rounded-xl text-xs shadow-inner uppercase"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-2 pt-2">
                  {searchResults.map((u) => (
                    <div key={u.userId} className="flex items-center justify-between bg-secondary p-2 rounded-lg group animate-in slide-in-from-top-2">
                      <span className="text-[10px] font-bold truncate pr-2 group-hover:text-primary transition-colors">{u.displayName}</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 rounded-md hover:bg-primary/10 text-primary"
                        onClick={() => sendRequest(u)}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden px-4">
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-sidebar-foreground/70 mb-4">
            Live Companion Tracking
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2">
            {activeTrackingLinks.length === 0 ? (
              <p className="text-[9px] text-center text-sidebar-foreground/50 py-2 italic">No active transits</p>
            ) : (
              activeTrackingLinks.map((req) => (
                <SidebarMenuButton 
                  key={req.id}
                  className="bg-accent/5 text-accent hover:bg-accent/10 border border-accent/10 rounded-xl"
                  onClick={() => handleTrackFriend(req.riderId, req.targetJourneyId)}
                >
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-tight">Track {req.senderName}</span>
                </SidebarMenuButton>
              ))
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4 bg-sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-auto py-2" onClick={() => router.push("/profile")}>
              <Avatar className="h-8 w-8 rounded-lg border border-primary/20">
                <AvatarImage src={user?.photoURL || ""} alt={currentUserDisplayName} />
                <AvatarFallback className="rounded-lg bg-secondary text-primary font-black">
                  {currentUserDisplayName[0]?.toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ml-2">
                <span className="truncate font-black text-sidebar-foreground">{currentUserDisplayName}</span>
                <Badge variant="outline" className="w-fit text-[8px] h-4 uppercase mt-0.5 border-primary/20 text-primary font-bold">
                  {currentUserRole}
                </Badge>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-2">
            <SidebarMenuButton className="text-destructive hover:text-destructive hover:bg-destructive/10 font-bold" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden uppercase text-xs tracking-widest">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
