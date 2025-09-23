"use client"

import { useState, useEffect } from "react"
import LabellingGame from "./components/LabellingGame"
import type { GameConfigType } from "./types/GameTypes"
import { gameConfig } from "./config/game-config"

function App() {
  const [showSplashScreen, setShowSplashScreen] = useState<boolean>(true)
  const [config] = useState<GameConfigType>(gameConfig)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplashScreen(false)
    }, gameConfig.splashScreen.duration)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  if (showSplashScreen) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-64 h-64 relative flex items-center justify-center">
          <img
            src={gameConfig.splashScreen.logo || "/placeholder.svg?height=256&width=256"}
            alt="eklavya - making learning accessible"
            className="w-full h-full object-contain animate-fade-in"
          />
        </div>
      </div>
    )
  }

  return <LabellingGame config={config} />
}

export default App
