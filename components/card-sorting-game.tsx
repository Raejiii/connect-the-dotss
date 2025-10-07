"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Play, RotateCcw, HelpCircle, Music, VolumeX } from "lucide-react"
import confetti from "canvas-confetti"
import { gameConfig } from "../config/game-config"

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

export function CardSortingGame() {
  const [showSplash, setShowSplash] = useState(true)

  const currentScene = useMemo(() => {
    if (gameConfig.gameType === "words") {
      return gameConfig.scenes[0]
    } else {
      return gameConfig.scenes[1] || gameConfig.scenes[0]
    }
  }, [])

  const [gameState, setGameState] = useState("start")
  const [showOverlay, setShowOverlay] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [floatingText, setFloatingText] = useState({ text: "", show: false })
  const [isSplashFading, setIsSplashFading] = useState(false)
  const [currentHint, setCurrentHint] = useState("")
  const [cardOrder, setCardOrder] = useState([])
  const [draggedCard, setDraggedCard] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [isCorrect, setIsCorrect] = useState(false)
  const [touchDraggedCard, setTouchDraggedCard] = useState(null)
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 })
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 })
  const [catWalking, setCatWalking] = useState(false)
  const [catPosition, setCatPosition] = useState(0)
  const cardRefs = useRef([])
  const audioRefs = useRef({})

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
    const shuffledCards = [...currentScene.cards].sort(() => Math.random() - 0.5)
    setCardOrder(shuffledCards)
    setGameState("start")
    setShowOverlay(true)
    setShowSidebar(false)
    setIsCorrect(false)
    setCatWalking(false)
    setCatPosition(0)
    stopAllAudio()
    setCurrentHint("")
  }

  const startGame = () => {
    setGameState("playing")
    setShowOverlay(false)
    setShowSidebar(false)
    playAudio("uiClick")
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

  const checkAnswer = () => {
    const correctOrder = currentScene.correctOrder
    const currentOrder = cardOrder.map((card) => card.id)
    const isOrderCorrect = JSON.stringify(currentOrder) === JSON.stringify(correctOrder)

    if (isOrderCorrect) {
      setIsCorrect(true)
      setGameState("won")
      playAudio("levelWin")
      playAudio("clap")
      pauseAudio("background")

      setTimeout(() => {
        setCatWalking(true)
        let progress = 0
        const walkInterval = setInterval(() => {
          progress += 1
          setCatPosition(progress)
          if (progress >= 100) {
            clearInterval(walkInterval)
            setCatWalking(false)
          }
        }, 15) // 15ms * 100 = 1500ms = 1.5 seconds
      }, 500)

      setTimeout(() => {
        playBigConfetti()
      }, 2000) // 500ms delay + 1500ms animation = 2000ms

      setFloatingText({ text: "Perfect! Well done!", show: true })
      setTimeout(() => {
        setFloatingText({ text: "", show: false })
        setShowOverlay(true)
      }, 10000)
    } else {
      playAudio("incorrect")
      setFloatingText({ text: "Not quite right, try again!", show: true })
      setTimeout(() => setFloatingText({ text: "", show: false }), 2000)
    }
  }

  const handleDragStart = (e, card, index) => {
    setDraggedCard({ card, index })
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (draggedCard && draggedCard.index !== dropIndex) {
      const newOrder = [...cardOrder]
      const [draggedItem] = newOrder.splice(draggedCard.index, 1)
      newOrder.splice(dropIndex, 0, draggedItem)
      setCardOrder(newOrder)
      playAudio("uiClick")
    }
    setDraggedCard(null)
    setDragOverIndex(null)
  }

  const handleTouchStart = (e, card, index) => {
    if (gameState !== "playing") return

    const touch = e.touches[0]
    setTouchStartPos({ x: touch.clientX, y: touch.clientY })
    setTouchPosition({ x: touch.clientX, y: touch.clientY })
    setTouchDraggedCard({ card, index })
    playAudio("effect")
  }

  const handleTouchMove = (e, index) => {
    if (!touchDraggedCard || gameState !== "playing") return

    e.preventDefault()
    const touch = e.touches[0]
    setTouchPosition({ x: touch.clientX, y: touch.clientY })

    const elements = document.elementsFromPoint(touch.clientX, touch.clientY)
    const cardElement = elements.find((el) => el.classList.contains("sortable-card"))

    if (cardElement) {
      const hoveredIndex = Number.parseInt(cardElement.dataset.index)
      if (!isNaN(hoveredIndex) && hoveredIndex !== touchDraggedCard.index) {
        setDragOverIndex(hoveredIndex)
      }
    }
  }

  const handleTouchEnd = (e) => {
    if (!touchDraggedCard || gameState !== "playing") return

    const touch = e.changedTouches[0]
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY)
    const cardElement = elements.find((el) => el.classList.contains("sortable-card"))

    if (cardElement) {
      const dropIndex = Number.parseInt(cardElement.dataset.index)

      if (!isNaN(dropIndex) && touchDraggedCard.index !== dropIndex) {
        const newOrder = [...cardOrder]
        const [draggedItem] = newOrder.splice(touchDraggedCard.index, 1)
        newOrder.splice(dropIndex, 0, draggedItem)
        setCardOrder(newOrder)
        playAudio("uiClick")
      }
    }

    setTouchDraggedCard(null)
    setDragOverIndex(null)
    setTouchPosition({ x: 0, y: 0 })
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
    if (currentScene.hint) {
      setCurrentHint(currentScene.hint)
      setTimeout(() => setCurrentHint(""), 5000)
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

  return (
    <div className="fixed inset-0 overflow-hidden animate-fade-in">
      <div className="fixed inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-sky-400 pointer-events-none" />

      {/* Falling snow particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-70"
            style={{
              width: `${Math.random() * 8 + 2}px`,
              height: `${Math.random() * 8 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              animation: `snowfall ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Mountain layers */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none">
        {/* Back mountain layer */}
        <svg
          className="absolute bottom-0 w-full"
          viewBox="0 0 1440 400"
          preserveAspectRatio="none"
          style={{ height: "400px" }}
        >
          <path d="M0,400 L0,200 L360,100 L720,200 L1080,100 L1440,200 L1440,400 Z" fill="#5B9BD5" opacity="0.6" />
          <path d="M360,100 L320,120 L400,120 Z" fill="white" opacity="0.9" />
          <path d="M1080,100 L1040,120 L1120,120 Z" fill="white" opacity="0.9" />
        </svg>

        {/* Front mountain layer */}
        <svg
          className="absolute bottom-0 w-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          style={{ height: "320px" }}
        >
          <path
            d="M0,320 L0,160 L240,80 L480,160 L720,60 L960,160 L1200,80 L1440,160 L1440,320 Z"
            fill="#4A90D9"
            opacity="0.8"
          />
          <path d="M240,80 L200,100 L280,100 Z" fill="white" opacity="0.95" />
          <path d="M720,60 L680,80 L760,80 Z" fill="white" opacity="0.95" />
          <path d="M1200,80 L1160,100 L1240,100 Z" fill="white" opacity="0.95" />
        </svg>
      </div>

      <div className="w-full h-full relative flex flex-col items-center justify-center z-10 p-4">
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2">
          <img
            src="/images/game-logo.png"
            alt="Line-Up Game"
            className="h-12 md:h-16 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-3 text-center shadow-lg max-w-2xl">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">{currentScene.question}</h2>
          </div>
        </div>

        <div className="relative w-full max-w-7xl mx-auto mt-20 mb-20">
          <div className="relative flex items-center justify-center gap-4 px-4">
            <div className="relative flex-shrink-0 z-10 -mt-32">
              <img src="/images/platform.png" alt="Platform" className="w-24 h-20 object-contain" />
              <img
                src="/images/cat.png"
                alt="Cat"
                className="absolute -top-[60px] left-1/2 w-16 h-16 object-contain transition-all duration-300 z-50"
                style={{
                  transform: catWalking ? `translateX(calc(-50% + ${catPosition * 8}px))` : "translateX(-50%)",
                }}
              />
            </div>

            <div className="flex justify-center gap-3 min-h-[280px] items-center flex-1 relative z-0">
              {cardOrder.map((card, index) => (
                <div
                  key={card.id}
                  ref={(el) => (cardRefs.current[index] = el)}
                  data-index={index}
                  draggable={gameState === "playing"}
                  onDragStart={(e) => handleDragStart(e, card, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onTouchStart={(e) => handleTouchStart(e, card, index)}
                  onTouchMove={(e) => handleTouchMove(e, index)}
                  onTouchEnd={handleTouchEnd}
                  className={`
                    sortable-card relative bg-white rounded-xl shadow-lg overflow-hidden cursor-move transition-all duration-500
                    ${gameConfig.gameType === "words" ? "w-32 h-24 sm:w-36 sm:h-28 md:w-40 md:h-32" : "w-32 h-40 sm:w-36 sm:h-44 md:w-40 md:h-48"} flex-shrink-0
                    ${gameState === "playing" ? "hover:shadow-xl hover:scale-105 active:scale-110 active:shadow-2xl" : ""}
                    ${dragOverIndex === index ? "ring-4 ring-blue-400 scale-105" : ""}
                    ${touchDraggedCard?.index === index ? "opacity-50 scale-110" : ""}
                    ${isCorrect ? "ring-4 ring-green-400" : ""}
                  `}
                  style={{
                    transform: isCorrect ? "translateY(0)" : index % 2 === 0 ? "translateY(-40px)" : "translateY(40px)",
                    touchAction: gameState === "playing" ? "none" : "auto",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                  }}
                >
                  {gameConfig.gameType !== "words" && (
                    <div className="h-24 sm:h-28 md:h-32 relative overflow-hidden">
                      <img
                        src={card.image || "/placeholder.svg"}
                        alt={card.name}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                      />
                      {isCorrect && (
                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                          <img src="/images/done-button.png" alt="Done" className="w-12 h-12 object-contain" />
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    className={`text-center flex items-center justify-center ${gameConfig.gameType === "words" ? "flex-1 p-4" : "p-2 flex-1"}`}
                  >
                    <h3
                      className={`font-bold text-gray-800 leading-tight pointer-events-none ${gameConfig.gameType === "words" ? "text-2xl sm:text-3xl md:text-4xl" : "text-xs sm:text-sm font-semibold"}`}
                    >
                      {card.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative flex-shrink-0 z-10 -mt-32">
              <img src="/images/platform.png" alt="Platform" className="w-24 h-20 object-contain" />
              <img
                src="/images/ice-cream.png"
                alt="Ice Cream"
                className="absolute -top-[60px] left-1/2 transform -translate-x-1/2 w-16 h-16 object-contain z-50"
              />
            </div>
          </div>
        </div>

        {touchDraggedCard && (
          <div
            className="fixed pointer-events-none z-[100] transition-transform duration-100"
            style={{
              left: touchPosition.x - 80,
              top: touchPosition.y - 100,
              transform: "scale(1.1) rotate(5deg)",
            }}
          >
            <div
              className={`bg-white rounded-xl shadow-2xl overflow-hidden ${gameConfig.gameType === "words" ? "w-32 h-24 sm:w-36 sm:h-28" : "w-32 h-40 sm:w-36 sm:h-44 md:w-40 md:h-48"} opacity-90 ring-4 ring-blue-400`}
            >
              {gameConfig.gameType !== "words" && (
                <div className="h-24 sm:h-28 relative overflow-hidden">
                  <img
                    src={touchDraggedCard.card.image || "/placeholder.svg"}
                    alt={touchDraggedCard.card.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div
                className={`text-center flex items-center justify-center ${gameConfig.gameType === "words" ? "flex-1 p-4" : "p-2 flex-1"}`}
              >
                <h3
                  className={`font-bold text-gray-800 leading-tight ${gameConfig.gameType === "words" ? "text-2xl sm:text-3xl" : "text-xs sm:text-sm font-semibold"}`}
                >
                  {touchDraggedCard.card.name}
                </h3>
              </div>
            </div>
          </div>
        )}

        {gameState === "playing" && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
            <button onClick={checkAnswer} className="hover:scale-105 transition-transform" aria-label="Check answer">
              <img src="/images/done-button.png" alt="Done" className="w-24 h-16 object-contain drop-shadow-lg" />
            </button>
          </div>
        )}

        {showSidebar && (
          <div className="fixed top-0 left-0 bottom-0 flex items-start z-[60] transition-all duration-300 w-20 md:w-24 lg:w-32 bg-violet-500">
            <div className="h-full flex flex-col items-center pt-4 gap-6">
              <button
                onClick={togglePause}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-violet-500 hover:bg-violet-600 flex items-center justify-center transition-colors shadow-lg"
                aria-label="Resume game"
              >
                <Play className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </button>
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
            </div>
          </div>
        )}

        <button
          onClick={showHelp}
          className="fixed top-4 right-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg z-[60]"
          aria-label="Show help"
        >
          <HelpCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
        </button>

        {currentHint && (
          <div className="fixed top-32 left-1/2 transform -translate-x-1/2 bg-yellow-100 border-2 border-yellow-400 rounded-lg px-6 py-3 text-lg font-medium shadow-lg z-50 max-w-md text-center">
            💡 {currentHint}
          </div>
        )}

        {floatingText.show && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[70]">
            <div
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-blue-600 animate-float-fade"
              style={{
                textShadow: "4px 4px 8px rgba(0, 0, 0, 0.3), -2px -2px 4px rgba(255, 255, 255, 0.8)",
                filter: "drop-shadow(0 0 10px rgba(59, 130, 246, 0.7))",
              }}
            >
              {floatingText.text}
            </div>
          </div>
        )}

        {showOverlay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80]">
            <div className="bg-white p-6 sm:p-8 rounded-xl max-w-sm w-11/12 text-center">
              {gameState === "start" && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4">Card Sorting Game!</h2>
                  <p className="mb-6">Drag and drop the cards to sort them according to the question above.</p>
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
                  <p className="mb-4">
                    Read the question at the top, then drag and drop the cards to arrange them in the correct order.
                  </p>
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
                  <p className="mb-6">You've sorted the cards correctly!</p>
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
