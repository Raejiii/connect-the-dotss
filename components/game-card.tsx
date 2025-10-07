"use client"

import type { Card } from "@/types/game"
import Image from "next/image"

interface GameCardProps {
  card: Card
  index: number
  isCorrect: boolean
  offsetY: number
  onClick: () => void
}

export function GameCard({ card, index, isCorrect, offsetY, onClick }: GameCardProps) {
  const colors = ["bg-blue-500", "bg-red-500", "bg-pink-500", "bg-green-500", "bg-purple-500"]
  const stripeColors = ["bg-blue-600", "bg-red-600", "bg-pink-600", "bg-green-600", "bg-purple-600"]

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center rounded-2xl border-4 border-white shadow-lg transition-all duration-500 ease-out ${
        colors[index % colors.length]
      } w-32 h-40 md:w-40 md:h-48`}
      style={{
        transform: `translateY(${offsetY}px)`,
      }}
    >
      {card.image && (
        <div className="relative w-24 h-24 md:w-32 md:h-32 mb-2 bg-white rounded-lg overflow-hidden">
          <Image src={card.image || "/placeholder.svg"} alt={card.name} fill className="object-cover" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-center">
        <div
          className={`absolute inset-0 ${stripeColors[index % stripeColors.length]} opacity-20`}
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)",
          }}
        />
        <span className="relative text-white font-bold text-sm md:text-base uppercase tracking-wide">{card.name}</span>
      </div>
    </button>
  )
}
