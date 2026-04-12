
"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { 
  Home, 
  LogOut,
  User,
  Search,
  UserPlus,
  Car,
  Activity,
  Users,
  Check,
  Clock
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
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { signOut } from "firebase/auth"
import { collection, query, where, getDocs, limit, addDoc, doc, setDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

const items = [
  { title: "Home Dashboard", url: "/dashboard", icon: Home },
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
  const logoUrl = "https://i.postimg.cc/SxdPPWsv/cropped-circle-image-(1).png"

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

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "trustedContacts")
  }, [db, user])
  const { data: contacts } = useCollection(contactsQuery)

  const requestsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "supportRequests"),
      where("status", "==", "Pending")
    )
  }, [db, user])
  const { data: allRequests } = useCollection(requestsQuery)

  const sentRequestsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "sentRequests"),
      where("status", "==", "Pending")
    )
  }, [db, user])
  const { data: sentRequests } = useCollection(sentRequestsQuery)
  
  const activeTrackingLinks = React.useMemo(() => {
    return allRequests?.filter(r => r.status === "Pending" && r.requestType === "JoinApproved") || []
  }, [allRequests])

  const handleSearch = async () => {
    const term = searchQuery.trim().toUpperCase()
    if (!db || !term) return
    
    setIsSearching(true)
    try {
      // Fetch all profiles for "contains" (partial) matching
      const snap = await getDocs(collection(db, "publicProfiles"))
      const allProfiles = snap.docs.map(d => d.data())
      
      const filtered = allProfiles.filter(profile => {
        if (profile.userId === user?.uid) return false
        return profile.displayName?.toUpperCase().includes(term)
      })
      
      setSearchResults(filtered.slice(0, 3)) // Show only top 3 in sidebar
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

  const sendRequest = async (targetUser: any) => {
    if (!db || !user) return
    
    try {
      const sharedRequestId = doc(collection(db, "temp")).id
      const requestData = {
        id: sharedRequestId,
        userId: targetUser.userId,
        senderId: user.uid,
        senderName: currentUserDisplayName,
        targetName: targetUser.displayName,
        requestType: "ConnectionRequest",
        description: "wants to join your trusted network.",
        timestamp: new Date().toISOString(),
        status: "Pending"
      }

      await addDoc(collection(db, "users", targetUser.userId, "supportRequests"), requestData)
      await setDoc(doc(db, "users", user.uid, "sentRequests", sharedRequestId), {
        ...requestData,
        isOutgoing: true
      })

      toast({ title: "Request Sent", description: `Friend request sent to ${targetUser.displayName}.` })
      setSearchResults(prev => prev.map(u => u.userId === targetUser.userId ? { ...u, _isSent: true } : u))
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
  const isLandingPage = pathname === "/"
  if (!mounted || isLoginPage || isLandingPage || (!isUserLoading && !user)) return null

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-20 flex flex-col items-center justify-center border-b bg-sidebar overflow-hidden">
        <div className="flex items-center gap-3 px-4 w-full cursor-pointer" onClick={() => router.push("/")}>
          <div className="h-10 w-10 relative shrink-0">
            <Image src={logoUrl} alt="Logo" fill className="object-contain" />
          </div>
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
                  className="pl-9 h-10 bg-secondary border-none rounded-xl text-xs shadow-inner uppercase font-bold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-2 pt-2">
                  {searchResults.map((u) => {
                    const isFriend = contacts?.some(c => (c.appUserId || c.id) === u.userId)
                    const isIncoming = allRequests?.some(r => r.senderId === u.userId && r.requestType === "ConnectionRequest")
                    const isOutgoing = sentRequests?.some(r => r.userId === u.userId) || u._isSent

                    return (
                      <div key={u.userId} className="flex items-center justify-between bg-secondary p-2 rounded-lg group animate-in slide-in-from-top-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold truncate block group-hover:text-primary transition-colors">{u.displayName}</span>
                          {isFriend && <span className="text-[7px] font-black text-primary uppercase">Friend</span>}
                        </div>
                        {isFriend ? (
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        ) : isIncoming ? (
                          <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md bg-accent/20 text-primary" onClick={() => router.push('/notifications')}>
                            <Clock className="h-3 w-3" />
                          </Button>
                        ) : isOutgoing ? (
                          <Clock className="h-3.5 w-3.5 text-muted-foreground opacity-50 shrink-0" />
                        ) : (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 rounded-md hover:bg-primary/10 text-primary"
                            onClick={() => sendRequest(u)}
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    )
                  })}
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
                <AvatarImage src={user?.photoURL || undefined} alt={currentUserDisplayName} />
                <AvatarFallback className="rounded-lg bg-secondary text-primary font-black">
                  {currentUserDisplayName[0]?.toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ml-2">
                <span className="truncate font-black text-sidebar-foreground">{currentUserDisplayName}</span>
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
