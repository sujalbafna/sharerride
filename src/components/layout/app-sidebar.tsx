
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
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
  Info
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
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"

function RequestItem({ 
  req, 
  onAccept, 
  onDecline,
  onJoinRequest,
  onDismiss
}: { 
  req: any, 
  onAccept: (req: any, name: string) => void, 
  onDecline: (req: any) => void,
  onJoinRequest: (req: any) => void,
  onDismiss: (id: string) => void
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
      <div className="p-3 bg-secondary rounded-xl border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-bold uppercase text-primary">Travel Alert</span>
          </div>
          <Badge variant="outline" className="text-[8px] h-4 border-primary/30 text-primary">LIVE</Badge>
        </div>
        
        <div className="space-y-2">
          <p className="text-[11px] leading-tight font-black">{senderName}</p>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" />
              <span className="truncate">{req.startLocation}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
              <Navigation className="h-2.5 w-2.5" />
              <span className="truncate font-bold text-primary">{req.endLocation}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1 border-t border-border/50">
            <div className="flex items-center gap-1 text-[8px] font-bold text-muted-foreground">
              <Car className="h-2.5 w-2.5" />
              {req.vehicleName || 'Vehicle'}
            </div>
            <div className="flex items-center gap-1 text-[8px] font-bold text-muted-foreground">
              <Wind className="h-2.5 w-2.5" />
              {req.acStatus}
            </div>
            <div className="flex items-center gap-1 text-[8px] font-bold text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              {req.journeyStartTime ? format(new Date(req.journeyStartTime), "h:mm a") : 'Now'}
            </div>
          </div>
        </div>

        <Button 
          size="sm" 
          variant="outline"
          className="w-full h-8 text-[10px] font-black uppercase rounded-lg border-primary/20 text-primary bg-background hover:bg-primary/5"
          onClick={() => onJoinRequest(req)}
        >
          WANTS TO JOIN
        </Button>
      </div>
    );
  }

  if (req.requestType === "JourneyEndNotification") {
    return (
      <div className="p-3 bg-secondary rounded-xl border border-border space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3 w-3 text-accent" />
          <span className="text-[10px] font-bold uppercase text-accent">Arrival Update</span>
        </div>
        <p className="text-[11px] leading-tight font-medium">
          <span className="font-bold">{senderName}</span> {req.description}
        </p>
        <Button 
          size="sm" 
          variant="ghost"
          className="w-full h-8 text-[10px] font-black uppercase rounded-lg text-muted-foreground bg-background hover:bg-muted"
          onClick={() => onDismiss(req.id)}
        >
          <Check className="h-3 w-3 mr-1" />
          OKAY
        </Button>
      </div>
    );
  }

  if (req.requestType === "JoinJourneyRequest") {
    return (
      <div className="p-3 bg-secondary rounded-xl border border-border space-y-2">
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
            className="h-8 w-8 p-0 rounded-lg text-destructive bg-background" 
            onClick={() => onDecline(req)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-secondary rounded-xl border border-border space-y-2 animate-in slide-in-from-left-2">
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-[9px] font-black bg-background text-primary">
            {senderName[0] || "F"}
          </AvatarFallback>
        </Avatar>
        <span className="text-[11px] font-bold truncate flex-1">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : senderName}
        </span>
        <Button size="icon" variant="ghost" className="h-5 w-5 text-muted-foreground hover:text-destructive bg-background" onClick={() => onDecline(req)}>
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
    return query(
      collection(db, "users", user.uid, "supportRequests"),
      where("status", "==", "Pending")
    )
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

  const handleDismiss = async (id: string) => {
    if (!db || !user) return
    try {
      await updateDoc(doc(db, "users", user.uid, "supportRequests", id), { status: "Read" })
    } catch (e) {
      console.error("Dismiss error:", e)
    }
  }

  const handleJoinRequest = async (req: any) => {
    if (!db || !user || !req.targetJourneyId) return;
    
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
            Friend Network
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
                <Input 
                  placeholder="Find name..." 
                  className="pl-9 h-10 bg-secondary border-none rounded-xl text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-2 pt-2">
                  {searchResults.map((u) => (
                    <Dialog key={u.userId}>
                      <DialogTrigger asChild>
                        <div className="flex items-center justify-between bg-secondary p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors group">
                          <span className="text-[10px] font-bold truncate pr-2 group-hover:text-primary">{u.displayName}</span>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </DialogTrigger>
                      <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl bg-card">
                        <DialogHeader className="text-center space-y-4">
                          <Avatar className="h-20 w-20 mx-auto border-4 border-primary/10">
                            <AvatarFallback className="text-3xl font-black bg-primary/10 text-primary">
                              {u.displayName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <DialogTitle className="text-2xl font-black">{u.displayName}</DialogTitle>
                            <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest border-primary/20 text-primary px-3">
                              {u.role || "MEMBER"}
                            </Badge>
                          </div>
                          <DialogDescription className="text-sm font-medium">
                            Verify the identity details below before sending a connection request.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="p-4 bg-muted rounded-2xl space-y-1 text-left">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                              <Mail className="h-3 w-3" />
                              Email Address
                            </div>
                            <p className="text-sm font-bold">{u.email}</p>
                          </div>
                          <div className="p-4 bg-muted rounded-2xl space-y-1 text-left">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                              <Phone className="h-3 w-3" />
                              Mobile Number
                            </div>
                            <p className="text-sm font-bold">{u.phoneNumber || "Private"}</p>
                          </div>
                          <div className="p-4 bg-muted rounded-2xl space-y-1 text-left">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                              <MapPin className="h-3 w-3" />
                              Address
                            </div>
                            <p className="text-sm font-bold">{u.address || "Not provided"}</p>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button 
                            className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary shadow-xl shadow-primary/20"
                            onClick={() => sendRequest(u)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            SEND CONNECTION REQUEST
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-sidebar-foreground/70 flex items-center gap-1.5">
                  <Bell className="h-3 w-3" /> Inbox
                </span>
                {pendingRequests.length > 0 && (
                  <Badge className="h-4 px-1.5 text-[8px] bg-primary text-primary-foreground border-none">
                    {pendingRequests.length} NEW
                  </Badge>
                )}
              </div>
              
              {pendingRequests.length === 0 ? (
                <p className="text-[9px] text-center text-sidebar-foreground/50 py-2">No pending requests</p>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map((req) => (
                    <RequestItem 
                      key={req.id} 
                      req={req} 
                      onAccept={handleAccept} 
                      onDecline={handleDecline}
                      onJoinRequest={handleJoinRequest}
                      onDismiss={handleDismiss}
                    />
                  ))}
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden px-4">
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-sidebar-foreground/70 mb-4">
            Friend Circle
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1">
            {!friends || friends.length === 0 ? (
              <p className="text-[9px] text-center text-sidebar-foreground/50 py-2">No friends yet</p>
            ) : (
              friends.map((friend) => (
                <SidebarMenuButton 
                  key={friend.id} 
                  onClick={() => router.push(`/chat?with=${friend.appUserId}&name=${encodeURIComponent(friend.contactName)}`)}
                  isActive={activeChatId === friend.appUserId}
                >
                  <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-primary">
                    {friend.contactName?.[0]}
                  </div>
                  <span className="text-sm font-medium">{friend.contactName}</span>
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
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.photoURL || ""} alt={currentUserDisplayName} />
                <AvatarFallback className="rounded-lg bg-secondary text-primary">
                  {currentUserDisplayName[0]?.toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ml-2">
                <span className="truncate font-semibold">{currentUserDisplayName}</span>
                <Badge variant="outline" className="w-fit text-[8px] h-4 uppercase mt-0.5 border-primary/20 text-primary">
                  {currentUserRole}
                </Badge>
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
