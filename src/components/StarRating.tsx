'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  max?: number // 5 or 10
}

export function StarRating({ 
  value, 
  onChange, 
  readonly = false, 
  size = 'md',
  showValue = true,
  max = 5
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const handleClick = (rating: number) => {
    if (!readonly) {
      onChange(rating)
    }
  }

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(null)
    }
  }

  const renderStar = (index: number) => {
    const starValue = index + 0.5
    const fullStarValue = index + 1
    const currentValue = hoverValue ?? value
    
    const isHalfFilled = currentValue >= starValue && currentValue < fullStarValue
    const isFullFilled = currentValue >= fullStarValue

    return (
      <div key={index} className="relative inline-block">
        {/* Half star clickable area */}
        <button
          type="button"
          className={cn(
            "absolute left-0 top-0 w-1/2 h-full z-10",
            readonly ? "cursor-default" : "cursor-pointer"
          )}
          onClick={() => handleClick(starValue)}
          onMouseEnter={() => handleMouseEnter(starValue)}
          onMouseLeave={handleMouseLeave}
          disabled={readonly}
        />
        
        {/* Full star clickable area */}
        <button
          type="button"
          className={cn(
            "absolute right-0 top-0 w-1/2 h-full z-10",
            readonly ? "cursor-default" : "cursor-pointer"
          )}
          onClick={() => handleClick(fullStarValue)}
          onMouseEnter={() => handleMouseEnter(fullStarValue)}
          onMouseLeave={handleMouseLeave}
          disabled={readonly}
        />
        
        {/* Star background */}
        <Star 
          className={cn(
            sizeClasses[size],
            "text-muted-foreground relative"
          )}
        />
        
        {/* Star fill */}
        <div 
          className="absolute top-0 left-0 overflow-hidden"
          style={{ 
            width: isFullFilled ? '100%' : isHalfFilled ? '50%' : '0%'
          }}
        >
          <Star 
            className={cn(
              sizeClasses[size],
              "text-yellow-500 fill-yellow-500"
            )}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: max }, (_, i) => i).map(renderStar)}
      </div>
      {showValue && (
        <span className="ml-2 text-sm text-muted-foreground">
          {value > 0 ? `${value}/${max}` : 'No rating'}
        </span>
      )}
    </div>
  )
}
