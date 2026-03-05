"use client"

import { BottomNav } from "@/components/layout/bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, Shield, Phone, MoreVertical, Star } from "lucide-react"

const contacts = [
  { id: 1, name: "Sarah Miller", relation: "Wife", phone: "+91 98765 43210", isFavorite: true, status: "Active" },
  { id: 2, name: "David Chen", relation: "Brother", phone: "+91 98765 43211", isFavorite: true, status: "Active" },
  { id: 3, name: "Emma Wilson", relation: "Friend", phone: "+91 98765 43212", isFavorite: false, status: "Offline" },
  { id: 4, name: "Mike Thompson", relation: "Colleague", phone: "+91 98765 43213", isFavorite: false, status: "Active" },
]

export default function ContactsPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="p-6 bg-white border-b sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-black text-primary tracking-tight">Trusted Network</h1>
          <Button size="icon" className="rounded-full h-10 w-10">
            <UserPlus className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10 h-11 bg-muted/30 border-none rounded-xl" placeholder="Search contacts..." />
        </div>
      </header>

      <main className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
          <Star className="h-3 w-3 fill-accent text-accent" />
          Primary Guardians
        </div>

        {contacts.filter(c => c.isFavorite).map(contact => (
          <Card key={contact.id} className="rounded-2xl border-none shadow-sm overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/5">
                  {contact.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">{contact.name}</h3>
                    <Badge variant="outline" className="text-[9px] py-0 h-4 border-accent text-accent">{contact.relation}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{contact.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-primary">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest pt-4 px-1">
          Network Members
        </div>

        {contacts.filter(c => !c.isFavorite).map(contact => (
          <Card key={contact.id} className="rounded-2xl border-none shadow-sm opacity-80">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-sm">
                  {contact.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-sm">{contact.name}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{contact.relation}</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        <div className="pt-6">
          <Card className="rounded-2xl bg-primary text-primary-foreground border-none overflow-hidden">
            <CardContent className="p-6">
              <Shield className="h-12 w-12 text-accent mb-4" />
              <h2 className="text-lg font-bold mb-2">Build a safer journey</h2>
              <p className="text-sm opacity-80 mb-4 leading-relaxed">
                Adding at least 3 trusted contacts significantly improves response times during emergencies.
              </p>
              <Button className="w-full bg-accent text-primary font-bold hover:bg-accent/90 rounded-xl">
                INVITE CONTACTS
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}