"use client"

import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, doc, updateDoc, addDoc, increment, arrayUnion, orderBy, setDoc } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  ArrowLeft, 
  Loader2, 
  UserPlus, 
  Car, 
  Navigation, 
  MapPin, 
  Check, 
  X, 
  ShieldCheck,
  CheckCircle2,
  Activity,
  Milestone,
  Wind
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

function NotificationItem({ req, onAccept, onDecline, onTrack, onDismiss, onJoinRequest }: any) {
  const isConnection = req.requestType === "ConnectionRequest"
  const isJourney = req.requestType === "JourneyNotification"
  const isEnd = req.requestType === "JourneyEndNotification"
  const isJoinReq = req.requestType === "JoinJourneyRequest"
  const isJoinApproved = req.requestType === "JoinApproved"

  return (
    <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-card animate-in slide-in-from-bottom-2">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnection && <UserPlus className="h-4 w-4 text-primary" />}
            {isJourney && <Car className="h-4 w-4 text-accent" />}
            {isEnd && <CheckCircle2 className="h-4 w-4 text-accent" />}
            {isJoinReq && <Activity className="h-4 w-4 text-primary" />}
            {isJoinApproved && <ShieldCheck className="h-4 w-4 text-primary" />}
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {req.requestType?.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          </div>
          <p className="text-[9px] font-bold text-muted-foreground uppercase">
            {req.timestamp ? format(new Date(req.timestamp), "MMM d, h:mm a") : "Just now"}
          </p>
        </div>

        <div className="flex gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-lg font-black text-primary uppercase">{req.senderName?.[0] || "?"}</span>
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <p className="text-sm font-medium leading-relaxed">
              <span className="font-black text-primary">{req.senderName}</span> {req.description}
            </p>

            {isJourney && (
              <div className="p-3 bg-muted rounded-xl space-y-2 border border-border/50">
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                  <p className="text-xs font-bold truncate">{req.startLocation}</p>
                </div>
                {req.routeVia && (
                  <div className="flex items-start gap-2">
                    <Milestone className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <p className="text-xs font-medium italic truncate">via {req.routeVia}</p>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Navigation className="h-3.5 w-3.5 text-primary mt-0.5" />
                  <p className="text-xs font-black text-primary truncate">{req.endLocation}</p>
                </div>
                <div className="flex gap-3 pt-1 border-t border-border/30">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                    <Wind className="h-3 w-3" /> {req.acStatus}
                  </div>
                  {req.paymentType === "Paid" ? (
                    <Badge className="bg-primary text-white text-[8px] h-4">₹{req.feeAmount}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[8px] h-4 border-accent/30 text-accent">FREE</Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          {(isConnection || isJoinReq) && (
            <>
              <Button 
                className="flex-1 h-10 rounded-xl text-xs font-black uppercase bg-primary shadow-lg shadow-primary/20"
                onClick={() => onAccept(req, req.senderName)}
              >
                Approve
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 h-10 rounded-xl text-xs font-black uppercase"
                onClick={() => onDecline(req)}
              >
                Decline
              </Button>
            </>
          )}
          {isJourney && (
            <>
              <Button 
                className="flex-1 h-10 rounded-xl text-xs font-black uppercase bg-primary shadow-lg shadow-primary/20"
                onClick={() => onJoinRequest(req)}
              >
                Request to Join
              </Button>
              <Button 
                variant="ghost" 
                className="flex-1 h-10 rounded-xl text-xs font-black uppercase"
                onClick={() => onDismiss(req.id)}
              >
                Dismiss
              </Button>
            </>
          )}
          {isJoinApproved && (
            <Button 
              className="w-full h-10 rounded-xl text-xs font-black uppercase bg-accent text-primary shadow-lg shadow-accent/20"
              onClick={() => onTrack(req.riderId, req.targetJourneyId)}
            >
              Track Live Now
            </Button>
          )}
          {(isEnd || isJoinApproved) && !isJoinApproved && (
            <Button 
              variant="ghost" 
              className="w-full h-10 rounded-xl text-xs font-black uppercase bg-muted/50"
              onClick={() => onDismiss(req.id)}
            >
              Okay
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function NotificationsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const requestsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    // Temporarily removing orderBy to prevent index failures while the app is being used
    return query(
      collection(db, "users", user.uid, "supportRequests"),
      where("status", "==", "Pending")
    )
  }, [db, user])

  const { data: requests, isLoading } = useCollection(requestsQuery)

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: userData } = useDoc(userRef)

  const userName = userData ? `${userData.firstName} ${userData.lastName}` : (user?.displayName || "User")

  const handleAccept = async (req: any, resolvedSenderName: string) => {
    if (!db || !user) return
    try {
      if (req.requestType === "ConnectionRequest") {
        await setDoc(doc(db, "users", user.uid, "trustedContacts", req.senderId), {
          id: req.senderId,
          userId: user.uid,
          contactName: resolvedSenderName,
          contactPhoneNumber: "Private",
          isAppUser: true,
          appUserId: req.senderId,
          relationshipToUser: "Friend"
        })

        await setDoc(doc(db, "users", req.senderId, "trustedContacts", user.uid), {
          id: user.uid,
          userId: req.senderId,
          contactName: userName,
          contactPhoneNumber: "Private",
          isAppUser: true,
          appUserId: user.uid,
          relationshipToUser: "Friend"
        })
      } else if (req.requestType === "JoinJourneyRequest") {
        const journeyRef = doc(db, "users", user.uid, "journeys", req.targetJourneyId);
        await updateDoc(journeyRef, {
          availableSeats: increment(-1),
          joinedUserIds: arrayUnion(req.senderId)
        });

        await addDoc(collection(db, "users", req.senderId, "supportRequests"), {
          userId: req.senderId,
          senderId: user.uid,
          senderName: userName,
          requestType: "JoinApproved",
          description: "approved your request to join the journey.",
          timestamp: new Date().toISOString(),
          status: "Pending",
          targetJourneyId: req.targetJourneyId,
          riderId: user.uid
        });

        toast({ title: "Companion Approved", description: `${resolvedSenderName} has joined your transit.` });
      }

      await updateDoc(doc(db, "users", user.uid, "supportRequests", req.id), { status: "Accepted" })
      if (req.requestType === "ConnectionRequest") {
        toast({ title: "Network Updated", description: `You are now connected with ${resolvedSenderName}.` })
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to approve request." })
    }
  }

  const handleDecline = async (req: any) => {
    if (!db || !user) return
    try {
      await updateDoc(doc(db, "users", user.uid, "supportRequests", req.id), { status: "Declined" })
      toast({ title: "Request Removed", description: "The request has been declined." })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to decline request." })
    }
  }

  const handleDismiss = async (id: string) => {
    if (!db || !user) return
    try {
      await updateDoc(doc(db, "users", user.uid, "supportRequests", id), { status: "Read" })
    } catch (e) {
      console.error(e)
    }
  }

  const handleJoinRequest = async (req: any) => {
    if (!db || !user || !req.targetJourneyId) return;
    try {
      await addDoc(collection(db, "users", req.senderId, "supportRequests"), {
        userId: req.senderId,
        senderId: user.uid,
        senderName: userName,
        requestType: "JoinJourneyRequest",
        description: "wants to join your journey.",
        timestamp: new Date().toISOString(),
        status: "Pending",
        targetJourneyId: req.targetJourneyId
      });
      await updateDoc(doc(db, "users", user.uid, "supportRequests", req.id), { status: "Read" });
      toast({ title: "Join Request Sent", description: "Request sent to the rider for verification." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to send request." });
    }
  };

  const handleTrackFriend = (riderId: string, journeyId: string) => {
    router.push(`/journey?riderId=${riderId}&journeyId=${journeyId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="h-20 border-b flex items-center justify-between px-6 bg-card sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold tracking-tight">Notifications</h2>
        </div>
        {requests && requests.length > 0 && (
          <Badge variant="secondary" className="rounded-lg bg-primary/10 text-primary border-none font-black px-3 h-8">
            {requests.length} NEW
          </Badge>
        )}
      </header>

      <main className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Checking alerts...</p>
          </div>
        ) : !requests || requests.length === 0 ? (
          <Card className="rounded-[2.5rem] border-dashed border-2 bg-transparent">
            <CardContent className="p-16 text-center space-y-6">
              <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto opacity-50">
                <Bell className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold">All Clear</h4>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  You don't have any pending notifications or alerts at the moment.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((req) => (
              <NotificationItem 
                key={req.id} 
                req={req} 
                onAccept={handleAccept}
                onDecline={handleDecline}
                onDismiss={handleDismiss}
                onJoinRequest={handleJoinRequest}
                onTrack={handleTrackFriend}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
