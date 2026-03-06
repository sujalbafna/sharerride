
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, Users, Bell, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase"

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Compass, label: "Journeys", href: "/journey" },
  { icon: Users, label: "Circle", href: "/contacts" },
  { icon: Bell, label: "Alerts", href: "/alerts" },
  { icon: User, label: "Profile", href: "/profile" },
]

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useUser()

  const isLoginPage = pathname === "/login"
  if (isLoginPage || !user) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-md pb-safe md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 transition-all duration-300",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-primary"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "fill-primary/10")} />
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
