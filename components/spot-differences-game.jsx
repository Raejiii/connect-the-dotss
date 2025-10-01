"use client"

import React, { useState, useEffect, useRef } from "react"
import { Pause, Play, RotateCcw, HelpCircle, Music, VolumeX, Check } from "lucide-react"
import confetti from "canvas-confetti"
import gameConfig from "../config/game-config" // Updated import to use TypeScript config file instead of JSON
import { FoundMarker } from "./found-marker"

const audioFiles = {
  background:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-cherry-cute-bgm-271158-zIouDJ4FGUOTEpIXP10RZWnp9zff4A.mp3",
  success: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/success-MdF7nLdkwPlakm27xQWQmfipYHDzTL.webm",
  uiClick: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ui-click-IH3biGSjh8pksEtf1bHOC49dGslDPU.webm",
  incorrect: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/incorrect-EsdPobrzIGyWVonDaJINuAhdNb496F.webm",
  effect: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/effect-7ewtIez1dCpY35G2g66YHhdvLCUekQ.webm",
  levelWin: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/level-win-SxCsRZQKipPLOAIFiceyYmP8n5rMn7.webm",
  clap: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/clap-9gShvB1t4npUll2sKjSmcNBScG0mJ5.webm",
  instructions: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/help-UoHPEMLC6hm5gRjWK2L2ldXFPoLfyt.webm",
}

const SPLASH_LOGO = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5(1)-73vfqVPWLBqxMGlVT7qGgN1NjIs7K8.png"

