
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, Users, User, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser, useCollection, useMemoFirebase, useFirestore } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"

const navItems = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: Compass, label: "Journeys", href: "/journey" },
  { icon: Bell, label: "Notifications", href: "/notifications", isNotification: true },
  { icon: Users, label: "Circle", href: "/contacts" },
  { icon: User, label: "Profile", href: "/profile" },
]

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useUser()
  const db = useFirestore()

  const pendingRequestsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "supportRequests"),
      where("status", "==", "Pending")
    )
  }, [db, user])

  const { data: pendingRequests } = useCollection(pendingRequestsQuery)

  const isLoginPage = pathname === "/login"
  const isLandingPage = pathname === "/"
  if (isLoginPage || isLandingPage || !user) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-safe md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const hasBadge = item.isNotification && pendingRequests && pendingRequests.length > 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 transition-all duration-300 relative flex-1 min-w-0",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-primary"
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-5 w-5", isActive && "fill-primary/10")} />
                {hasBadge && (
                  <Badge className="absolute -top-2 -right-2 h-4 min-w-4 flex items-center justify-center p-0 text-[8px] bg-primary text-white border-2 border-background animate-bounce">
                    {pendingRequests.length}
                  </Badge>
                )}
              </div>
              <span className="text-[8px] font-black uppercase tracking-tighter truncate w-full text-center">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
