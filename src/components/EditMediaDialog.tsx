'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, Trash2, X } from 'lucide-react'
import { UserMedia, MediaStatus } from '@/types/database'
import { updateUserMedia, deleteUserMedia } from '@/lib/api/media'
import { useStore } from '@/store/media'

interface EditMediaDialogProps {
  userMedia: UserMedia
  children: React.ReactNode
}

const statusOptions: { value: MediaStatus; label: string }[] = [
  { value: 'completed', label: 'Completed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'planned', label: 'Planned' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'on_hold', label: 'On Hold' },
]

export default function EditMediaDialog({ userMedia, children }: EditMediaDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    status: userMedia.status,
    rating: userMedia.rating || 0,
    review: userMedia.review || '',
    notes: userMedia.notes || '',
  })

  const { updateUserMedia: updateStoreUserMedia, removeUserMedia } = useStore()

  const handleSave = async () => {
    if (!userMedia.id) return

    setIsLoading(true)
    try {
      const result = await updateUserMedia(userMedia.id, {
        status: formData.status,
        rating: formData.rating || undefined,
        review: formData.review || undefined,        notes: formData.notes || undefined,
      })

      if (result.success && result.data) {
        updateStoreUserMedia(userMedia.id, result.data)
        console.log('Media updated successfully!')
        setOpen(false)
      } else {
        console.error(result.error || 'Failed to update media')
      }
    } catch (error) {
      console.error('Error updating media:', error)
    }finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!userMedia.id) return

    setIsDeleting(true)
    try {
      const result = await deleteUserMedia(userMedia.id)

      if (result.success) {
        removeUserMedia(userMedia.id)
        console.log('Media removed from library!')
        setOpen(false)
      } else {
        console.error(result.error || 'Failed to delete media')
      }
    } catch (error) {
      console.error('Error deleting media:', error)
    }finally {
      setIsDeleting(false)
    }
  }

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit {userMedia.media_item?.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: MediaStatus) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleRatingClick(rating)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-6 w-6 ${
                      rating <= formData.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {formData.rating > 0 && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rating: 0 }))}
                  className="ml-2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Review */}
          <div className="space-y-2">
            <Label htmlFor="review">Review</Label>
            <Textarea
              id="review"
              placeholder="Share your thoughts about this media..."
              value={formData.review}
              onChange={(e) => setFormData(prev => ({ ...prev, review: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Personal Notes</Label>
            <Textarea
              id="notes"
              placeholder="Private notes for yourself..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isLoading}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading || isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || isDeleting}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
