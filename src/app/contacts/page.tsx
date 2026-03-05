
"use client"

import { useState } from "react"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, where, deleteDoc, doc } from "firebase/firestore"
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
  User
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ContactsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "trustedContacts"),
      orderBy("contactName", "asc")
    )
  }, [db, user])

  const { data: contacts, isLoading: loadingContacts } = useCollection(contactsQuery)

  const requestsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "supportRequests"),
      where("status", "==", "Pending"),
      where("requestType", "==", "ConnectionRequest")
    )
  }, [db, user])

  const { data: requests, isLoading: loadingRequests } = useCollection(requestsQuery)

  const handleRemoveContact = async (contactId: string) => {
    if (!db || !user) return
    try {
      await deleteDoc(doc(db, "users", user.uid, "trustedContacts", contactId))
      toast({ title: "Contact Removed", description: "Guardian removed from your trusted network." })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove contact." })
    }
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="h-16 border-b flex items-center justify-between px-8 bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <h2 className="text-xl font-bold tracking-tight">Network & Connections</h2>
        <Button className="rounded-xl font-bold">
          <UserPlus className="h-4 w-4 mr-2" />
          ADD GUARDIAN
        </Button>
      </header>

      <main className="p-8 max-w-5xl mx-auto space-y-12">
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Find Guardians</h3>
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              className="pl-12 h-14 bg-card rounded-[1.25rem] border-none shadow-sm text-lg" 
              placeholder="Search users by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Pending Requests</h3>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">
              {requests?.length || 0} NEW
            </Badge>
          </div>
          
          {loadingRequests ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !requests || requests.length === 0 ? (
            <div className="p-10 text-center bg-card rounded-[2rem] border-2 border-dashed border-border/50 text-muted-foreground text-sm font-medium">
              No pending connection requests at this time.
            </div>
          ) : (
            <div className="grid gap-4">
              {requests.map((req) => (
                <Card key={req.id} className="rounded-2xl border-none shadow-sm bg-primary/5">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Inbound Request</p>
                        <p className="text-xs text-muted-foreground">Wants to join your trusted network</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-lg h-9 w-9 p-0">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg h-9 w-9 p-0 text-destructive border-destructive/20 hover:bg-destructive/5">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">My Close Friends</h3>
          
          {loadingContacts ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Syncing network...</p>
            </div>
          ) : !contacts || contacts.length === 0 ? (
            <Card className="rounded-[2.5rem] border-dashed border-2 bg-transparent">
              <CardContent className="p-16 text-center space-y-6">
                <Shield className="h-16 w-16 text-primary mx-auto opacity-20" />
                <div className="space-y-2">
                  <h4 className="text-xl font-bold">Your Circle is Empty</h4>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Add close friends and relatives to ensure you're never alone during your travels.
                  </p>
                </div>
                <Button size="lg" className="rounded-2xl px-8 font-bold">
                  INVITE FRIENDS
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contacts
                .filter(c => c.contactName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((contact) => (
                <Card key={contact.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/5">
                        {contact.contactName.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{contact.contactName}</h3>
                          <Badge variant="outline" className="text-[10px] uppercase border-primary/20 text-primary font-bold">{contact.relationshipToUser}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{contact.contactPhoneNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-primary hover:bg-primary/10">
                        <Phone className="h-5 w-5" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-10 w-10 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveContact(contact.id)}
                      >
                        <UserMinus className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
