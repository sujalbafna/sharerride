
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { 
  Home, 
  LogOut,
  User,
  Shield,
  Search,
  UserPlus,
  X,
  Loader2,
  Bell,
  MessageSquare,
  Car
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
import { collection, query, where, getDocs, limit, addDoc, doc, setDoc, updateDoc, increment, arrayUnion } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

function RequestItem({ 
  req, 
  onAccept, 
  onDecline,
  onJoinRequest
}: { 
  req: any, 
  onAccept: (req: any, name: string) => void, 
  onDecline: (req: any) => void,
  onJoinRequest: (req: any) => void
}) {
  const db = useFirestore();
  
  const profileRef = useMemoFirebase(() => {
    if (!db || !req.senderId) return null;
    return doc(db, "publicProfiles", req.senderId);
  }, [db, req.senderId]);
  
  const { data: profile, isLoading } = useDoc(profileRef);
  
  const senderName = profile?.displayName || req.senderName || "Friend";

  if (req.requestType === "JourneyNotification") {
    return (
      <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 space-y-2">
        <div className="flex items-center gap-2">
          <Car className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-bold uppercase text-primary">Travel Alert</span>
        </div>
        <p className="text-[11px] leading-tight font-medium">
          <span className="font-bold">{senderName}</span> {req.description}
        </p>
        <Button 
          size="sm" 
          variant="outline"
          className="w-full h-8 text-[10px] font-black uppercase rounded-lg border-primary/20 text-primary hover:bg-primary/5"
          onClick={() => onJoinRequest(req)}
        >
          WANTS TO JOIN
        </Button>
      </div>
    );
  }

  if (req.requestType === "JoinJourneyRequest") {
    return (
      <div className="p-3 bg-accent/5 rounded-xl border border-accent/10 space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-bold uppercase text-primary">Join Request</span>
        </div>
        <p className="text-[11px] leading-tight font-medium">
          <span className="font-bold">{senderName}</span> wants to join your journey.
        </p>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1 h-8 text-[10px] font-black uppercase rounded-lg" 
            onClick={() => onAccept(req, senderName)}
          >
            ACCEPT
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            className="h-8 w-8 p-0 rounded-lg text-destructive" 
            onClick={() => onDecline(req)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-accent/5 rounded-xl border border-accent/10 space-y-2 animate-in slide-in-from-left-2">
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-[9px] font-black bg-accent/20 text-primary">
            {senderName[0] || "F"}
          </AvatarFallback>
        </Avatar>
        <span className="text-[11px] font-bold truncate flex-1">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : senderName}
        </span>
        <Button size="icon" variant="ghost" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => onDecline(req)}>
          <X className="h-3 w-3" />
        </Button>
      </div>
      <Button 
        size="sm" 
        className="w-full h-8 text-[10px] font-black uppercase rounded-lg" 
        onClick={() => onAccept(req, senderName)}
        disabled={isLoading}
      >
        APPROVE
      </Button>
    </div>
  );
}

const items = [
  { title: "Dashboard", url: "/", icon: Home },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeChatId = searchParams.get("with")
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
    return collection(db, "users", user.uid, "supportRequests")
  }, [db, user])

  const { data: allRequests } = useCollection(requestsQuery)
  
  const pendingRequests = React.useMemo(() => {
    return allRequests?.filter(r => r.status === "Pending")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || []
  }, [allRequests])

  const friendsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "trustedContacts")
  }, [db, user])

  const { data: friends } = useCollection(friendsQuery)

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
    if (currentUserDoc?.firstName && currentUserDoc?.lastName) {
      return `${currentUserDoc.firstName} ${currentUserDoc.lastName}`
    }
    return user?.displayName || user?.email?.split('@')[0] || "User"
  }, [currentUserDoc, user])

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

  const handleAccept = async (req: any, resolvedSenderName: string) => {
    if (!db || !user) return
    try {
      if (req.requestType === "ConnectionRequest") {
        await setDoc(doc(db, "users", user.uid, "trustedContacts", req.senderId), {
          id: req.senderId,
          userId: user.uid,
          contactName: resolvedSenderName,
          contactPhoneNumber: "Private",
          isAppUser: true,
          appUserId: req.senderId,
          relationshipToUser: "Friend"
        })

        await setDoc(doc(db, "users", req.senderId, "trustedContacts", user.uid), {
          id: user.uid,
          userId: req.senderId,
          contactName: currentUserDisplayName,
          contactPhoneNumber: "Private",
          isAppUser: true,
          appUserId: user.uid,
          relationshipToUser: "Friend"
        })
      } else if (req.requestType === "JoinJourneyRequest") {
        if (!req.targetJourneyId) throw new Error("Missing targetJourneyId");
        
        const journeyRef = doc(db, "users", user.uid, "journeys", req.targetJourneyId);
        await updateDoc(journeyRef, {
          availableSeats: increment(-1),
          joinedUserIds: arrayUnion(req.senderId)
        });
        toast({ title: "Join Approved", description: `${resolvedSenderName} has joined your journey.` });
      }

      await updateDoc(doc(db, "users", user.uid, "supportRequests", req.id), { status: "Accepted" })
      
      if (req.requestType === "ConnectionRequest") {
        toast({ title: "Friendship Established", description: `You are now connected with ${resolvedSenderName}.` })
      }
    } catch (e) {
      console.error("Approval error:", e)
      toast({ variant: "destructive", title: "Error", description: "Failed to approve request." })
    }
  }

  const handleDecline = async (req: any) => {
    if (!db || !user) return
    try {
      await updateDoc(doc(db, "users", user.uid, "supportRequests", req.id), { status: "Declined" })
      toast({ title: "Request Removed", description: "The request has been declined." })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to decline request." })
    }
  }

  const handleJoinRequest = async (req: any) => {
    if (!db || !user || !req.targetJourneyId) {
      if (!req.targetJourneyId) {
        toast({ variant: "destructive", title: "Action Failed", description: "Cannot join this journey as it may have expired or is invalid." });
      }
      return;
    };
    
    try {
      await addDoc(collection(db, "users", req.senderId, "supportRequests"), {
        userId: req.senderId,
        senderId: user.uid,
        senderName: currentUserDisplayName,
        requestType: "JoinJourneyRequest",
        description: "wants to join your journey.",
        timestamp: new Date().toISOString(),
        status: "Pending",
        targetJourneyId: req.targetJourneyId
      });
      
      await updateDoc(doc(db, "users", user.uid, "supportRequests", req.id), { status: "Read" });

      toast({ title: "Request Sent", description: "Your request to join has been sent to your friend." });
    } catch (e) {
      console.error("Join request error:", e);
      toast({ variant: "destructive", title: "Error", description: "Failed to send join request." });
    }
  };

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
      
      <SidebarContent className="py-4 space-y-4">
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
            Friend Network
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-4">
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

            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                  <Bell className="h-3 w-3" /> Inbox
                </span>
                {pendingRequests.length > 0 && (
                  <Badge className="h-4 px-1.5 text-[8px] bg-primary/20 text-primary border-none">
                    {pendingRequests.length} NEW
                  </Badge>
                )}
              </div>
              
              {pendingRequests.length === 0 ? (
                <p className="text-[9px] text-center text-muted-foreground opacity-50 py-2">No pending requests</p>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map((req) => (
                    <RequestItem 
                      key={req.id} 
                      req={req} 
                      onAccept={handleAccept} 
                      onDecline={handleDecline}
                      onJoinRequest={handleJoinRequest}
                    />
                  ))}
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden px-4">
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
            Friend Circle
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1">
            {!friends || friends.length === 0 ? (
              <p className="text-[9px] text-center text-muted-foreground opacity-50 py-2">No friends yet</p>
            ) : (
              friends.map((friend) => (
                <SidebarMenuButton 
                  key={friend.id} 
                  onClick={() => router.push(`/chat?with=${friend.appUserId}&name=${encodeURIComponent(friend.contactName)}`)}
                  isActive={activeChatId === friend.appUserId}
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {friend.contactName?.[0]}
                  </div>
                  <span className="text-sm font-medium">{friend.contactName}</span>
                </SidebarMenuButton>
              ))
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-auto py-2" onClick={() => router.push("/profile")}>
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.photoURL || ""} alt={currentUserDisplayName} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                  {currentUserDisplayName[0]?.toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ml-2">
                <span className="truncate font-semibold">{currentUserDisplayName}</span>
                <span className="truncate text-xs opacity-70">Account Active</span>
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
