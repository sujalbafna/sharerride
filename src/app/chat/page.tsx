
"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, addDoc, doc, limit } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, User, Loader2, ShieldCheck } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function ChatPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const friendId = searchParams.get("with")
  const friendName = searchParams.get("name") || "Guardian"
  
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !user || !friendId) return null
    // We store chat logs under the current user's path for simplicity in this prototype
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
      await addDoc(collection(db, "users", user.uid, "chats", friendId, "messages"), {
        senderId: user.uid,
        content: content,
        timestamp: timestamp
      })

      // 2. Send to friend's copy (bidirectional mockup)
      await addDoc(collection(db, "users", friendId, "chats", user.uid, "messages"), {
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
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground font-bold uppercase tracking-widest">No chat selected</p>
        <Button onClick={() => router.push("/contacts")} variant="link">Return to Network</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="h-16 border-b flex items-center justify-between px-6 bg-card/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/contacts")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              {friendName[0]}
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight">{friendName}</h2>
              <p className="text-[10px] text-accent font-bold uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Secure Link
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages?.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Start a secure conversation</p>
          </div>
        ) : (
          messages?.map((msg, i) => {
            const isMe = msg.senderId === user?.uid
            return (
              <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                <div className={cn(
                  "max-w-[75%] p-4 rounded-[1.5rem] shadow-sm text-sm font-medium",
                  isMe ? "bg-primary text-white rounded-tr-none" : "bg-card text-foreground rounded-tl-none"
                )}>
                  {msg.content}
                </div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mt-1 px-1">
                  {format(new Date(msg.timestamp), "h:mm a")}
                </span>
              </div>
            )
          })
        )}
        <div ref={scrollRef} />
      </main>

      <footer className="p-4 border-t bg-card shrink-0">
        <form onSubmit={sendMessage} className="flex gap-2 max-w-4xl mx-auto">
          <Input 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your secure message..." 
            className="h-14 bg-background border-none rounded-2xl shadow-inner px-6"
          />
          <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl shrink-0 bg-primary shadow-xl" disabled={isSending || !message.trim()}>
            {isSending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
          </Button>
        </form>
      </footer>
    </div>
  )
}