export function SpotDifferencesGame() {
  const [showSplash, setShowSplash] = useState(true)
  const [foundDifferences, setFoundDifferences] = useState([])
  const [currentScene] = useState(gameConfig.scenes[0])
  const [gameState, setGameState] = useState("start")
  const [showOverlay, setShowOverlay] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [floatingText, setFloatingText] = useState({ text: "", show: false })
  const [isSplashFading, setIsSplashFading] = useState(false)
  const [currentHint, setCurrentHint] = useState("")
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const audioRefs = useRef({})
  const leftImageRef = useRef(null)
  const rightImageRef = useRef(null)

  const [userOrder, setUserOrder] = useState([])
  const [selectedCard, setSelectedCard] = useState(null)

  const isWordsGame = gameConfig.gameType === "words"

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsSplashFading(true)
    }, 1500)

    const removeTimer = setTimeout(() => {
      setShowSplash(false)
    }, 2000)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  useEffect(() => {
    if (!showSplash) {
      resetGame()
    }
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }
      })
    }
  }, [showSplash])

  useEffect(() => {
    if (gameState === "playing" && !isMuted) {
      playAudio("background", true)
    } else {
      pauseAudio("background")
    }
  }, [gameState, isMuted])

  useEffect(() => {
    if (!leftImageRef.current) return

    const updateImageSize = () => {
      const rect = leftImageRef.current?.getBoundingClientRect()
      if (rect) {
        setImageSize({ width: rect.width, height: rect.height })
      }
    }

    const resizeObserver = new ResizeObserver(updateImageSize)
    resizeObserver.observe(leftImageRef.current)

    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    Object.entries(audioFiles).forEach(([name, url]) => {
      const audio = new Audio()
      audio.preload = "auto"
      audio.src = url
      audioRefs.current[name] = audio
    })
  }, [])

  const playAudio = (name, loop = false) => {
    if (!isMuted) {
      if (!audioRefs.current[name]) {
        const audioUrl = audioFiles[name]
        if (!audioUrl) {
          console.error(`Audio file not found for: ${name}`)
          return
        }
        audioRefs.current[name] = new Audio()
        audioRefs.current[name].preload = "auto"
        audioRefs.current[name].loop = loop

        // Try different audio formats
        const formats = [audioUrl, audioUrl.replace(".webm", ".mp3"), audioUrl.replace(".webm", ".ogg")]
        const tryNextFormat = (index) => {
          if (index >= formats.length) {
            console.error(`Unable to play audio ${name}: No supported format found`)
            return
          }
          audioRefs.current[name].src = formats[index]
          audioRefs.current[name].play().catch((error) => {
            console.warn(`Error playing audio ${name} with format ${formats[index]}:`, error.message)
            tryNextFormat(index + 1)
          })
        }
        tryNextFormat(0)
      } else {
        audioRefs.current[name].play().catch((error) => {
          console.error(`Error playing audio ${name}:`, error.message)
        })
      }
    }
  }

  const pauseAudio = (name) => {
    if (audioRefs.current[name]) {
      audioRefs.current[name].pause()
    }
  }

  const stopAllAudio = () => {
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    })
  }

  const toggleMute = () => {
    setIsMuted((prev) => !prev)
    if (isMuted) {
      if (gameState === "playing") {
        playAudio("background", true)
      }
    } else {
      stopAllAudio()
    }
  }

  const resetGame = () => {
    setFoundDifferences([])
    if (isWordsGame) {
      setUserOrder([])
      setSelectedCard(null)
    }
    setGameState("start")
    setShowOverlay(true)
    setShowSidebar(false)
    stopAllAudio()
    setCurrentHint("")
  }

  const startGame = () => {
    setGameState("playing")
    setShowOverlay(false)
    setShowSidebar(false)
    playAudio("uiClick")
    if (isWordsGame) {
      const shuffled = [...currentScene.cards].sort(() => Math.random() - 0.5)
      setUserOrder(shuffled.map((card) => card.id))
    }
  }

  const playConfetti = (x, y) => {
    const relativeX = x / window.innerWidth
    const relativeY = y / window.innerHeight

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: relativeX, y: relativeY },
      gravity: 1.5,
      scalar: 0.7,
      startVelocity: 20,
    })
  }

  const playBigConfetti = () => {
    const duration = 5 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 }

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 100 * (timeLeft / duration)

      confetti(
        Object.assign({}, defaults, {
          particleCount: particleCount * 0.5,
          shapes: ["circle"],
          scalar: 2,
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        }),
      )

      confetti(
        Object.assign({}, defaults, {
          particleCount: particleCount * 0.5,
          shapes: ["square"],
          scalar: 1.5,
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        }),
      )
    }, 250)
  }

  const handleImageClick = (e, isLeftImage) => {
    if (gameState !== "playing") return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const scaleX = currentScene.width / rect.width
    const scaleY = currentScene.height / rect.height

    const scaledX = x * scaleX
    const scaledY = y * scaleY

    const clickedDifference = currentScene.differences.find((diff) => {
      const { x, y, width, height, angle = 0 } = diff.hitbox
      const centerX = x + width / 2
      const centerY = y + height / 2
      const dx = scaledX - centerX
      const dy = scaledY - centerY
      const rotatedX = dx * Math.cos((-angle * Math.PI) / 180) - dy * Math.sin((-angle * Math.PI) / 180)
      const rotatedY = dx * Math.sin((-angle * Math.PI) / 180) + dy * Math.cos((-angle * Math.PI) / 180)
      return Math.abs(rotatedX) <= width / 2 && Math.abs(rotatedY) <= height / 2
    })

    if (clickedDifference && !foundDifferences.includes(clickedDifference.id)) {
      playAudio("success")
      setFoundDifferences((prev) => [...prev, clickedDifference.id])
      playConfetti(e.clientX, e.clientY)
      setFloatingText({ text: `Found: ${clickedDifference.name}!`, show: true })
      setTimeout(() => setFloatingText({ text: "", show: false }), 2000)

      if (foundDifferences.length + 1 === currentScene.differences.length) {
        setGameState("won")
        playAudio("levelWin")
        playAudio("clap")
        pauseAudio("background")
        playBigConfetti()
        setTimeout(() => {
          setShowOverlay(true)
        }, 2000)
      }
    } else if (!clickedDifference) {
      playAudio("incorrect")
      const ripple = document.createElement("div")
      ripple.className = "absolute w-12 h-12 bg-red-500 rounded-full opacity-50 animate-ripple"
      ripple.style.left = `${x - 24}px`
      ripple.style.top = `${y - 24}px`
      e.currentTarget.appendChild(ripple)
      setTimeout(() => ripple.remove(), 1000)
    }
  }

  const handleCardClick = (cardId) => {
    if (gameState !== "playing") return

    playAudio("uiClick")

    if (selectedCard === null) {
      // First card selected
      setSelectedCard(cardId)
    } else if (selectedCard === cardId) {
      // Deselect if clicking the same card
      setSelectedCard(null)
    } else {
      // Swap the two cards
      const newOrder = [...userOrder]
      const index1 = newOrder.indexOf(selectedCard)
      const index2 = newOrder.indexOf(cardId)

      // Swap positions
      ;[newOrder[index1], newOrder[index2]] = [newOrder[index2], newOrder[index1]]

      setUserOrder(newOrder)
      setSelectedCard(null)

      // Check if order is correct
      const isCorrect = newOrder.every((id, index) => id === currentScene.correctOrder[index])

      if (isCorrect) {
        setGameState("won")
        playAudio("levelWin")
        playAudio("clap")
        pauseAudio("background")
        playBigConfetti()
        setFloatingText({ text: "Perfect!", show: true })
        setTimeout(() => {
          setFloatingText({ text: "", show: false })
          setShowOverlay(true)
        }, 2000)
      }
    }
  }

  const handleSubmit = () => {
    if (gameState !== "playing") return

    const isCorrect = userOrder.every((id, index) => id === currentScene.correctOrder[index])

    if (isCorrect) {
      playAudio("success")
      setGameState("won")
      playAudio("levelWin")
      playAudio("clap")
      pauseAudio("background")
      playBigConfetti()
      setFloatingText({ text: "Perfect!", show: true })
      setTimeout(() => {
        setFloatingText({ text: "", show: false })
        setShowOverlay(true)
      }, 2000)
    } else {
      playAudio("incorrect")
      setFloatingText({ text: "Try again!", show: true })
      setTimeout(() => {
        setFloatingText({ text: "", show: false })
      }, 1500)
    }
  }

  const togglePause = () => {
    if (gameState === "playing") {
      setGameState("paused")
      setShowSidebar(true)
      pauseAudio("background")
    } else if (gameState === "paused") {
      setGameState("playing")
      setShowSidebar(false)
      if (!isMuted) {
        playAudio("background", true)
      }
    }
    playAudio("uiClick")
  }

  const showHelp = () => {
    setGameState("help")
    setShowOverlay(true)
    playAudio("instructions")
  }

  const showNextHint = () => {
    const remainingDifferences = currentScene.differences.filter((diff) => !foundDifferences.includes(diff.id))
    if (remainingDifferences.length > 0) {
      const randomDiff = remainingDifferences[Math.floor(Math.random() * remainingDifferences.length)]
      setCurrentHint(randomDiff.hint)
      setTimeout(() => setCurrentHint(""), 3000)
    }
  }

  const scaleCoordinates = (x, y, width, height, angle = 0) => {
    if (!leftImageRef.current) return { x: 0, y: 0, width: 0, height: 0, angle: 0 }

    const imgElement = leftImageRef.current
    const rect = imgElement.getBoundingClientRect()

    // Get the actual rendered image dimensions
    const naturalRatio = imgElement.naturalWidth / imgElement.naturalHeight
    const containerRatio = rect.width / rect.height

    let renderWidth = rect.width
    let renderHeight = rect.height

    if (containerRatio > naturalRatio) {
      renderWidth = rect.height * naturalRatio
    } else {
      renderHeight = rect.width / naturalRatio
    }

    // Calculate the offset for centered image
    const offsetX = (rect.width - renderWidth) / 2
    const offsetY = (rect.height - renderHeight) / 2

    // Scale the coordinates
    const scaleX = renderWidth / currentScene.width
    const scaleY = renderHeight / currentScene.height

    return {
      x: Math.round(x * scaleX + offsetX),
      y: Math.round(y * scaleY + offsetY),
      width: Math.round(width * scaleX),
      height: Math.round(height * scaleY),
      angle,
    }
  }

  if (showSplash) {
    return (
      <div
        className={`fixed inset-0 bg-white flex items-center justify-center ${isSplashFading ? "animate-fade-out" : ""}`}
      >
        <div className="w-64 h-64 relative flex items-center justify-center">
          <img
            src={SPLASH_LOGO || "/placeholder.svg"}
            alt="eklavya - making learning accessible"
            className="w-full h-full object-contain animate-fade-in"
          />
        </div>
      </div>
    )
  }

  if (isWordsGame) {
    return (
      <div className="fixed inset-0 overflow-hidden animate-fade-in">
        {/* Themed background */}
        <div
          className="fixed inset-0 bg-[#F0E68C] pointer-events-none"
          style={{
            backgroundImage: `
              url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23000000' fillOpacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"),
              url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fillOpacity='0.05' fillRule='evenodd'/%3E%3C/svg%3E"),
            `,
            backgroundSize: "80px 80px, 120px 120px",
            backgroundPosition: "0 0, 40px 60px",
            animation: "backgroundScroll 60s linear infinite",
          }}
        />

        <div className="w-full h-full relative flex flex-col items-center justify-center z-10 p-4">
          {/* Question */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-orange-300 rounded-full px-6 md:px-8 py-2 md:py-3 text-lg md:text-xl font-bold z-50 max-w-[90%] text-center">
            {currentScene.question}
          </div>

          {/* Cards container */}
          <div className="flex flex-wrap gap-4 justify-center items-center max-w-4xl">
            {userOrder.map((cardId, index) => {
              const card = currentScene.cards.find((c) => c.id === cardId)
              const isSelected = selectedCard === cardId

              return (
                <button
                  key={cardId}
                  onClick={() => handleCardClick(cardId)}
                  className={`
                    relative bg-white rounded-2xl p-6 shadow-lg transition-all duration-200
                    hover:scale-105 hover:shadow-xl
                    ${isSelected ? "ring-4 ring-blue-500 scale-105" : ""}
                    min-w-[120px] min-h-[80px]
                  `}
                >
                  <div className="text-2xl font-bold text-gray-800">{card.name}</div>
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            className="mt-8 px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-full text-xl font-bold shadow-lg transition-colors flex items-center gap-2"
          >
            <Check className="w-6 h-6" />
            Check Answer
          </button>

          {/* Control buttons container */}
          <div
            className={`fixed top-0 left-0 bottom-0 flex items-start z-[60] transition-all duration-300 ${
              showSidebar ? "w-20 md:w-24 lg:w-32 bg-violet-500" : "w-14 md:w-16 lg:w-20"
            }`}
          >
            <div className="h-full flex flex-col items-center pt-4 gap-6">
              <button
                onClick={togglePause}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-violet-500 hover:bg-violet-600 flex items-center justify-center transition-colors shadow-lg"
                aria-label={showSidebar ? "Resume game" : "Pause game"}
              >
                {showSidebar ? (
                  <Play className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                ) : (
                  <Pause className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                )}
              </button>
              {showSidebar && (
                <>
                  <button
                    onClick={toggleMute}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${
                      isMuted ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                    } flex items-center justify-center transition-colors shadow-lg`}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    ) : (
                      <Music className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    )}
                  </button>
                  <button
                    onClick={resetGame}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors shadow-lg"
                    aria-label="Reset game"
                  >
                    <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Help button */}
          <button
            onClick={showHelp}
            className="fixed top-4 right-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg z-[60]"
            aria-label="Show help"
          >
            <HelpCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </button>

          {/* Hint text */}
          {currentHint && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white/90 rounded-lg px-6 py-3 text-lg font-medium shadow-lg z-50 max-w-[90%] text-center">
              {currentHint}
            </div>
          )}

          {/* Floating text */}
          {floatingText.show && (
            <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[70]">
              <div
                className="text-6xl sm:text-7xl md:text-8xl font-bold text-green-400 animate-float-fade"
                style={{
                  textShadow: "4px 4px 8px rgba(128, 0, 128, 0.8), -2px -2px 4px rgba(0, 0, 0, 0.6)",
                  filter: "drop-shadow(0 0 10px rgba(0, 255, 0, 0.7))",
                }}
              >
                {floatingText.text}
              </div>
            </div>
          )}

          {/* Overlays */}
          {showOverlay && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80]">
              <div className="bg-white p-6 sm:p-8 rounded-xl max-w-sm w-11/12 text-center">
                {gameState === "start" && (
                  <>
                    <h2 className="text-xl sm:text-2xl font-bold mb-4">Arrange the Words!</h2>
                    <p className="mb-6">{currentScene.question}</p>
                    <button
                      onClick={startGame}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Start Game
                    </button>
                  </>
                )}
                {gameState === "help" && (
                  <>
                    <h2 className="text-xl sm:text-2xl font-bold mb-4">How to Play</h2>
                    <p className="mb-4">Click two cards to swap their positions. Arrange them in the correct order!</p>
                    <button
                      onClick={showNextHint}
                      className="px-6 py-2 mb-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      Need a Hint?
                    </button>
                    <br />
                    <button
                      onClick={() => {
                        setGameState(showSidebar ? "paused" : "playing")
                        setShowOverlay(false)
                        playAudio("uiClick")
                      }}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Got it!
                    </button>
                  </>
                )}
                {gameState === "won" && (
                  <>
                    <h2 className="text-xl sm:text-2xl font-bold mb-4">Congratulations!</h2>
                    <p className="mb-6">You arranged the words correctly!</p>
                    <button
                      onClick={resetGame}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Play Again
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 overflow-hidden animate-fade-in">
      {/* Themed background */}
      <div
        className="fixed inset-0 bg-[#F0E68C] pointer-events-none"
        style={{
          backgroundImage: `
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23000000' fillOpacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"),
            url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fillOpacity='0.05' fillRule='evenodd'/%3E%3C/svg%3E")
          `,
          backgroundSize: "80px 80px, 120px 120px",
          backgroundPosition: "0 0, 40px 60px",
          animation: "backgroundScroll 60s linear infinite",
        }}
      />

      <div className="w-full h-full relative flex flex-col items-center justify-center z-10">
        {/* Score counter */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-orange-300 rounded-full px-6 md:px-8 py-1 md:py-2 text-xl md:text-2xl font-bold z-50">
          {foundDifferences.length} / {currentScene.differences.length}
        </div>

        {/* Main game area */}
        <div className="relative w-full h-full flex items-center justify-center px-4 md:px-8">
          <div
            className={`relative w-full transition-all duration-300`}
            style={{
              aspectRatio: "2/1",
              maxHeight: "calc(100vh - 120px)",
              maxWidth: "1200px",
              margin: "0 auto",
            }}
          >
            <div className="grid grid-cols-2 gap-4 h-full mx-auto max-w-[calc(100%-2rem)] ml-[40px]">
              {/* Left image */}
              <div
                className="relative rounded-[2rem] overflow-hidden shadow-lg [&>div]:z-30 bg-[#9370F5] p-2"
                onClick={(e) => handleImageClick(e, true)}
              >
                <div className="relative w-full h-full bg-white rounded-[1.75rem] overflow-hidden">
                  <img
                    ref={leftImageRef}
                    src={currentScene.baseImage || "/placeholder.svg"}
                    alt="Find the differences - Left"
                    className="absolute inset-0 w-full h-full object-contain"
                    draggable="false"
                  />
                </div>
                {/* Markers for found differences */}
                {foundDifferences.map((diffId) => {
                  const difference = currentScene.differences.find((d) => d.id === diffId)
                  if (!difference) return null
                  const { x, y, width, height } = scaleCoordinates(
                    difference.hitbox.x,
                    difference.hitbox.y,
                    difference.hitbox.width,
                    difference.hitbox.height,
                  )
                  return (
                    <React.Fragment key={diffId}>
                      <FoundMarker x={x + width / 2} y={y + height / 2} />
                    </React.Fragment>
                  )
                })}
              </div>

              {/* Right image */}
              <div
                className="relative rounded-[2rem] overflow-hidden shadow-lg [&>div]:z-30 bg-[#9370F5] p-2"
                onClick={(e) => handleImageClick(e, false)}
              >
                <div className="relative w-full h-full bg-white rounded-[1.75rem] overflow-hidden">
                  <img
                    ref={rightImageRef}
                    src={currentScene.modifiedImage || "/placeholder.svg"}
                    alt="Find the differences - Right"
                    className="absolute inset-0 w-full h-full object-contain"
                    draggable="false"
                  />
                </div>
                {/* Markers for found differences */}
                {foundDifferences.map((diffId) => {
                  const difference = currentScene.differences.find((d) => d.id === diffId)
                  if (!difference) return null
                  const { x, y, width, height } = scaleCoordinates(
                    difference.hitbox.x,
                    difference.hitbox.y,
                    difference.hitbox.width,
                    difference.hitbox.height,
                  )
                  return (
                    <React.Fragment key={diffId}>
                      <FoundMarker x={x + width / 2} y={y + height / 2} />
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Control buttons container */}
        <div
          className={`fixed top-0 left-0 bottom-0 flex items-start z-[60] transition-all duration-300 ${
            showSidebar ? "w-20 md:w-24 lg:w-32 bg-violet-500" : "w-14 md:w-16 lg:w-20"
          }`}
        >
          <div className="h-full flex flex-col items-center pt-4 gap-6">
            <button
              onClick={togglePause}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-violet-500 hover:bg-violet-600 flex items-center justify-center transition-colors shadow-lg"
              aria-label={showSidebar ? "Resume game" : "Pause game"}
            >
              {showSidebar ? (
                <Play className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              ) : (
                <Pause className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              )}
            </button>
            {showSidebar && (
              <>
                <button
                  onClick={toggleMute}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${
                    isMuted ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                  } flex items-center justify-center transition-colors shadow-lg`}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  ) : (
                    <Music className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  )}
                </button>
                <button
                  onClick={resetGame}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors shadow-lg"
                  aria-label="Reset game"
                >
                  <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Help button */}
        <button
          onClick={showHelp}
          className="fixed top-4 right-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg z-[60]"
          aria-label="Show help"
        >
          <HelpCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
        </button>

        {/* Hint text */}
        {currentHint && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white/90 rounded-lg px-6 py-3 text-lg font-medium shadow-lg z-50">
            {currentHint}
          </div>
        )}

        {/* Floating text for found differences */}
        {floatingText.show && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[70]">
            <div
              className="text-6xl sm:text-7xl md:text-8xl font-bold text-green-400 animate-float-fade"
              style={{
                textShadow: "4px 4px 8px rgba(128, 0, 128, 0.8), -2px -2px 4px rgba(0, 0, 0, 0.6)",
                filter: "drop-shadow(0 0 10px rgba(0, 255, 0, 0.7))",
              }}
            >
              {floatingText.text}
            </div>
          </div>
        )}

        {/* Overlays */}
        {showOverlay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80]">
            <div className="bg-white p-6 sm:p-8 rounded-xl max-w-sm w-11/12 text-center">
              {gameState === "start" && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4">Find the Differences!</h2>
                  <p className="mb-6">Compare the two images and find all differences between them.</p>
                  <button
                    onClick={startGame}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Start Game
                  </button>
                </>
              )}
              {gameState === "help" && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4">How to Play</h2>
                  <p className="mb-4">Look carefully at both images and click when you spot a difference.</p>
                  <button
                    onClick={showNextHint}
                    className="px-6 py-2 mb-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Need a Hint?
                  </button>
                  <br />
                  <button
                    onClick={() => {
                      setGameState(showSidebar ? "paused" : "playing")
                      setShowOverlay(false)
                      playAudio("uiClick")
                    }}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Got it!
                  </button>
                </>
              )}
              {gameState === "won" && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4">Congratulations!</h2>
                  <p className="mb-6">You've found all the differences!</p>
                  <button
                    onClick={resetGame}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Play Again
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SpotDifferencesGame
