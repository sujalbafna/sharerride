"use client"

import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, Phone, MoreVertical, Star, Shield, Loader2 } from "lucide-react"

export default function ContactsPage() {
  const { user } = useUser()
  const db = useFirestore()

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "trustedContacts"),
      orderBy("contactName", "asc")
    )
  }, [db, user])

  const { data: contacts, isLoading } = useCollection(contactsQuery)

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b flex items-center justify-between px-8 bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <h2 className="text-xl font-bold tracking-tight">Trusted Network</h2>
        <Button className="rounded-xl font-bold">
          <UserPlus className="h-4 w-4 mr-2" />
          ADD CONTACT
        </Button>
      </header>

      <main className="p-8 max-w-5xl mx-auto space-y-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10 h-11 bg-card rounded-xl border-none shadow-sm" placeholder="Search your network..." />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Fetching your guardians...</p>
          </div>
        ) : !contacts || contacts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-12">
            <div className="space-y-6">
              <Shield className="h-16 w-16 text-primary" />
              <h1 className="text-4xl font-black leading-tight">Your safety network is currently empty.</h1>
              <p className="text-muted-foreground text-lg">
                Adding trusted contacts allows them to track your journey and receive SOS alerts instantly. 
                Start by inviting a family member or friend.
              </p>
              <Button size="lg" className="rounded-2xl h-14 px-8 text-lg font-bold">
                INVITE FIRST CONTACT
              </Button>
            </div>
            <div className="hidden md:block">
              <img 
                src="https://picsum.photos/seed/trust/600/400" 
                alt="Trust Network" 
                className="rounded-3xl shadow-2xl"
                data-ai-hint="people community"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {contacts.map((contact) => (
                 <Card key={contact.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all">
                   <CardContent className="p-4 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/5">
                         {contact.contactName.split(' ').map((n: string) => n[0]).join('')}
                       </div>
                       <div>
                         <div className="flex items-center gap-2">
                           <h3 className="font-bold">{contact.contactName}</h3>
                           <Badge variant="outline" className="text-[10px] uppercase">{contact.relationshipToUser}</Badge>
                         </div>
                         <p className="text-sm text-muted-foreground">{contact.contactPhoneNumber}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-1">
                       <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-primary">
                         <Phone className="h-5 w-5" />
                       </Button>
                       <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full">
                         <MoreVertical className="h-5 w-5" />
                       </Button>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
          </div>
        )}
      </main>
    </div>
  )
}
