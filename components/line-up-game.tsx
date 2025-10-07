"use client"

import { useState, useEffect } from "react"
import { gameConfig } from "@/config/game-config"
import { GameCard } from "./game-card"
import type { Card } from "@/types/game"
import confetti from "canvas-confetti"
import Image from "next/image"

export function LineUpGame() {
  const scene = gameConfig.scenes[0]
  const [cards, setCards] = useState<Card[]>([...scene.cards])
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [catWalking, setCatWalking] = useState(false)
  const [catPosition, setCatPosition] = useState(0)
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (catWalking) {
      const duration = 1500
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        setCatPosition(progress * 100)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            })
          }, 100)
        }
      }

      setTimeout(() => {
        requestAnimationFrame(animate)
      }, 500)
    }
  }, [catWalking])

  const handleCardClick = (cardId: string) => {
    if (isComplete) return

    setSelectedCards((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId)
      } else {
        return [...prev, cardId]
      }
    })

    const currentIndex = cards.findIndex((c) => c.id === cardId)
    const selectedIndex = selectedCards.length

    if (selectedIndex < cards.length - 1) {
      const newCards = [...cards]
      const temp = newCards[selectedIndex]
      newCards[selectedIndex] = newCards[currentIndex]
      newCards[currentIndex] = temp
      setCards(newCards)
    }
  }

  const checkOrder = () => {
    const currentOrder = cards.map((c) => c.id)
    const isCorrect = JSON.stringify(currentOrder) === JSON.stringify(scene.correctOrder)

    if (isCorrect) {
      setIsComplete(true)
      setCatWalking(true)
    }
  }

  const getCardOffset = (index: number) => {
    if (isComplete) return 0
    return index % 2 === 0 ? -30 : 30
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-cyan-400 to-blue-500">
      {/* Snow particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-70"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `snowfall ${5 + Math.random() * 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Mountains */}
      <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none">
        <svg viewBox="0 0 1200 300" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,300 L0,200 L200,100 L300,150 L400,80 L600,200 L800,120 L1000,180 L1200,100 L1200,300 Z"
            fill="#3b82f6"
            opacity="0.3"
          />
          <path
            d="M0,300 L0,220 L150,140 L250,180 L350,120 L500,200 L700,140 L900,190 L1100,130 L1200,170 L1200,300 Z"
            fill="#2563eb"
            opacity="0.5"
          />
          <path
            d="M0,300 L0,240 L100,180 L200,210 L300,160 L450,220 L650,170 L850,210 L1050,160 L1200,200 L1200,300 Z"
            fill="#1e40af"
            opacity="0.7"
          />
          <path d="M150,140 L200,100 L250,140 Z" fill="white" opacity="0.9" />
          <path d="M800,120 L850,80 L900,120 Z" fill="white" opacity="0.9" />
        </svg>
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center pt-4 md:pt-6">
        <div className="w-64 md:w-80 mb-2">
          <Image src="/images/game-logo.png" alt="LINE-UP GAME" width={400} height={100} className="w-full h-auto" />
        </div>

        <div className="flex items-center gap-2 text-white text-xl md:text-2xl font-bold mb-4">
          <span className="text-3xl">⏳</span>
          <span>{formatTime(timer)}</span>
        </div>

        <div className="bg-white rounded-full px-6 py-3 shadow-lg mb-8">
          <p className="text-gray-800 font-bold text-sm md:text-base">{scene.question}</p>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative z-10 flex items-center justify-center px-4 mt-8">
        {/* Left Platform with Cat */}
        <div className="relative flex flex-col items-center mr-4">
          <div className="relative w-20 h-20 md:w-24 md:h-24 mb-2">
            <Image
              src="/images/cat.png"
              alt="Cat"
              fill
              className="object-contain"
              style={{
                transform: catWalking ? `translateX(${catPosition * 8}px)` : "translateX(0)",
                transition: "none",
                zIndex: 50,
                position: "relative",
                top: "-60px",
              }}
            />
          </div>
          <div className="relative w-24 h-16 md:w-28 md:h-20">
            <Image src="/images/platform.png" alt="Platform" fill className="object-contain" />
          </div>
        </div>

        {/* Cards */}
        <div className="flex gap-2 md:gap-4">
          {cards.map((card, index) => (
            <GameCard
              key={card.id}
              card={card}
              index={index}
              isCorrect={isComplete}
              offsetY={getCardOffset(index)}
              onClick={() => handleCardClick(card.id)}
            />
          ))}
        </div>

        {/* Right Platform with Ice Cream */}
        <div className="relative flex flex-col items-center ml-4">
          <div className="relative w-16 h-20 md:w-20 md:h-24 mb-2">
            <Image
              src="/images/ice-cream.png"
              alt="Ice Cream"
              fill
              className="object-contain"
              style={{
                position: "relative",
                top: "-60px",
              }}
            />
          </div>
          <div className="relative w-24 h-16 md:w-28 md:h-20">
            <Image src="/images/platform.png" alt="Platform" fill className="object-contain" />
          </div>
        </div>
      </div>

      {/* Done Button */}
      <div className="relative z-10 flex justify-center mt-8">
        <button
          onClick={checkOrder}
          disabled={isComplete}
          className="transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <Image src="/images/done-button.png" alt="Done" width={200} height={80} className="w-40 md:w-48 h-auto" />
        </button>
      </div>
    </div>
  )
}
