
"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  Zap, 
  IndianRupee, 
  Navigation,
  ArrowRight,
  CheckCircle2,
  Car
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/firebase"
import { PlaceHolderImages } from "@/lib/placeholder-images"

export default function LandingPage() {
  const router = useRouter()
  const { user } = useUser()

  const heroBg = PlaceHolderImages.find(img => img.id === 'auth-bg')
  const logoUrl = "https://i.postimg.cc/SxdPPWsv/cropped-circle-image-(1).png"

  const handleSearchClick = () => {
    if (user) {
      router.push("/dashboard")
    } else {
      router.push("/login?tab=register")
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-body">
      {/* Navbar */}
      <header className="h-24 flex items-center justify-between px-6 md:px-12 bg-white border-b sticky top-0 z-50">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push("/")}>
          <div className="h-16 w-16 relative shrink-0">
            <Image 
              src={logoUrl} 
              alt="ShareRide Logo" 
              fill 
              className="object-contain"
            />
          </div>
          <span className="font-black text-3xl md:text-4xl tracking-tighter text-primary uppercase">SHARERIDE</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <button className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </button>
          <button 
            className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            onClick={() => router.push(user ? "/journey" : "/login")}
          >
            <Car className="h-4 w-4" />
            Publish a ride
          </button>
          {user ? (
            <Button 
              variant="outline" 
              className="rounded-full font-black border-2 border-primary text-primary hover:bg-primary/5 px-6"
              onClick={() => router.push("/dashboard")}
            >
              DASHBOARD
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              className="rounded-full font-black text-primary hover:bg-primary/5 px-6"
              onClick={() => router.push("/login")}
            >
              LOG IN
            </Button>
          )}
        </nav>

        <div className="md:hidden">
           <Button variant="ghost" size="icon" onClick={() => router.push("/login")}>
              <Users className="h-6 w-6 text-primary" />
           </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden">
        {heroBg && (
          <div className="absolute inset-0 z-0">
            <Image 
              src={heroBg.imageUrl} 
              alt="Hero Background" 
              fill 
              className="object-cover opacity-40"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
          </div>
        )}
        
        <div className="relative z-10 w-full max-w-5xl px-6 space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-tight text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700">
              Travel anywhere <br className="hidden md:block" /> <span className="text-primary">together.</span>
            </h1>
            <p className="text-lg md:text-xl font-medium text-muted-foreground max-w-2xl mx-auto opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards delay-200">
              Your trusted safety companion for campus transit. Connecting community members for secure, shared journeys.
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-[2rem] shadow-2xl p-2 md:p-4 flex flex-col md:flex-row items-stretch md:items-center gap-2 border border-border/50 animate-in zoom-in-95 duration-1000 delay-300">
            <div className="flex-1 relative flex items-center group">
              <MapPin className="absolute left-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input className="h-14 md:h-16 pl-12 border-none rounded-2xl bg-transparent focus-visible:ring-0 text-base font-bold placeholder:text-muted-foreground/60" placeholder="Leaving from..." />
            </div>
            <div className="hidden md:block w-px h-8 bg-border" />
            <div className="flex-1 relative flex items-center group">
              <Navigation className="absolute left-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input className="h-14 md:h-16 pl-12 border-none rounded-2xl bg-transparent focus-visible:ring-0 text-base font-bold placeholder:text-muted-foreground/60" placeholder="Going to..." />
            </div>
            <div className="hidden md:block w-px h-8 bg-border" />
            <div className="flex-1 relative flex items-center group">
              <Calendar className="absolute left-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input type="date" className="h-14 md:h-16 pl-12 border-none rounded-2xl bg-transparent focus-visible:ring-0 text-base font-bold text-muted-foreground" />
            </div>
            <Button 
              className="h-14 md:h-16 px-8 rounded-2xl bg-primary text-white font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              onClick={handleSearchClick}
            >
              SEARCH
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
            <div className="relative h-10 w-10">
              <Image src={logoUrl} alt="Logo" fill className="object-contain" />
            </div>
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight">Your safety, our priority</h3>
          <p className="text-muted-foreground leading-relaxed font-medium">
            We use real-time GPS tracking and 3-way identity verification to ensure every journey is secure and transparent.
          </p>
        </div>
        <div className="space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
            <Zap className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight">Travel everywhere together</h3>
          <p className="text-muted-foreground leading-relaxed font-medium">
            Join a network of thousands of community members. Find a ride heading your way in seconds.
          </p>
        </div>
        <div className="space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <IndianRupee className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight">Prices like nowhere else</h3>
          <p className="text-muted-foreground leading-relaxed font-medium">
            Split costs fairly or find free peer-to-peer transit options. Affordable community travel for everyone.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-12 py-12">
        <div className="max-w-7xl mx-auto bg-primary rounded-[3rem] p-12 md:p-20 text-white flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="space-y-6 relative z-10 max-w-xl">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">Driving in your car soon?</h2>
            <p className="text-xl opacity-80 font-medium">
              Don't travel alone. Share your ride, split costs, and help your community travel safer.
            </p>
            <Button 
              className="h-16 px-10 rounded-full bg-white text-primary hover:bg-white/90 font-black text-lg transition-all active:scale-95 shadow-2xl"
              onClick={() => router.push(user ? "/journey" : "/login")}
            >
              OFFER A RIDE
            </Button>
          </div>
          <div className="h-64 md:h-80 w-full md:w-96 relative z-10 hidden md:block">
             <Image 
              src="https://picsum.photos/seed/shareride-car/600/400" 
              alt="Car sharing" 
              fill 
              className="object-cover rounded-[2rem] shadow-2xl"
              data-ai-hint="car sharing"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-20 px-6 md:px-12 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 relative shrink-0">
                <Image src={logoUrl} alt="Logo" fill className="object-contain" />
              </div>
              <span className="font-black text-xl tracking-tighter uppercase text-primary">SHARERIDE</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              Official safety companion portal empowering secure community transit.
            </p>
          </div>
          
          <div className="space-y-6">
            <h4 className="font-black text-xs uppercase tracking-widest text-foreground">Top carpool routes</h4>
            <ul className="space-y-3 text-sm font-bold text-muted-foreground">
              <li className="hover:text-primary cursor-pointer transition-colors">Residential to Main Library</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Complex to Metro Station</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Tech Hub to City Plaza</li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-black text-xs uppercase tracking-widest text-foreground">About</h4>
            <ul className="space-y-3 text-sm font-bold text-muted-foreground">
              <li className="hover:text-primary cursor-pointer transition-colors">How it works</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Safety Protocols</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-black text-xs uppercase tracking-widest text-foreground">Developer</h4>
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.open("https://www.linkedin.com/in/sujal-bafna/", "_blank")}>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <ArrowRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-tight">Sujal Bafna</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Project Lead & Hosting</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            © 2025 ShareRide. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
             <CheckCircle2 className="h-5 w-5 text-primary" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Cloud Architecture Verified</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
