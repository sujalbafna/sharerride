"use client"

import { useState, useEffect } from "react"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Shield, 
  Bell, 
  Globe, 
  Moon, 
  Sun, 
  ArrowLeft, 
  Loader2, 
  Save,
  Lock,
  Eye,
  Smartphone,
  Mail
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const { theme: currentTheme, setTheme } = useTheme()

  // Fetch Current User Data
  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData, isLoading: isUserDocLoading } = useDoc(userRef)

  // Settings State
  const [dataSharing, setDataSharing] = useState(true)
  const [locationPrivacy, setLocationPrivacy] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [language, setLanguage] = useState("english")
  const [isSaving, setIsSaving] = useState(false)

  // Initialize state from Firestore
  useEffect(() => {
    if (userData) {
      setDataSharing(userData.dataSharingEnabled ?? true)
      setLocationPrivacy(userData.locationPrivacyEnabled ?? false)
      setPushEnabled(userData.pushNotificationsEnabled ?? true)
      setEmailEnabled(userData.emailNotificationsEnabled ?? true)
      setLanguage(userData.language ?? "english")
      // Theme is managed via next-themes but we sync it
      if (userData.theme) {
        setTheme(userData.theme)
      }
    }
  }, [userData, setTheme])

  const handleSave = async () => {
    if (!db || !user) return

    setIsSaving(true)
    try {
      await updateDoc(doc(db, "users", user.uid), {
        dataSharingEnabled: dataSharing,
        locationPrivacyEnabled: locationPrivacy,
        pushNotificationsEnabled: pushEnabled,
        emailNotificationsEnabled: emailEnabled,
        language: language,
        theme: currentTheme,
        updatedAt: new Date().toISOString()
      })

      toast({
        title: "Preferences Saved",
        description: "Your security and app settings have been updated.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not sync settings with the secure cloud.",
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
    <div className="min-h-screen bg-background pb-20">
      <header className="h-16 border-b flex items-center justify-between px-8 bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => router.push("/profile")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold tracking-tight">Settings & Privacy</h2>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
        {/* Privacy Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">
            <Lock className="h-4 w-4" />
            Privacy & Data Controls
          </div>
          <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
            <CardContent className="p-0 divide-y divide-border/50">
              <div className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-bold flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    Global Data Sharing
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Allow the platform to use anonymized data to improve routing algorithms.
                  </p>
                </div>
                <Switch 
                  checked={dataSharing} 
                  onCheckedChange={setDataSharing} 
                />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-bold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Strict Location Privacy
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    When enabled, live location is only shared during active SOS events.
                  </p>
                </div>
                <Switch 
                  checked={locationPrivacy} 
                  onCheckedChange={setLocationPrivacy} 
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Notification Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">
            <Bell className="h-4 w-4" />
            Alert Preferences
          </div>
          <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
            <CardContent className="p-0 divide-y divide-border/50">
              <div className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-bold flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-primary" />
                    Push Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Receive real-time updates about nearby guardians and journey progress.
                  </p>
                </div>
                <Switch 
                  checked={pushEnabled} 
                  onCheckedChange={setPushEnabled} 
                />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-bold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Email Alerts
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Monthly safety reports and important security updates.
                  </p>
                </div>
                <Switch 
                  checked={emailEnabled} 
                  onCheckedChange={setEmailEnabled} 
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* General Preferences */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">
            <Globe className="h-4 w-4" />
            General Customization
          </div>
          <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-3">
                <Label className="font-bold">Preferred Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="english">English (US)</SelectItem>
                    <SelectItem value="hindi">Hindi (India)</SelectItem>
                    <SelectItem value="spanish">Spanish (ES)</SelectItem>
                    <SelectItem value="french">French (FR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="font-bold">App Appearance</Label>
                <Select value={currentTheme} onValueChange={(val) => setTheme(val)}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select Theme" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" /> Light Mode
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" /> Dark Mode
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" /> System Default
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Action Button */}
        <div className="pt-4">
          <Button 
            className="w-full h-16 rounded-[2rem] font-black text-lg shadow-xl shadow-primary/20"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Save className="h-6 w-6 mr-2" />}
            APPLY ALL CHANGES
          </Button>
          <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4">
            Changes take effect immediately across all linked devices
          </p>
        </div>
      </main>
    </div>
  )
}
