"use client"

import { useState, useMemo, useRef } from "react"
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase, useAuth, useStorage } from "@/firebase"
import { doc, collection, query, where, deleteDoc, updateDoc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  User, 
  Mail, 
  Phone, 
  Users, 
  Bell, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Edit2, 
  ChevronRight,
  Clock,
  Loader2,
  UserMinus,
  Search,
  X,
  GraduationCap,
  MapPin,
  Camera
} from "lucide-react"
import { signOut, updateProfile } from "firebase/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ProfilePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  const storage = useStorage()
  const router = useRouter()
  const { toast } = useToast()
  const [friendSearch, setFriendSearch] = useState("")
  const [contactToDelete, setContactToDelete] = useState<{id: string, name: string} | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData, isLoading: isUserDocLoading } = useDoc(userRef)

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "trustedContacts")
  }, [db, user])
  const { data: contacts, isLoading: isContactsLoading } = useCollection(contactsQuery)

  const pendingRequestsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "supportRequests"),
      where("status", "==", "Pending")
    )
  }, [db, user])
  const { data: pendingRequests } = useCollection(pendingRequestsQuery)

  const filteredContacts = useMemo(() => {
    if (!contacts) return []
    return contacts.filter(c => 
      c.contactName?.toLowerCase().includes(friendSearch.toLowerCase())
    )
  }, [contacts, friendSearch])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast({ title: "Logged Out", description: "Session closed securely." })
      router.push("/login")
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to sign out." })
    }
  }

  const handleConfirmRemove = async () => {
    if (!db || !user || !contactToDelete) return
    try {
      await deleteDoc(doc(db, "users", user.uid, "trustedContacts", contactToDelete.id))
      toast({ title: "Friend Removed", description: `${contactToDelete.name} has been removed from your circle.` })
      setContactToDelete(null)
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove friend." })
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !storage || !user || !db) return

    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast({ variant: "destructive", title: "Invalid File", description: "Please select an image file." })
      return
    }

    setIsUploading(true)
    try {
      const storageRef = ref(storage, `profilePhotos/${user.uid}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      // Update Firestore Private User Doc
      await updateDoc(doc(db, "users", user.uid), {
        profileImageUrl: downloadURL,
        updatedAt: new Date().toISOString()
      })

      // Update Firestore Public Profile
      await setDoc(doc(db, "publicProfiles", user.uid), {
        photoURL: downloadURL
      }, { merge: true })

      // Update Firebase Auth Profile
      await updateProfile(user, { photoURL: downloadURL })

      toast({ title: "Profile Updated", description: "Your new profile photo has been saved." })
    } catch (error: any) {
      console.error(error)
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload photo to secure storage." })
    } finally {
      setIsUploading(false)
    }
  }

  if (isUserLoading || isUserDocLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const displayName = userData?.firstName && userData?.lastName 
    ? `${userData.firstName} ${userData.lastName}`
    : user?.displayName || "User"

  const userRole = userData?.role || "student"

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="h-16 border-b flex items-center justify-between px-6 bg-card sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h2 className="text-xl font-bold tracking-tight">Security Hub</h2>
        </div>
      </header>

      <main className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
        <section className="flex flex-col md:flex-row items-center gap-8 bg-card p-8 rounded-[2.5rem] shadow-sm border border-border">
          <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
            <Avatar className="h-32 w-32 border-4 border-primary/10 shadow-xl overflow-hidden transition-all group-hover:opacity-90">
              <AvatarImage src={userData?.profileImageUrl || user?.photoURL || ""} className="object-cover" />
              <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary uppercase">
                {displayName[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-8 w-8 text-white" />
            </div>

            {isUploading && (
              <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />

            <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full uppercase text-[10px] font-black tracking-widest shadow-lg">
              {userRole}
            </Badge>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight">{displayName}</h1>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground font-medium">
                <span className="flex items-center justify-center md:justify-start gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5" />
                  {user?.email}
                </span>
                <span className="flex items-center justify-center md:justify-start gap-1.5 truncate">
                  <Phone className="h-3.5 w-3.5" />
                  {userData?.phoneNumber || "No phone linked"}
                </span>
                <span className="flex items-center justify-center md:justify-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-left leading-tight">{userData?.address || "No address provided"}</span>
                </span>
              </div>
            </div>
            <Button 
              className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20 w-full md:w-auto"
              onClick={() => router.push("/profile/edit")}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              EDIT PROFILE
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-[2rem] border-none shadow-sm bg-primary/5">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg shrink-0">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-black text-primary">{contacts?.length || 0}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Close Friends</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-sm bg-accent/10">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="h-16 w-16 bg-accent rounded-2xl flex items-center justify-center text-primary shadow-lg shrink-0">
                <Clock className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-black text-primary">{pendingRequests?.length || 0}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pending Requests</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="remove-friends" className="border-none">
              <AccordionTrigger className="hover:no-underline p-0">
                <div className="flex items-center justify-between w-full px-2 py-4 bg-muted/50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center">
                      <UserMinus className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest">Remove Friend</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-primary/20 text-primary font-bold mr-4">
                    {contacts?.length || 0} TOTAL
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-6 px-2 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search friend by name..." 
                    className="pl-10 h-12 bg-secondary border-none rounded-xl text-sm font-bold"
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                  />
                  {friendSearch && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                      onClick={() => setFriendSearch("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {isContactsLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="p-8 text-center bg-card rounded-2xl border-2 border-dashed border-border text-muted-foreground text-sm font-medium">
                    {friendSearch ? "No friends found matching your search." : "No friends in your network yet."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredContacts.map((contact) => (
                      <Card key={contact.id} className="rounded-2xl border-none shadow-sm bg-card hover:shadow-md transition-all h-20">
                        <CardContent className="p-3 flex items-center justify-between h-full">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-base shrink-0">
                              {contact.contactName?.[0]}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-xs tracking-tight truncate">{contact.contactName}</h3>
                              <p className="text-[9px] text-muted-foreground uppercase font-medium">Verified Connection</p>
                            </div>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
                            onClick={() => setContactToDelete({id: contact.id, name: contact.contactName})}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Preferences</h3>
          <div className="bg-card rounded-[2rem] border border-border overflow-hidden divide-y divide-border">
            {[
              { label: "Help & Support", icon: HelpCircle, href: "/support" }
            ].map((item) => (
              <button 
                key={item.label}
                onClick={() => router.push(item.href)}
                className="w-full p-6 flex items-center justify-between hover:bg-muted transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </section>

        <Button 
          variant="destructive" 
          className="w-full h-16 rounded-[2rem] font-black text-lg shadow-xl shadow-destructive/20 mt-8"
          onClick={handleLogout}
        >
          <LogOut className="h-6 w-6 mr-3" />
          LOG OUT
        </Button>
      </main>

      <AlertDialog open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">Remove Friend?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium">
              Are you sure you want to remove <span className="text-primary font-bold">{contactToDelete?.name}</span> from your trusted circle? They will no longer receive your journey updates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold">CANCEL</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmRemove}
              className="rounded-xl font-black bg-destructive hover:bg-destructive/90"
            >
              REMOVE FRIEND
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
