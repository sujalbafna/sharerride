
"use client"

import { useState, useMemo } from "react"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, where, deleteDoc, doc, setDoc, getDocs, limit, updateDoc } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  UserPlus, 
  UserMinus, 
  Shield, 
  Loader2, 
  X,
  MessageSquare,
  Filter,
  ArrowLeft,
  Clock,
  Send
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ContactsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [circleFilter, setCircleFilter] = useState("")
  const [contactToDelete, setContactToDelete] = useState<{id: string, name: string} | null>(null)

  // My Verified Connections
  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "trustedContacts"),
      orderBy("contactName", "asc")
    )
  }, [db, user])

  const { data: contacts, isLoading: loadingContacts } = useCollection(contactsQuery)

  // Incoming Pending Requests (Requests sent to ME)
  const incomingRequestsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "supportRequests"),
      where("status", "==", "Pending"),
      where("requestType", "==", "ConnectionRequest")
    )
  }, [db, user])

  const { data: incomingRequests, isLoading: loadingIncoming } = useCollection(incomingRequestsQuery)

  // Outgoing Pending Requests (Requests sent by ME)
  const outgoingRequestsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "sentRequests"),
      where("status", "==", "Pending")
    )
  }, [db, user])

  const { data: outgoingRequests, isLoading: loadingOutgoing } = useCollection(outgoingRequestsQuery)

  const filteredContacts = useMemo(() => {
    if (!contacts) return []
    return contacts.filter(c => 
      c.contactName.toLowerCase().includes(circleFilter.toLowerCase())
    )
  }, [contacts, circleFilter])

  const handleSearch = async () => {
    if (!db || !searchQuery.trim()) return
    setIsSearching(true)
    try {
      const q = query(
        collection(db, "publicProfiles"),
        where("displayName", ">=", searchQuery),
        where("displayName", "<=", searchQuery + "\uf8ff"),
        limit(5)
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
    try {
      // Create a unique shared ID for tracking this request across both accounts
      const sharedRequestId = doc(collection(db, "temp")).id
      
      const requestData = {
        id: sharedRequestId,
        userId: targetUser.userId,
        senderId: user.uid,
        senderName: user.displayName || "Unknown User",
        targetName: targetUser.displayName,
        requestType: "ConnectionRequest",
        description: "wants to join your trusted network.",
        timestamp: new Date().toISOString(),
        status: "Pending"
      }

      // 1. Save to target user's incoming requests
      await setDoc(doc(db, "users", targetUser.userId, "supportRequests", sharedRequestId), requestData)
      
      // 2. Save to my outgoing requests log
      await setDoc(doc(db, "users", user.uid, "sentRequests", sharedRequestId), {
        ...requestData,
        isOutgoing: true
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
      // 1. Add to My Contacts
      await setDoc(doc(db, "users", user.uid, "trustedContacts", req.senderId), {
        id: req.senderId,
        userId: user.uid,
        contactName: req.senderName,
        contactPhoneNumber: "Private",
        isAppUser: true,
        appUserId: req.senderId,
        relationshipToUser: "Friend"
      })

      // 2. Add Me to Their Contacts (Mutual)
      await setDoc(doc(db, "users", req.senderId, "trustedContacts", user.uid), {
        id: user.uid,
        userId: req.senderId,
        contactName: user.displayName || "User",
        contactPhoneNumber: "Private",
        isAppUser: true,
        appUserId: user.uid,
        relationshipToUser: "Friend"
      })

      // 3. Mark incoming request as accepted
      await updateDoc(doc(db, "users", user.uid, "supportRequests", req.id), { status: "Accepted" })
      
      // 4. Update the sender's copy of the sent request
      try {
        await updateDoc(doc(db, "users", req.senderId, "sentRequests", req.id), { status: "Accepted" })
      } catch (err) {
        console.warn("Could not update sender's sentRequest log, but connection was made.")
      }
      
      toast({ title: "Connection Approved", description: `You are now connected with ${req.senderName}.` })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to accept request." })
    }
  }

  const handleConfirmRemove = async () => {
    if (!db || !user || !contactToDelete) return
    try {
      await deleteDoc(doc(db, "users", user.uid, "trustedContacts", contactToDelete.id))
      toast({ title: "Contact Removed", description: `${contactToDelete.name} has been removed from your circle.` })
      setContactToDelete(null)
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove contact." })
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <header className="h-20 border-b flex items-center justify-between px-6 bg-card sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold tracking-tight">My Trusted Circle</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary border-none font-black px-3 h-8">
            {contacts?.length || 0} FRIENDS
          </Badge>
        </div>
      </header>

      <main className="p-4 sm:p-8 max-w-5xl mx-auto space-y-12">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">
            <Search className="h-4 w-4" />
            Find New Friends
          </div>
          <div className="flex flex-col sm:flex-row gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                className="pl-12 h-14 bg-card rounded-[1.25rem] border-none shadow-sm focus-visible:ring-primary/20" 
                placeholder="Search by name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="h-14 rounded-2xl px-8 font-black uppercase tracking-widest bg-primary shadow-xl shadow-primary/20 transition-all active:scale-95">
              {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "SEARCH"}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="grid gap-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {searchResults.map((u) => (
                <Card key={u.userId} className="rounded-2xl border-none shadow-sm bg-secondary/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                        {u.displayName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm truncate uppercase tracking-tight">{u.displayName}</p>
                        <p className="text-[10px] text-muted-foreground truncate font-bold">{u.email}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => sendRequest(u)} className="rounded-xl font-black text-[10px] uppercase tracking-widest shrink-0 px-4 h-10 border-primary/20 text-primary hover:bg-primary/5">
                      <UserPlus className="h-4 w-4 mr-2" />
                      SEND REQUEST
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Incoming Pending Requests (Inbox) */}
        {incomingRequests && incomingRequests.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Pending Requests (Inbox)</h3>
              <Badge variant="destructive" className="font-black animate-pulse">
                {incomingRequests.length} NEW
              </Badge>
            </div>
            
            <div className="grid gap-4">
              {incomingRequests.map((req) => (
                <Card key={req.id} className="rounded-2xl border-none shadow-md bg-accent/5 border-l-4 border-accent animate-in slide-in-from-left-2 duration-500">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center text-primary font-black text-xl">
                        {req.senderName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm truncate uppercase tracking-tight">{req.senderName}</p>
                        <p className="text-xs text-muted-foreground truncate font-medium">wants to join your network</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button onClick={() => handleAccept(req)} size="sm" className="bg-primary hover:bg-primary/90 rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                        ACCEPT
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-xl h-10 w-10 p-0 text-destructive hover:bg-destructive/5">
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Outgoing Pending Requests (Sent) */}
        {outgoingRequests && outgoingRequests.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">
              <Send className="h-4 w-4" />
              Sent Requests (Awaiting Approval)
            </div>
            <div className="grid gap-4">
              {outgoingRequests.map((req) => (
                <Card key={req.id} className="rounded-2xl border-none shadow-sm bg-card border border-dashed">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-black text-xl">
                        {req.targetName?.[0] || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm truncate uppercase tracking-tight">{req.targetName}</p>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Awaiting Response</p>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="rounded-xl px-3 font-black text-[9px] uppercase tracking-widest opacity-60">
                      PENDING
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Shield className="h-4 w-4" />
              Verified Friend Circle
            </div>
            <div className="relative w-full sm:w-64 group">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Filter circle..." 
                className="pl-9 h-11 bg-card rounded-xl border-none shadow-sm text-xs font-bold focus-visible:ring-primary/20"
                value={circleFilter}
                onChange={(e) => setCircleFilter(e.target.value)}
              />
            </div>
          </div>
          
          {loadingContacts ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Accessing Secure Network...</p>
            </div>
          ) : !contacts || contacts.length === 0 ? (
            <Card className="rounded-[2.5rem] border-dashed border-2 bg-transparent">
              <CardContent className="p-16 text-center space-y-6">
                <Shield className="h-16 w-16 text-primary mx-auto opacity-20" />
                <h4 className="text-xl font-black tracking-tight">Empty Circle</h4>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto font-medium">Add friends to ensure you're never alone during your transit.</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px] rounded-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 pr-4">
                {filteredContacts.map((contact) => (
                  <Card key={contact.id} className="rounded-[1.5rem] border-none shadow-sm hover:shadow-xl transition-all group bg-card h-24 overflow-hidden animate-in zoom-in-95 duration-300">
                    <CardContent className="p-4 flex items-center justify-between h-full">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-14 w-14 rounded-2xl bg-secondary text-primary flex items-center justify-center font-black text-xl shadow-inner group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                          {contact.contactName[0]}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-sm truncate uppercase tracking-tight">{contact.contactName}</h3>
                          <Badge variant="outline" className="text-[8px] uppercase border-primary/20 text-primary font-black px-2 h-4 mt-1">VERIFIED</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-12 w-12 rounded-xl text-primary bg-secondary/50 hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm"
                          onClick={() => router.push(`/chat?with=${contact.appUserId}&name=${encodeURIComponent(contact.contactName)}`)}
                        >
                          <MessageSquare className="h-5 w-5" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-12 w-12 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95"
                          onClick={() => setContactToDelete({id: contact.id, name: contact.contactName})}
                        >
                          <UserMinus className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredContacts.length === 0 && circleFilter && (
                  <div className="col-span-full py-16 text-center text-muted-foreground text-xs font-black uppercase tracking-[0.2em] bg-card rounded-2xl border-2 border-dashed border-primary/10">
                    No matching friends in your circle.
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </section>
      </main>

      <AlertDialog open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">Remove Friend?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium">
              Are you sure you want to remove <span className="text-primary font-bold">{contactToDelete?.name}</span> from your trusted circle? They will no longer receive your journey updates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold">CANCEL</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmRemove}
              className="rounded-xl font-black bg-destructive hover:bg-destructive/90"
            >
              REMOVE FRIEND
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
