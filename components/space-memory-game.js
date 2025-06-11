"use client"

import React, { useState, useEffect } from 'react'
import { Pause, Play, HelpCircle, RefreshCw } from 'lucide-react'

const SPACE_ITEMS = [
  { 
    id: 'earth', 
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%2334A853' stroke='%23135E96' stroke-width='2'/%3E%3Cpath d='M30 40 Q50 20 70 40 T90 60' fill='none' stroke='%23135E96' stroke-width='2'/%3E%3C/svg%3E",
    alt: 'Earth' 
  },
  { 
    id: 'mars', 
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23FF4444' stroke='%23CC0000' stroke-width='2'/%3E%3Ccircle cx='40' cy='40' r='10' fill='%23CC0000'/%3E%3C/svg%3E",
    alt: 'Mars' 
  },
  { 
    id: 'saturn', 
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='35' fill='%23FFB900'/%3E%3Cellipse cx='50' cy='50' rx='45' ry='15' fill='none' stroke='%23CC8800' stroke-width='4'/%3E%3C/svg%3E",
    alt: 'Saturn' 
  },
  { 
    id: 'jupiter', 
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23FFB347' stroke='%23CC8800' stroke-width='2'/%3E%3Cpath d='M20 50 h60' stroke='%23CC8800' stroke-width='8'/%3E%3C/svg%3E",
    alt: 'Jupiter' 
  },
  { 
    id: 'neptune', 
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%234169E1' stroke='%230000CC' stroke-width='2'/%3E%3Cpath d='M30 50 Q50 30 70 50' fill='none' stroke='%230000CC' stroke-width='4'/%3E%3C/svg%3E",
    alt: 'Neptune' 
  }
]

export function SpaceMemoryGame() {
  const [cards, setCards] = useState([])
  const [flippedCards, setFlippedCards] = useState([])
  const [isPaused, setIsPaused] = useState(false)
  const [overlay, setOverlay] = useState('start')
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    resetGame()
    return () => {
      if (window.resetTimer) {
        clearTimeout(window.resetTimer)
      }
    }
  }, [])

  const resetGame = () => {
    if (window.resetTimer) {
      clearTimeout(window.resetTimer);
    }

    const shuffledCards = [...SPACE_ITEMS, ...SPACE_ITEMS]
      .sort(() => Math.random() - 0.5)
      .map((item, index) => ({
        id: index,
        itemId: item.id,
        src: item.src,
        alt: item.alt,
        isFlipped: true,
        isMatched: false,
      }))
    setCards(shuffledCards)
    setFlippedCards([])
    setIsPaused(false)
    setOverlay('start')
    setGameStarted(false)

    window.resetTimer = setTimeout(() => {
      setCards(cards => cards.map(card => ({ ...card, isFlipped: false })))
      setOverlay(null)
      setGameStarted(true)
    }, 5000)
  }

  const handleCardClick = (id) => {
    if (!gameStarted || isPaused || flippedCards.length === 2) return
    if (cards[id].isMatched) return

    setCards(prevCards =>
      prevCards.map(card =>
        card.id === id ? { ...card, isFlipped: true } : card
      )
    )

    setFlippedCards(prev => [...prev, id])

    if (flippedCards.length === 1) {
      const [firstCardId] = flippedCards
      if (cards[firstCardId].itemId === cards[id].itemId) {
        setCards(prevCards =>
          prevCards.map(card =>
            card.id === firstCardId || card.id === id
              ? { ...card, isMatched: true }
              : card
          )
        )
        setFlippedCards([])
      } else {
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(card =>
              card.id === firstCardId || card.id === id
                ? { ...card, isFlipped: false }
                : card
            )
          )
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  const togglePause = () => {
    if (!gameStarted) return
    setIsPaused(!isPaused)
    setOverlay(isPaused ? null : 'pause')
  }

  const showHelp = () => {
    setIsPaused(true)
    setOverlay('help')
  }

  return (
    <div className="min-h-screen bg-[#FFE4BA] p-4 relative">
      <div className="relative max-w-4xl mx-auto">
        {/* Control buttons */}
        <button
          onClick={togglePause}
          className="absolute left-0 top-0 w-16 h-16 rounded-full bg-violet-500 hover:bg-violet-600 flex items-center justify-center transition-colors"
          disabled={!gameStarted}
        >
          {isPaused ? (
            <Play className="w-8 h-8 text-white" />
          ) : (
            <Pause className="w-8 h-8 text-white" />
          )}
        </button>
        <button
          onClick={resetGame}
          className="absolute left-20 top-0 w-16 h-16 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors"
        >
          <RefreshCw className="w-8 h-8 text-white" />
        </button>
        <button
          onClick={showHelp}
          className="absolute right-0 top-0 w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
        >
          <HelpCircle className="w-8 h-8 text-white" />
        </button>

        {/* Game grid */}
        <div className="grid grid-cols-5 gap-4 pt-32 px-4">
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`aspect-square rounded-2xl p-2 transition-all duration-300 ${
                card.isFlipped || card.isMatched
                  ? 'bg-white shadow-lg'
                  : 'bg-white/80 shadow-md hover:scale-105'
              }`}
              disabled={card.isFlipped || card.isMatched || isPaused || !gameStarted}
            >
              {(card.isFlipped || card.isMatched) && (
                <img
                  src={card.src}
                  alt={card.alt}
                  className="w-full h-full object-contain"
                />
              )}
            </button>
          ))}
        </div>

        {/* Overlay */}
        {overlay && (
          <div className="fixed inset-x-0 top-0 bg-black/50 z-50 p-4">
            <div className="bg-white p-4 rounded-2xl max-w-md mx-auto text-center">
              {overlay === 'start' && (
                <>
                  <h2 className="text-xl font-bold mb-2">Memorize the Cards!</h2>
                  <p className="mb-2">You have 5 seconds to memorize the positions of all cards before they flip over.</p>
                </>
              )}
              {overlay === 'pause' && (
                <>
                  <h2 className="text-xl font-bold mb-2">Game Paused</h2>
                  <p className="mb-2">Take a break! Click the pause button to resume.</p>
                </>
              )}
              {overlay === 'help' && (
                <>
                  <h2 className="text-xl font-bold mb-2">How to Play</h2>
                  <p className="mb-2">Find matching pairs of space objects by flipping cards two at a time. Remember their positions and match all pairs to win!</p>
                </>
              )}
              <button
                onClick={() => {
                  setOverlay(null)
                  if (overlay === 'help') setIsPaused(false)
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                {overlay === 'pause' ? 'Resume' : overlay === 'start' ? 'Get Ready!' : 'Got it!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
