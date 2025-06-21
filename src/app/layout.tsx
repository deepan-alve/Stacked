import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavigationWrapper } from '@/components/navigation/NavigationWrapper'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { OnboardingWrapper } from '@/components/onboarding/OnboardingWrapper'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stacked - Track Your Media Journey",
  description: "Beautiful media tracking app for movies, TV shows, books, anime, games and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <NavigationWrapper />
            <main className="relative">
              {children}
            </main>
            <OnboardingWrapper />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
