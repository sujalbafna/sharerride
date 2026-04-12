
"use client"

import { useState } from "react"
import { useFirestore, useUser } from "@/firebase"
import { collection, query, where, getDocs, limit, addDoc } from "firebase/firestore"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, UserPlus, Loader2, User, Mail, MapPin, ShieldCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function SearchFriendsDialog({ children, userName }: { children: React.ReactNode, userName: string }) {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)

  const handleSearch = async () => {
    const term = searchQuery.trim().toUpperCase()
    if (!db || !term) return
    
    setIsSearching(true)
    try {
      const q = query(
        collection(db, "publicProfiles"),
        where("displayName", ">=", term),
        where("displayName", "<=", term + "\uf8ff"),
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
        senderName: userName || user.displayName || "Unknown User",
        requestType: "ConnectionRequest",
        description: "wants to join your trusted network.",
        timestamp: new Date().toISOString(),
        status: "Pending"
      })
      toast({ title: "Request Sent", description: `Connection request sent to ${targetUser.displayName}.` })
      setSearchResults(prev => prev.filter(u => u.userId !== targetUser.userId))
      if (selectedUser?.userId === targetUser.userId) {
        setSelectedUser(null)
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to send request." })
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl bg-card">
          <DialogHeader className="text-center space-y-4">
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-2">
              <Search className="h-8 w-8" />
            </div>
            <DialogTitle className="text-2xl font-black">Search Network</DialogTitle>
            <DialogDescription>Find friends and send requests to grow your safety circle.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-none text-sm font-bold uppercase" 
                  placeholder="ENTER NAME..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching} className="h-12 rounded-xl px-6 font-black uppercase tracking-widest bg-primary hover:bg-primary/90">
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "FIND"}
              </Button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {searchResults.map((u) => (
                <Card key={u.userId} className="rounded-2xl border-none shadow-sm bg-secondary/50 overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div 
                      className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                      onClick={() => setSelectedUser(u)}
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black group-hover:bg-primary group-hover:text-white transition-colors">
                        {u.displayName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate uppercase tracking-tight group-hover:text-primary transition-colors">{u.displayName}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => sendRequest(u)} className="rounded-xl font-black text-[10px] uppercase text-primary hover:bg-primary/10 transition-all active:scale-95 shrink-0">
                      <UserPlus className="h-4 w-4 mr-2" />
                      CONNECT
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {searchResults.length === 0 && searchQuery && !isSearching && (
                <div className="text-center py-8 space-y-2 opacity-50">
                  <User className="h-8 w-8 mx-auto" />
                  <p className="text-xs font-bold uppercase">No users found.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Preview Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl bg-card">
          <DialogHeader className="text-center space-y-4">
            <div className="relative mx-auto">
              <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-xl">
                <AvatarFallback className="text-3xl font-black bg-primary/10 text-primary">
                  {selectedUser?.displayName?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight">{selectedUser?.displayName}</DialogTitle>
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Verified Profile</span>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-6">
            <div className="p-4 bg-muted rounded-2xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-card flex items-center justify-center shadow-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Email Address</p>
                  <p className="text-sm font-bold truncate">{selectedUser?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-card flex items-center justify-center shadow-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Registered Area</p>
                  <p className="text-sm font-bold truncate">{selectedUser?.address || "Privacy Protected"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary shadow-xl shadow-primary/20 transition-all active:scale-95"
              onClick={() => sendRequest(selectedUser)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              SEND CONNECTION REQUEST
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
