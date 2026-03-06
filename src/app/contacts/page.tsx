"use client"

import { useState, useMemo } from "react"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, where, deleteDoc, doc, setDoc, addDoc, getDocs, limit } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  UserPlus, 
  Phone, 
  UserMinus, 
  Shield, 
  Loader2, 
  Check, 
  X,
  User,
  MessageSquare,
  Clock,
  Menu,
  Filter
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ContactsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [circleFilter, setCircleFilter] = useState("")

  // My Connections
  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "trustedContacts"),
      orderBy("contactName", "asc")
    )
  }, [db, user])

  const { data: contacts, isLoading: loadingContacts } = useCollection(contactsQuery)

  const filteredContacts = useMemo(() => {
    if (!contacts) return []
    return contacts.filter(c => 
      c.contactName.toLowerCase().includes(circleFilter.toLowerCase())
    )
  }, [contacts, circleFilter])

  // Pending Requests (Inbox)
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
      await addDoc(collection(db, "users", targetUser.userId, "supportRequests"), {
        userId: targetUser.userId,
        senderId: user.uid,
        senderName: user.displayName || "Unknown User",
        requestType: "ConnectionRequest",
        description: "wants to join your trusted network.",
        timestamp: new Date().toISOString(),
        status: "Pending"
      })
      toast({ title: "Request Sent", description: `Connection request sent to ${targetUser.displayName}.` })
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

      // 3. Mark request as accepted
      await setDoc(doc(db, "users", user.uid, "supportRequests", req.id), { ...req, status: "Accepted" })
      
      toast({ title: "Connection Approved", description: `You are now connected with ${req.senderName}.` })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to accept request." })
    }
  }

  const handleRemoveContact = async (contactId: string) => {
    if (!db || !user) return
    try {
      await deleteDoc(doc(db, "users", user.uid, "trustedContacts", contactId))
      toast({ title: "Contact Removed", description: "Friend removed from your circle." })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove contact." })
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <header className="h-16 border-b flex items-center justify-between px-6 bg-card sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden">
            <Menu className="h-6 w-6" />
          </SidebarTrigger>
          <h2 className="text-xl font-bold tracking-tight">Network</h2>
        </div>
      </header>

      <main className="p-4 sm:p-8 max-w-5xl mx-auto space-y-12">
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Find Friends</h3>
          <div className="flex flex-col sm:flex-row gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                className="pl-12 h-14 bg-card rounded-[1.25rem] border-none shadow-sm" 
                placeholder="Search by name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="h-14 rounded-2xl px-6 font-bold">
              {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "SEARCH"}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="grid gap-3 mt-4">
              {searchResults.map((u) => (
                <Card key={u.userId} className="rounded-2xl border-none shadow-sm bg-muted">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {u.displayName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{u.displayName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => sendRequest(u)} className="rounded-xl font-bold shrink-0">
                      <UserPlus className="h-4 w-4 mr-2" />
                      ADD
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Requests</h3>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">
              {requests?.length || 0} NEW
            </Badge>
          </div>
          
          {loadingRequests ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !requests || requests.length === 0 ? (
            <div className="p-10 text-center bg-card rounded-[2rem] border-2 border-dashed border-border text-muted-foreground text-sm font-medium">
              No pending requests.
            </div>
          ) : (
            <div className="grid gap-4">
              {requests.map((req) => (
                <Card key={req.id} className="rounded-2xl border-none shadow-sm bg-primary/5">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black">
                        {req.senderName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{req.senderName}</p>
                        <p className="text-xs text-muted-foreground truncate">wants to connect</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button onClick={() => handleAccept(req)} size="sm" className="bg-primary hover:bg-primary/90 rounded-lg h-9 px-4 font-bold text-[10px]">
                        ACCEPT
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-lg h-9 w-9 p-0 text-destructive hover:bg-destructive/5">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">My Friend Circle</h3>
            <div className="relative w-full sm:w-64">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Filter circle..." 
                className="pl-9 h-10 bg-card rounded-xl border-none shadow-sm text-xs"
                value={circleFilter}
                onChange={(e) => setCircleFilter(e.target.value)}
              />
            </div>
          </div>
          
          {loadingContacts ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !contacts || contacts.length === 0 ? (
            <Card className="rounded-[2.5rem] border-dashed border-2 bg-transparent">
              <CardContent className="p-16 text-center space-y-6">
                <Shield className="h-16 w-16 text-primary mx-auto opacity-20" />
                <h4 className="text-xl font-bold">Empty Circle</h4>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">Add friends to ensure you're never alone.</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px] rounded-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-4">
                {filteredContacts.map((contact) => (
                  <Card key={contact.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all group bg-card h-20">
                    <CardContent className="p-3 flex items-center justify-between h-full">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-muted text-primary flex items-center justify-center font-bold text-base">
                          {contact.contactName[0]}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs truncate">{contact.contactName}</h3>
                          <Badge variant="outline" className="text-[8px] uppercase border-primary/20 text-primary font-bold px-1.5 h-4">CONNECTED</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 rounded-full text-primary"
                          onClick={() => router.push(`/chat?with=${contact.appUserId}&name=${encodeURIComponent(contact.contactName)}`)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveContact(contact.id)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredContacts.length === 0 && circleFilter && (
                  <div className="col-span-full py-12 text-center text-muted-foreground text-xs font-bold uppercase tracking-widest bg-card rounded-2xl border-2 border-dashed">
                    No friends matching your search.
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </section>
      </main>
    </div>
  )
}
