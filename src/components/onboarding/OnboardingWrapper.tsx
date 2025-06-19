'use client'

import { OnboardingTour, useOnboarding } from './OnboardingTour'

export function OnboardingWrapper() {
  const { shouldShowOnboarding, closeOnboarding } = useOnboarding()

  return (
    <OnboardingTour 
      isOpen={shouldShowOnboarding} 
      onClose={closeOnboarding} 
    />
  )
}
