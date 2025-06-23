// src/components/ui/RatingSystemSelect.tsx
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type RatingSystem = '5-star' | '10-star' | '100-point' | 'like-dislike' | 'decimal'

export interface RatingSystemSelectProps {
  value: RatingSystem
  onChange: (value: RatingSystem) => void
}

export const ratingSystemOptions: { value: RatingSystem; label: string }[] = [
  { value: '5-star', label: '5 Stars' },
  { value: '10-star', label: '10 Stars' },
  { value: '100-point', label: '100 Point Scale' },
  { value: 'like-dislike', label: 'Like / Dislike' },
  { value: 'decimal', label: 'Decimal (0.0 - 10.0)' },
]

export default function RatingSystemSelect({ value, onChange }: RatingSystemSelectProps) {
  return (
    <div className="space-y-2">
      <Label>Rating System</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ratingSystemOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
