
"use client"

import { useState, useEffect, useRef } from "react"
import { useFirestore, useUser, useDoc, useMemoFirebase, useStorage } from "@/firebase"
import { doc, updateDoc, setDoc } from "firebase/firestore"
import { updateEmail, updatePassword, updateProfile } from "firebase/auth"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Save, 
  ArrowLeft, 
  Loader2, 
  ShieldCheck,
  MapPin,
  Camera,
  X
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function EditProfilePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const storage = useStorage()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData, isLoading: isUserDocLoading } = useDoc(userRef)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (userData) {
      setFirstName(userData.firstName || "")
      setLastName(userData.lastName || "")
      setEmail(userData.email || "")
      setPhone(userData.phoneNumber || "")
      setAddress(userData.address || "")
    }
  }, [userData])

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !storage || !user || !db) return

    if (!file.type.startsWith('image/')) {
      toast({ variant: "destructive", title: "Invalid File", description: "Please select an image file." })
      return
    }

    setIsUploading(true)
    try {
      const storageRef = ref(storage, `profilePhotos/${user.uid}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      await updateDoc(doc(db, "users", user.uid), {
        profileImageUrl: downloadURL,
        updatedAt: new Date().toISOString()
      })

      await setDoc(doc(db, "publicProfiles", user.uid), {
        photoURL: downloadURL
      }, { merge: true })

      await updateProfile(user, { photoURL: downloadURL })

      toast({ title: "Photo Updated", description: "Your profile picture has been changed." })
    } catch (error: any) {
      console.error(error)
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not save photo to storage." })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!db || !user) return

    setIsUploading(true)
    try {
      await updateDoc(doc(db, "users", user.uid), {
        profileImageUrl: "",
        updatedAt: new Date().toISOString()
      })

      await setDoc(doc(db, "publicProfiles", user.uid), {
        photoURL: ""
      }, { merge: true })

      await updateProfile(user, { photoURL: "" })

      toast({ title: "Photo Removed", description: "Your profile picture has been removed." })
    } catch (error: any) {
      console.error(error)
      toast({ variant: "destructive", title: "Error", description: "Could not remove photo." })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !user) return

    if (newPassword && newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "New password and confirmation must match.",
      })
      return
    }

    setIsSaving(true)
    try {
      const updateData: any = {
        firstName,
        lastName,
        email,
        phoneNumber: phone,
        address: address,
        updatedAt: new Date().toISOString()
      }
      
      await updateDoc(doc(db, "users", user.uid), updateData)

      await setDoc(doc(db, "publicProfiles", user.uid), {
        displayName: `${firstName} ${lastName}`,
        email: email,
        phoneNumber: phone,
        address: address,
      }, { merge: true })

      if (email !== user.email) {
        try {
          await updateEmail(user, email)
        } catch (authError: any) {
          console.error("Failed to update email in auth:", authError)
        }
      }

      if (newPassword) {
        try {
          await updatePassword(user, newPassword)
        } catch (authError: any) {
          console.error("Failed to update password in auth:", authError)
          toast({
            variant: "destructive",
            title: "Security Update Required",
            description: "Please log out and back in to change your password for security reasons.",
          })
        }
      }

      toast({
        title: "Profile Updated",
        description: "Your personal information has been securely saved.",
      })
      router.push("/profile")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not save changes to the database.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isUserLoading || isUserDocLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="h-16 border-b flex items-center justify-between px-8 bg-card sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => router.push("/profile")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold tracking-tight">Edit Profile</h2>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
        <form onSubmit={handleSave}>
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
            <CardHeader className="pt-10 text-center space-y-2">
              <div className="relative mx-auto mb-4 group cursor-pointer" onClick={handlePhotoClick}>
                <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-lg overflow-hidden transition-all group-hover:opacity-90">
                  <AvatarImage src={userData?.profileImageUrl || user?.photoURL || ""} className="object-cover" />
                  <AvatarFallback className="text-3xl font-black bg-primary/10 text-primary uppercase">
                    {(firstName[0] || user?.displayName?.[0] || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center z-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
              </div>

              <div className="flex flex-wrap justify-center gap-2 pb-4">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  className="h-9 rounded-xl font-black text-[10px] uppercase tracking-widest border-primary/20 text-primary"
                  onClick={handlePhotoClick}
                  disabled={isUploading}
                >
                  <Camera className="h-3.5 w-3.5 mr-1.5" />
                  Add Profile Photo
                </Button>
                {(userData?.profileImageUrl || user?.photoURL) && (
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm" 
                    className="h-9 rounded-xl font-black text-[10px] uppercase tracking-widest text-destructive hover:bg-destructive/5"
                    onClick={handleRemovePhoto}
                    disabled={isUploading}
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Remove Profile Photo
                  </Button>
                )}
              </div>

              <CardTitle className="text-2xl font-black">Personal Information</CardTitle>
              <CardDescription>Update your contact details for your trusted network.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="firstName" 
                      placeholder="First Name" 
                      className="pl-10 h-12 rounded-xl"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="lastName" 
                      placeholder="Last Name" 
                      className="pl-10 h-12 rounded-xl"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="abc@gmail.com" 
                    className="pl-10 h-12 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="XXXXXXXXXX" 
                    className="pl-10 h-12 rounded-xl"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="address" 
                    placeholder="123 College Ave, Campus" 
                    className="pl-10 h-12 rounded-xl"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Security Update</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password (Leave blank to keep current)</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="newPassword" 
                        type="password" 
                        className="pl-10 h-12 rounded-xl"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        className="pl-10 h-12 rounded-xl"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-8 bg-muted">
              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
                disabled={isSaving || isUploading}
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                SAVE CHANGES
              </Button>
            </CardFooter>
          </Card>
        </form>

        <div className="flex items-center justify-center gap-3 p-6 bg-accent rounded-[2.5rem] border-2 border-dashed border-accent/20">
          <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          <p className="text-[10px] font-bold text-primary-foreground uppercase tracking-widest text-center">
            Your data is protected by industry-standard encryption protocols
          </p>
        </div>
      </main>
    </div>
  )
}
