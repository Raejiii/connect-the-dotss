import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Spot the Differences Game',
  description: 'A fun game to find differences between two images',
  openGraph: {
    title: 'Spot the Differences Game',
    description: 'A fun game to find differences between two images',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spot the Differences Game',
    description: 'A fun game to find differences between two images',
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
