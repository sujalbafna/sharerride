
"use client"

import { useState, useCallback, useRef } from "react"
import Cropper from "react-easy-crop"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Camera, Loader2, Check, X } from "lucide-react"
import { getCroppedImg } from "@/lib/crop-utils"
import { useToast } from "@/hooks/use-toast"
import { useStorage, useUser, useFirestore } from "@/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { doc, updateDoc, setDoc } from "firebase/firestore"
import { updateProfile } from "firebase/auth"

interface ProfilePhotoSelectorProps {
  currentPhotoUrl?: string | null
  displayName?: string
  onSuccess?: (url: string) => void
}

export function ProfilePhotoSelector({ currentPhotoUrl, displayName, onSuccess }: ProfilePhotoSelectorProps) {
  const { user } = useUser()
  const db = useFirestore()
  const storage = useStorage()
  const { toast } = useToast()
  
  const [image, setImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onCropComplete = useCallback((_croppedArea: any, pixelCrop: any) => {
    setCroppedAreaPixels(pixelCrop)
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (!file.type.startsWith('image/')) {
        toast({ variant: "destructive", title: "Invalid File", description: "Please select an image." })
        return
      }
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImage(reader.result as string)
        setIsCropping(true)
      })
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!image || !croppedAreaPixels || !storage || !user || !db) return

    setIsUploading(true)
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels)
      if (!croppedBlob) throw new Error("Could not crop image")

      const storageRef = ref(storage, `profilePhotos/${user.uid}`)
      await uploadBytes(storageRef, croppedBlob)
      const downloadURL = await getDownloadURL(storageRef)

      // Update both User document and Auth Profile
      await updateDoc(doc(db, "users", user.uid), {
        profileImageUrl: downloadURL,
        updatedAt: new Date().toISOString()
      })

      await setDoc(doc(db, "publicProfiles", user.uid), {
        photoURL: downloadURL,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      await updateProfile(user, { photoURL: downloadURL })

      toast({ title: "Photo Updated", description: "Your profile picture has been adjusted and saved." })
      setIsCropping(false)
      setImage(null)
      if (onSuccess) onSuccess(downloadURL)
    } catch (error: any) {
      console.error(error)
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not save adjusted photo." })
    } finally {
      setIsUploading(false)
    }
  }

  const triggerSelect = () => fileInputRef.current?.click()

  return (
    <>
      <div className="relative group cursor-pointer" onClick={triggerSelect}>
        <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-primary/10 shadow-xl overflow-hidden bg-muted transition-all group-hover:opacity-90">
          {currentPhotoUrl ? (
            <img src={currentPhotoUrl} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-4xl font-black uppercase">
              {displayName?.[0] || user?.displayName?.[0] || 'U'}
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-8 w-8 text-white" />
          </div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange}
        />
      </div>

      <Dialog open={isCropping} onOpenChange={(open) => !open && setIsCropping(false)}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-8 border-none shadow-2xl">
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-2xl font-black">Adjust Profile Photo</DialogTitle>
            <DialogDescription>Drag to position and zoom to fit the circle.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="relative h-[300px] w-full bg-slate-900 rounded-2xl overflow-hidden border-4 border-muted">
              {image && (
                <Cropper
                  image={image}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Zoom Level</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(value) => setZoom(value[0])}
                className="py-2"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest"
              onClick={() => setIsCropping(false)}
              disabled={isUploading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest bg-primary shadow-xl shadow-primary/20"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Add Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
