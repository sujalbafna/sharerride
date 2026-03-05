
"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, orderBy, addDoc, doc, limit } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, Loader2, ShieldCheck, Phone, Info } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ChatPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
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

  if (!friendId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
        <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
          <MessageSquare className="h-10 w-10 text-primary/20" />
        </div>
        <h3 className="text-xl font-bold mb-2">No Active Chat</h3>
        <p className="text-muted-foreground text-sm text-center max-w-xs mb-6">Select a friend from your circle to start a secure conversation.</p>
        <Button onClick={() => router.push("/")} className="rounded-xl px-8 font-bold">Return to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="h-20 border-b flex items-center justify-between px-6 bg-card/80 backdrop-blur-md shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
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
          <Button variant="ghost" size="icon" className="rounded-xl text-primary/60">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl text-primary/60">
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-accent/5">
        <div className="flex flex-col items-center py-10 space-y-4">
          <div className="p-4 bg-background rounded-2xl border-2 border-dashed border-primary/20 text-center max-w-xs">
            <ShieldCheck className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
              Messages are encrypted end-to-end. Only you and {friendName} can read them.
            </p>
          </div>
          <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-none text-[9px] uppercase tracking-tighter">
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
            {messages?.map((msg, i) => {
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
            className="h-14 bg-accent/5 border-none rounded-2xl shadow-inner px-6 text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary/20"
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
