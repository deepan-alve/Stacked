import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <Card className="glass-card border-dashed border-2 border-primary/30 bg-card/80 shadow-2xl max-w-xl w-full">
        <CardContent className="p-12 flex flex-col items-center gap-6">
          <div className="w-32 h-32 rounded-full border-4 border-primary shadow-lg mb-2 overflow-hidden bg-primary/10">
            <Image
              src="https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif"
              alt="Matrix code rain construction"
              width={128}
              height={128}
              className="object-cover w-full h-full"
              unoptimized
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-primary text-center drop-shadow-md">404: Page Not Found</h1>
          <p className="text-muted-foreground text-center max-w-md text-lg">
            <span className="block mb-2">&quot;There is no page... yet.&quot;</span>
            <span className="italic">(Like The Matrix, we&apos;re still building this reality. Come back soon for more movie magic!)</span>
          </p>
          <Link href="/" className="mt-4 px-6 py-2 rounded-lg bg-primary/80 text-white font-semibold shadow hover:bg-primary transition">
            Return to Home
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
