'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Search, 
  Plus, 
  Library, 
  FolderOpen, 
  Star,
  CheckCircle
} from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  action?: string
  highlight?: string
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Stacked! 🎉',
    description: 'Your personal media tracking companion. Let\'s take a quick tour to get you started!',
    icon: Star,
    action: 'Start Tour'
  },
  {
    id: 'search',
    title: 'Discover New Media',
    description: 'Use the search feature to find movies, books, anime, games, and more from popular databases.',
    icon: Search,
    highlight: 'Click "Search" in the navigation to explore'
  },
  {
    id: 'add',
    title: 'Add to Your Library',
    description: 'Found something interesting? Add it to your personal library with ratings, reviews, and status tracking.',
    icon: Plus,
    highlight: 'Try the "Add Media" button'
  },
  {
    id: 'library',
    title: 'Manage Your Collection',
    description: 'View, organize, and track all your media in one place. Filter by status, type, or rating.',
    icon: Library,
    highlight: 'Visit your "Library" to see everything'
  },
  {
    id: 'collections',
    title: 'Organize with Collections',
    description: 'Create custom collections like "Favorites", "To Watch", or "2024 Reads" to organize your media.',
    icon: FolderOpen,
    highlight: 'Check out "Collections" for organization'
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🚀',
    description: 'Start building your media library today. Happy tracking!',
    icon: CheckCircle,
    action: 'Get Started'
  }
]

interface OnboardingTourProps {
  isOpen: boolean
  onClose: () => void
}

export function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    setIsCompleting(true)
    // Mark onboarding as completed
    localStorage.setItem('stacked-onboarding-completed', 'true')
    
    setTimeout(() => {
      onClose()
      setIsCompleting(false)
      setCurrentStep(0)
    }, 1500)
  }

  const handleSkip = () => {
    localStorage.setItem('stacked-onboarding-completed', 'true')
    onClose()
  }

  const step = onboardingSteps[currentStep]
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="absolute -top-2 -right-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="flex items-center gap-2">
            <step.icon className="h-5 w-5 text-primary" />
            {step.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {onboardingSteps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
                {step.highlight && (
                  <Badge variant="secondary" className="text-xs">
                    💡 {step.highlight}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {onboardingSteps.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-primary'
                      : index < currentStep
                      ? 'bg-primary/50'
                      : 'bg-muted'
                  }`}
                  onClick={() => setCurrentStep(index)}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              disabled={isCompleting}
              className="flex items-center gap-2"
            >
              {isCompleting ? (
                <>
                  <CheckCircle className="h-4 w-4 animate-spin" />
                  Completing...
                </>
              ) : currentStep === onboardingSteps.length - 1 ? (
                <>
                  {step.action || 'Complete'}
                  <CheckCircle className="h-4 w-4" />
                </>
              ) : (
                <>
                  {step.action || 'Next'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Skip Option */}
          {currentStep < onboardingSteps.length - 1 && (
            <div className="text-center">
              <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
                Skip tour
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook to manage onboarding state
export function useOnboarding() {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false)

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('stacked-onboarding-completed')
    if (!hasCompletedOnboarding) {
      // Delay showing onboarding to let the page load
      const timer = setTimeout(() => {
        setShouldShowOnboarding(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const closeOnboarding = () => {
    setShouldShowOnboarding(false)
  }

  const resetOnboarding = () => {
    localStorage.removeItem('stacked-onboarding-completed')
    setShouldShowOnboarding(true)
  }

  return {
    shouldShowOnboarding,
    closeOnboarding,
    resetOnboarding
  }
}
