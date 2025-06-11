'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const SpaceMemoryGame = dynamic(() => import('./SpaceMemoryGame'), { 
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center bg-[#FFE4BA]">
      <div className="text-xl">Loading game...</div>
    </div>
  )
})

export default function DynamicSpaceMemoryGame() {
  return (
    <div className="h-screen w-full bg-[#FFE4BA] overflow-hidden">
      <SpaceMemoryGame />
    </div>
  )
}
