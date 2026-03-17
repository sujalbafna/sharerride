"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, orderBy, addDoc, doc, limit } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Loader2, ShieldCheck, Phone, Info, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function ChatContent() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const friendId = searchParams.get("with")
  
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch Friend Profile
  const friendProfileRef = useMemoFirebase(() => {
    if (!db || !friendId) return null
    return doc(db, "publicProfiles", friendId)
  }, [db, friendId])
  const { data: friendProfile } = useDoc(friendProfileRef)
  
  // Fetch Friend Contact Info (for phone number)
  const contactRef = useMemoFirebase(() => {
    if (!db || !user || !friendId) return null
    return doc(db, "users", user.uid, "trustedContacts", friendId)
  }, [db, user, friendId])
  const { data: contactData } = useDoc(contactRef)
  
  const friendName = friendProfile?.displayName || "Friend"

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !user || !friendId) return null
    return query(
      collection(db, "users", user.uid, "chats", friendId, "messages"),
      orderBy("timestamp", "asc"),
      limit(50)
    )
  }, [db, user, friendId])

  const { data: messages, isLoading } = useCollection(messagesQuery)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !user || !friendId || !message.trim()) return

    setIsSending(true)
    const content = message.trim()
    const timestamp = new Date().toISOString()
    
    try {
      // 1. Send to my copy
      addDoc(collection(db, "users", user.uid, "chats", friendId, "messages"), {
        senderId: user.uid,
        content: content,
        timestamp: timestamp
      })

      // 2. Send to friend's copy (bidirectional)
      addDoc(collection(db, "users", friendId, "chats", user.uid, "messages"), {
        senderId: user.uid,
        content: content,
        timestamp: timestamp
      })

      setMessage("")
    } catch (e) {
      console.error(e)
    } finally {
      setIsSending(false)
    }
  }

  const handleCall = () => {
    if (contactData?.contactPhoneNumber && contactData.contactPhoneNumber !== "Private") {
      window.location.href = `tel:${contactData.contactPhoneNumber}`
    } else {
      toast({
        title: "Calling Unavailable",
        description: "This contact's phone number is set to private or not available.",
        variant: "destructive"
      })
    }
  }

  if (!friendId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <MessageSquare className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2">No Active Chat</h3>
        <p className="text-muted-foreground text-sm text-center max-w-xs mb-6">Select a friend from your circle to start a secure conversation.</p>
        <Button onClick={() => router.push("/")} className="rounded-xl px-8 font-bold">Return to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="h-20 border-b flex items-center justify-between px-6 bg-card shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarFallback className="bg-primary/10 text-primary font-black">
                {friendName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-base font-black tracking-tight">{friendName}</h2>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                <p className="text-[10px] text-accent font-black uppercase tracking-widest">Secure Link Active</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl text-primary"
            onClick={handleCall}
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl text-primary">
                <Info className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem] p-8 border-none shadow-2xl bg-card">
              <DialogHeader className="text-center space-y-4">
                <Avatar className="h-20 w-20 mx-auto border-4 border-primary/10">
                  <AvatarFallback className="text-3xl font-black bg-primary/10 text-primary">
                    {friendName[0]}
                  </AvatarFallback>
                </Avatar>
                <DialogTitle className="text-2xl font-black">{friendName}</DialogTitle>
                <DialogDescription className="text-sm font-medium">
                  Verified safety connection since {contactData?.id ? "initial network setup" : "recently"}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 bg-muted rounded-2xl space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Email Address</p>
                  <p className="text-sm font-bold">{friendProfile?.email || "Not shared"}</p>
                </div>
                <div className="p-4 bg-muted rounded-2xl space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Phone Number</p>
                  <p className="text-sm font-bold">{contactData?.contactPhoneNumber || "Private"}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted">
        <div className="flex flex-col items-center py-10 space-y-4">
          <div className="p-4 bg-card rounded-2xl border-2 border-dashed border-primary/20 text-center max-w-xs">
            <ShieldCheck className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
              Messages are encrypted end-to-end. Only you and {friendName} can read them.
            </p>
          </div>
          <Badge variant="secondary" className="bg-card text-muted-foreground border-none text-[9px] uppercase tracking-tighter">
            Conversation Started
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages?.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No messages yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages?.map((msg) => {
              const isMe = msg.senderId === user?.uid
              return (
                <div key={msg.id} className={cn("flex flex-col animate-in fade-in slide-in-from-bottom-2", isMe ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[80%] p-4 rounded-[1.5rem] shadow-sm text-sm font-medium leading-relaxed",
                    isMe 
                      ? "bg-primary text-white rounded-tr-none shadow-primary/20" 
                      : "bg-card text-foreground rounded-tl-none border shadow-none"
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mt-1.5 px-1">
                    {format(new Date(msg.timestamp), "h:mm a")}
                  </span>
                </div>
              )
            })}
          </div>
        )}
        <div ref={scrollRef} />
      </main>

      <footer className="p-6 border-t bg-card shrink-0 shadow-2xl">
        <form onSubmit={sendMessage} className="flex gap-3 max-w-5xl mx-auto">
          <Input 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message ${friendName}...`} 
            className="h-14 bg-muted border-none rounded-2xl shadow-inner px-6 text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary/20"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-14 w-14 rounded-2xl shrink-0 bg-primary shadow-xl shadow-primary/30 transition-all active:scale-95" 
            disabled={isSending || !message.trim()}
          >
            {isSending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
          </Button>
        </form>
      </footer>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ChatContent />
    </Suspense>
  )
}
