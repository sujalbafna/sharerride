
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
  Car,
  ShieldCheck,
  UserPlus,
  Activity,
  Bell,
  Smartphone,
  MessageSquare,
  Quote,
  Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/firebase"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const reviews = [
    {
      name: "Sneha Kulkarni",
      role: "Student, MIT ADT",
      text: "Being a student at MIT ADT, late night lab sessions are common. ShareRide's live tracking is a lifesaver for my walk back to the hostel. My parents are much more relaxed now.",
      rating: 5
    },
    {
      name: "Rohan Mehra",
      role: "Graduate Assistant",
      text: "The SOS protocol is genuinely zero-latency. Tested it with my 'Trusted Circle' and the SMS with GPS was sent in seconds. This is exactly what a campus needs.",
      rating: 5
    },
    {
      name: "Amit Sharma",
      role: "Final Year Student",
      text: "Finally an app that understands student privacy. It only tracks when I want it to. The 'Shrinking Blue Line' UI is very professional. Great work Sujal!",
      rating: 4
    },
    {
      name: "Megha Joshi",
      role: "Hostel Warden",
      text: "Safety is a major concern for girls on campus. This app makes students feel much more confident while traveling. It's a great community-driven safety initiative.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col font-body">
      {/* Navbar */}
      <header className="h-24 flex items-center justify-between px-6 md:px-12 bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push("/")}>
          <div className="h-20 w-20 relative shrink-0">
            <Image 
              src={logoUrl} 
              alt="ShareRide Logo" 
              fill 
              className="object-contain"
            />
          </div>
          <span className="font-black text-4xl md:text-5xl tracking-tighter text-primary uppercase">SHARERIDE</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => scrollToSection('how-it-works')}
            className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            How it works
          </button>
          <button 
            onClick={() => scrollToSection('safety-network')}
            className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            Safety Network
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
      <section className="relative h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden">
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
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-tight text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700">
              Your safety, <br /> 
              <span className="text-primary underline decoration-accent/30 underline-offset-8 block mt-2">
                Our commitment
              </span>
            </h1>
            <p className="text-xl md:text-2xl font-medium text-muted-foreground max-w-2xl mx-auto opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards delay-200">
              The social-safety platform that turns university transit from solo vulnerability into a secure, monitored experience.
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-3 md:p-5 flex flex-col md:flex-row items-stretch md:items-center gap-3 border border-border/50 animate-in zoom-in-95 duration-1000 delay-300">
            <div className="flex-1 relative flex items-center group">
              <MapPin className="absolute left-4 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input className="h-14 md:h-16 pl-12 border-none rounded-2xl bg-transparent focus-visible:ring-0 text-lg font-bold placeholder:text-muted-foreground/60" placeholder="Leaving from..." />
            </div>
            <div className="hidden md:block w-px h-10 bg-border" />
            <div className="flex-1 relative flex items-center group">
              <Navigation className="absolute left-4 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input className="h-14 md:h-16 pl-12 border-none rounded-2xl bg-transparent focus-visible:ring-0 text-lg font-bold placeholder:text-muted-foreground/60" placeholder="Going to..." />
            </div>
            <Button 
              className="h-14 md:h-16 px-10 rounded-2xl bg-primary text-white font-black text-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              onClick={handleSearchClick}
            >
              FIND SECURE RIDE
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-12 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">How ShareRide Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Five simple steps to ensure you and your loved ones never travel alone.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-y-12 gap-x-4 md:gap-8 relative">
            {[
              { step: "01", title: "Join Circle", desc: "Build your network of trusted friends.", icon: UserPlus },
              { step: "02", title: "Plan Journey", desc: "Enter your route and vehicle details.", icon: MapPin },
              { step: "03", title: "Broadcast", desc: "Notify your circle of your departure.", icon: Bell },
              { step: "04", title: "Track Live", desc: "Friends watch your 'blue line' shrink in real-time.", icon: Activity },
              { step: "05", title: "Arrive Safe", desc: "End your trip or use SOS if needed.", icon: CheckCircle2 },
            ].map((item, i) => (
              <div 
                key={i} 
                className={cn(
                  "relative space-y-6 group flex flex-col items-center text-center",
                  i === 4 ? "col-span-2 md:col-span-1" : "col-span-1"
                )}
              >
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-[1.5rem] md:rounded-[2rem] bg-primary flex items-center justify-center text-white group-hover:scale-110 transition-all duration-500 shadow-xl shadow-primary/20 relative z-10">
                  <item.icon className="h-10 w-10 md:h-12 md:w-12" />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-black text-primary tracking-[0.2em]">{item.step}</span>
                  <h4 className="text-lg md:text-xl font-black uppercase tracking-tight">{item.title}</h4>
                  <p className="text-muted-foreground text-xs md:text-sm font-medium leading-relaxed max-w-[180px] mx-auto">{item.desc}</p>
                </div>
                {/* Horizontal line for desktop */}
                {i < 4 && (
                  <div className="hidden md:block absolute top-12 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-px bg-border" />
                )}
                {/* Vertical line for mobile flow */}
                <div className={cn(
                  "md:hidden absolute -bottom-12 left-1/2 w-px h-8 bg-border border-dashed border-l",
                  i === 4 && "hidden"
                )} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Network Section */}
      <section id="safety-network" className="py-24 px-6 md:px-12 bg-secondary/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 order-2 lg:order-1">
            <div className="space-y-4">
              <Badge className="bg-accent/20 text-primary border-none font-black px-4 py-1">THE TRUST GRAPH</Badge>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">Your Private Safety Network</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Connect with friends and family within our verified community. You choose exactly who can see your journey, ensuring privacy during downtime and visibility during transit.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: "Trusted Circles", desc: "Only those you approve see your live movement.", icon: Users },
                { title: "Identity Verified", desc: "Every user is verified via institution credentials.", icon: ShieldCheck },
                { title: "Direct Connect", desc: "Instant secure messaging with your active companions.", icon: MessageSquare },
                { title: "3-Way SOS", desc: "Broadcast emergency alerts to your network instantly.", icon: Smartphone },
              ].map((feature, i) => (
                <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-border/50">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-black text-sm uppercase tracking-tight">{feature.title}</h5>
                    <p className="text-xs text-muted-foreground font-medium mt-1">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[500px] md:h-[600px] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white order-1 lg:order-2">
            <Image 
              src="https://i.postimg.cc/hjxxhRXV/Gemini-Generated-Image-njfpiwnjfpiwnjfp.png" 
              alt="Safety Network" 
              fill 
              className="object-cover"
              data-ai-hint="safety network"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
            <div className="absolute bottom-10 left-10 right-10 p-6 bg-white/90 backdrop-blur-md rounded-3xl shadow-xl">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-primary font-black">SB</div>
                <div>
                  <p className="font-black text-sm uppercase">Sujal Bafna</p>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Added to Circle</p>
                </div>
                <div className="ml-auto flex -space-x-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-primary/20 flex items-center justify-center text-[8px] font-black">U{i}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Journey Section */}
      <section className="py-24 px-6 md:px-12 bg-primary text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <div className="relative h-[400px] md:h-[500px] rounded-[3rem] border-4 border-white/20 overflow-hidden shadow-2xl group">
            <Image 
              src="https://i.postimg.cc/nzb8qqh2/tl.jpg" 
              alt="Live Tracking" 
              fill 
              className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
              data-ai-hint="city map"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-10">
              <div className="bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-primary animate-pulse" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Live Transit</span>
                  </div>
                  <Badge variant="outline" className="text-primary border-primary text-[8px] font-black">IN PROGRESS</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Arriving In</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">12 Minutes</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">The "Shrinking Blue Line" Experience</h2>
              <p className="text-xl opacity-80 leading-relaxed font-medium">
                Our proprietary UI recalculates your route from your current live position. As you move, your circle sees exactly how far you are from home, providing unparalleled peace of mind.
              </p>
            </div>
            
            <ul className="space-y-4">
              {[
                "Zero-latency GPS synchronization",
                "Sub-200ms location propagation",
                "Automated arrival notifications",
                "Multi-point rendezvous support"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 font-black uppercase tracking-widest text-sm">
                  <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <Button 
              className="h-16 px-10 rounded-full bg-white text-primary hover:bg-slate-50 font-black text-lg shadow-2xl transition-all active:scale-95"
              onClick={() => router.push("/login?tab=register")}
            >
              START TRACKING NOW
            </Button>
          </div>
        </div>
      </section>

      {/* Community Reviews Section */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1">COMMUNITY VOICES</Badge>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Trusted by Peers</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">See how ShareRide is making a difference in everyday transit for students and faculty.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {reviews.map((review, i) => (
              <Card key={i} className="rounded-3xl border-none shadow-sm bg-secondary/20 hover:shadow-xl transition-all duration-500 flex flex-col group">
                <CardContent className="p-8 space-y-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, starI) => (
                      <Star 
                        key={starI} 
                        className={cn(
                          "h-4 w-4", 
                          starI < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"
                        )} 
                      />
                    ))}
                  </div>
                  
                  <div className="relative flex-1">
                    <Quote className="absolute -top-4 -left-4 h-8 w-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
                    <p className="text-sm font-medium leading-relaxed italic text-foreground/80 relative z-10">
                      "{review.text}"
                    </p>
                  </div>

                  <div className="pt-6 border-t border-border/50">
                    <p className="font-black text-sm uppercase tracking-tight">{review.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{review.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-12 py-24">
        <div className="max-w-7xl mx-auto bg-slate-900 rounded-[4rem] p-12 md:p-24 text-white flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="space-y-6 relative z-10 max-w-xl text-center md:text-left">
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-tight italic">Share your ride, <br /> change your community.</h2>
            <p className="text-xl opacity-70 font-medium">
              Join thousands of community members splitting costs and traveling safer together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
              <Button 
                className="h-16 px-10 rounded-2xl bg-primary text-white hover:bg-primary/90 font-black text-lg transition-all active:scale-95 shadow-2xl"
                onClick={() => router.push(user ? "/journey" : "/login")}
              >
                PUBLISH A RIDE
              </Button>
              <Button 
                variant="outline"
                className="h-16 px-10 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10 font-black text-lg transition-all active:scale-95"
                onClick={() => scrollToSection('how-it-works')}
              >
                LEARN MORE
              </Button>
            </div>
          </div>
          <div className="h-80 md:h-[500px] w-full md:w-[450px] relative z-10 hidden md:block">
             <Image 
              src="https://i.postimg.cc/k4sm9B7W/sujal.png" 
              alt="Community Travel" 
              fill 
              className="object-cover rounded-[3rem] shadow-2xl border-4 border-white/10"
              data-ai-hint="happy people traveling"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-8 pb-16 px-6 md:px-12 border-t mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 relative shrink-0">
                <Image src={logoUrl} alt="Logo" fill className="object-contain" />
              </div>
              <span className="font-black text-3xl tracking-tighter uppercase text-primary">SHARERIDE</span>
            </div>
            <p className="text-lg font-medium text-muted-foreground leading-relaxed max-w-md">
              The official safety companion portal empowering secure community transit through real-time technology and human connection.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="font-black text-xs uppercase tracking-[0.2em] text-foreground">Platform</h4>
              <ul className="space-y-4 text-sm font-bold text-muted-foreground">
                <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => scrollToSection('how-it-works')}>How it works</li>
                <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => scrollToSection('safety-network')}>Safety Network</li>
                <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => router.push('/journey')}>Active Journeys</li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-black text-xs uppercase tracking-[0.2em] text-foreground">Company</h4>
              <ul className="space-y-4 text-sm font-bold text-muted-foreground">
                <li className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Terms of Service</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Safety Protocols</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-border flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">
            © 2025 ShareRide. Developed by Sujal Bafna.
          </p>

          <a 
            href="https://www.sdslabourcontractor.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 group"
          >
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Managed By</span>
            <div className="h-10 w-24 relative overflow-hidden">
              <Image 
                src="https://i.postimg.cc/3xbMtPny/sdslogo.png" 
                alt="SDS Logo" 
                fill 
                className="object-contain grayscale group-hover:grayscale-0 transition-all duration-300" 
              />
            </div>
            <span className="text-xs font-black text-foreground group-hover:text-primary transition-colors uppercase">SDS Sai Datta Services</span>
          </a>
        </div>
      </footer>
    </div>
  )
}
