"use client"

import { useState, useEffect } from "react"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Bell, 
  Globe, 
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

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData, isLoading: isUserDocLoading } = useDoc(userRef)

  const [dataSharing, setDataSharing] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [language, setLanguage] = useState("english")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (userData) {
      setDataSharing(userData.dataSharingEnabled ?? true)
      setPushEnabled(userData.pushNotificationsEnabled ?? true)
      setEmailEnabled(userData.emailNotificationsEnabled ?? true)
      setLanguage(userData.language ?? "english")
    }
  }, [userData])

  const handleSave = async () => {
    if (!db || !user) return

    setIsSaving(true)
    try {
      await updateDoc(doc(db, "users", user.uid), {
        dataSharingEnabled: dataSharing,
        pushNotificationsEnabled: pushEnabled,
        emailNotificationsEnabled: emailEnabled,
        language: language,
        updatedAt: new Date().toISOString()
      })

      toast({
        title: "Preferences Saved",
        description: "Your settings have been updated.",
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
          <h2 className="text-xl font-bold tracking-tight">Settings & Privacy</h2>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">
            <Lock className="h-4 w-4" />
            Privacy & Data Controls
          </div>
          <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
            <CardContent className="p-0 divide-y divide-border">
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
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">
            <Bell className="h-4 w-4" />
            Notification Preferences
          </div>
          <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
            <CardContent className="p-0 divide-y divide-border">
              <div className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-bold flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-primary" />
                    Push Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Receive real-time updates about journey progress and circle invitations.
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
                    Monthly reports and important security updates.
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
            </CardContent>
          </Card>
        </section>

        <div className="pt-4">
          <Button 
            className="w-full h-16 rounded-[2rem] font-black text-lg shadow-xl shadow-primary/20"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Save className="h-6 w-6 mr-2" />}
            APPLY ALL CHANGES
          </Button>
        </div>
      </main>
    </div>
  )
}