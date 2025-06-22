import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { X } from 'lucide-react'
import Image from 'next/image'

interface FloatingComingSoonCardProps {
  open: boolean
  onClose: () => void
  featureName?: string
}

export const FloatingComingSoonCard: React.FC<FloatingComingSoonCardProps> = ({ open, onClose, featureName }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <Card className="relative glass-card border-2 border-dashed border-yellow-400/30 bg-card/80 shadow-2xl max-w-sm w-full animate-float">
        <button
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/30 transition"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
        <CardContent className="p-8 flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full border-4 border-yellow-300 shadow-lg mb-2 overflow-hidden bg-yellow-100">
            <Image
              src="https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif"
              alt="Back to the Future Doc Brown surprised"
              width={96}
              height={96}
              className="object-cover w-full h-full"
              unoptimized
              priority
            />
          </div>
          <h2 className="text-xl font-bold text-yellow-500 text-center">Great Scott!<br />{featureName || 'This feature'} isn&apos;t ready yet!</h2>
          <p className="text-muted-foreground text-center max-w-xs">
            We&apos;re still working on this. Check back soon for more movie magic!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Add a little floating animation
// In your global CSS (e.g., globals.css), add:
// @keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0); } }
// .animate-float { animation: float 2.5s ease-in-out infinite; }
