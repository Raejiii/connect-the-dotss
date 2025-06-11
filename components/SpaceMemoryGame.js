"use client"

import React, { useState, useEffect, useRef } from "react"
import { Pause, Play, RotateCcw, HelpCircle, Music, VolumeX } from "lucide-react"
import confetti from "canvas-confetti"
import gameConfig from "../config/game-config.json"

export function SpaceMemoryGame() {
  const [showSplash, setShowSplash] = useState(true)
  const [gameState, setGameState] = useState("start")
  const [showOverlay, setShowOverlay] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [floatingText, setFloatingText] = useState({ text: "", show: false })
  const [isSplashFading, setIsSplashFading] = useState(false)
  const [shuffledItems, setShuffledItems] = useState([])
  const [matchedPairs, setMatchedPairs] = useState([])
  const [currentLine, setCurrentLine] = useState(null)
  const [lines, setLines] = useState([])
  const audioRefs = useRef({})
  const gameGridRef = useRef(null)
  const svgRef = useRef(null)

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsSplashFading(true)
    }, gameConfig.splashScreen.duration - 500)

    const removeTimer = setTimeout(() => {
      setShowSplash(false)
    }, gameConfig.splashScreen.duration)

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

  const playAudio = (name, loop = false) => {
    if (!isMuted) {
      if (!audioRefs.current[name]) {
        audioRefs.current[name] = new Audio(gameConfig.audio[name])
        audioRefs.current[name].loop = loop
      }
      audioRefs.current[name].play().catch((error) => {
        console.error(`Error playing audio ${name}:`, error)
      })
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
    const shuffled = [...gameConfig.gameItems, ...gameConfig.gameItems]
      .sort(() => Math.random() - 0.5)
      .map((item, index) => ({ ...item, position: index }))
    setShuffledItems(shuffled)
    setMatchedPairs([])
    setLines([])
    setGameState("start")
    setShowOverlay(true)
    setShowSidebar(false)
    stopAllAudio()
  }

  const startGame = () => {
    setGameState("playing")
    setShowOverlay(false)
    setShowSidebar(false)
    playAudio("uiClick")
    playAudio("findObject")
  }

  const playConfetti = (cardElement) => {
    if (cardElement && gameGridRef.current) {
      const rect = cardElement.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2

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

  const handleLineStart = (item) => {
    if (gameState !== "playing") return
    const position = getCardPosition(item.position)
    setCurrentLine({ start: position, end: position, item })
  }

  const handleLineMove = (e) => {
    if (!currentLine) return
    const svgRect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - svgRect.left
    const y = e.clientY - svgRect.top
    setCurrentLine({ ...currentLine, end: { x, y } })
  }

  const handleLineEnd = (item) => {
    if (!currentLine || gameState !== "playing") return

    if (currentLine.item.id === item.id && currentLine.item.position !== item.position) {
      // Match found
      const newLine = {
        start: getCardPosition(currentLine.item.position),
        end: getCardPosition(item.position),
        id: currentLine.item.id,
      }
      setLines([...lines, newLine])
      setMatchedPairs([...matchedPairs, currentLine.item.id])
      playAudio("success")
      playConfetti(document.getElementById(`card-${item.position}`))
      setFloatingText({ text: "Match!", show: true })
      setTimeout(() => {
        setFloatingText({ text: "", show: false })
      }, 1000)

      if (matchedPairs.length + 1 === gameConfig.gameItems.length) {
        // Game won
        setGameState("won")
        playAudio("levelWin")
        playAudio("clap")
        pauseAudio("background")
        playBigConfetti()
        setTimeout(() => {
          setShowOverlay(true)
        }, 1500)
      }
    } else {
      // No match
      playAudio("incorrect")
      setFloatingText({ text: "Try again!", show: true })
      setTimeout(() => {
        setFloatingText({ text: "", show: false })
      }, 1000)
    }

    setCurrentLine(null)
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

  const getCardPosition = (position) => {
    if (!gameGridRef.current) return { x: 0, y: 0 }
    const gridRect = gameGridRef.current.getBoundingClientRect()
    const cardWidth = gridRect.width / 4
    const cardHeight = gridRect.height / 4
    const row = Math.floor(position / 4)
    const col = position % 4
    return {
      x: col * cardWidth + cardWidth / 2,
      y: row * cardHeight + cardHeight / 2,
    }
  }

  const handleTouchStart = (e, item) => {
    e.preventDefault() // Prevent default touch behaviors
    if (gameState !== "playing") return
    const touch = e.touches[0]
    const position = getCardPosition(item.position)
    setCurrentLine({ start: position, end: position, item })
  }

  const handleTouchMove = (e) => {
    e.preventDefault() // Prevent default touch behaviors
    if (!currentLine || !svgRef.current) return
    const touch = e.touches[0]
    const svgRect = svgRef.current.getBoundingClientRect()
    const x = touch.clientX - svgRect.left
    const y = touch.clientY - svgRect.top
    setCurrentLine({ ...currentLine, end: { x, y } })
  }

  const handleTouchEnd = (e, item) => {
    e.preventDefault() // Prevent default touch behaviors
    if (!currentLine || gameState !== "playing") return

    if (currentLine.item.id === item.id && currentLine.item.position !== item.position) {
      // Match found
      const newLine = {
        start: getCardPosition(currentLine.item.position),
        end: getCardPosition(item.position),
        id: currentLine.item.id,
      }
      setLines([...lines, newLine])
      setMatchedPairs([...matchedPairs, currentLine.item.id])
      playAudio("success")
      playConfetti(document.getElementById(`card-${item.position}`))
      setFloatingText({ text: "Match!", show: true })
      setTimeout(() => {
        setFloatingText({ text: "", show: false })
      }, 1000)

      if (matchedPairs.length + 1 === gameConfig.gameItems.length) {
        // Game won
        setGameState("won")
        playAudio("levelWin")
        playAudio("clap")
        pauseAudio("background")
        playBigConfetti()
        setTimeout(() => {
          setShowOverlay(true)
        }, 1500)
      }
    } else {
      // No match
      playAudio("incorrect")
      setFloatingText({ text: "Try again!", show: true })
      setTimeout(() => {
        setFloatingText({ text: "", show: false })
      }, 1000)
    }

    setCurrentLine(null)
  }

  if (showSplash) {
    return (
      <div
        className={`fixed inset-0 bg-white flex items-center justify-center ${isSplashFading ? "animate-fade-out" : ""}`}
      >
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

  return (
    <div className="fixed inset-0 overflow-hidden animate-fade-in">
      <div
        className="fixed inset-0 bg-[#000B18] pointer-events-none"
        style={{
          backgroundImage: `\
  radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px),\
  radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 30px),\
  radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 40px),\
  radial-gradient(rgba(255,255,255,.4), rgba(255,255,255,.1) 2px, transparent 30px)\
`,
          backgroundSize: "550px 550px, 350px 350px, 250px 250px, 150px 150px",
          backgroundPosition: "0 0, 40px 60px, 130px 270px, 70px 100px",
          animation: "backgroundScroll 60s linear infinite",
        }}
      />

      <div className="w-full h-full relative flex flex-col items-center justify-center z-10 px-4">
        <div
          ref={gameGridRef}
          className="relative w-[calc(100%-7rem)] sm:w-[calc(100%-9rem)] max-w-[min(90vw,90vh)] max-h-[90vh] aspect-square mx-auto z-20 transition-all duration-300"
          style={{ touchAction: "none" }}
          onMouseMove={handleLineMove}
          onMouseUp={() => setCurrentLine(null)}
          onMouseLeave={() => setCurrentLine(null)}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setCurrentLine(null)}
          onTouchCancel={() => setCurrentLine(null)}
        >
          <div
            className="grid w-full h-full gap-2 relative"
            style={{
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gridTemplateRows: "repeat(4, minmax(0, 1fr))",
              touchAction: "none",
            }}
          >
            {shuffledItems.map((item, index) => (
              <button
                key={index}
                id={`card-${item.position}`}
                onMouseDown={() => handleLineStart(item)}
                onMouseUp={() => handleLineEnd(item)}
                onTouchStart={(e) => handleTouchStart(e, item)}
                onTouchEnd={(e) => handleTouchEnd(e, item)}
                className={`aspect-square w-full h-full rounded-xl transition-all duration-300 transform shadow-lg
                  hover:shadow-xl hover:-translate-y-1 active:translate-y-0 cursor-pointer
                  relative overflow-hidden bg-violet-500 touch-none ${
                    matchedPairs.includes(item.id) ? "bg-green-500" : ""
                  }`}
                disabled={gameState !== "playing" || matchedPairs.includes(item.id)}
                aria-label={`Card ${item.alt}`}
                style={{ touchAction: "none" }}
              >
                <div className="w-full h-full flex items-center justify-center transition-all duration-300 bg-white rounded-xl">
                  <img
                    src={item.src || `/placeholder.svg?height=100&width=100`}
                    alt={item.alt}
                    className="w-3/4 h-3/4 object-contain"
                    draggable="false"
                  />
                </div>
              </button>
            ))}
          </div>
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ touchAction: "none" }}
          >
            {lines.map((line, index) => (
              <line
                key={`line-${index}`}
                x1={line.start.x}
                y1={line.start.y}
                x2={line.end.x}
                y2={line.end.y}
                stroke="yellow"
                strokeWidth="4"
              />
            ))}
            {currentLine && (
              <line
                x1={currentLine.start.x}
                y1={currentLine.start.y}
                x2={currentLine.end.x}
                y2={currentLine.end.y}
                stroke="yellow"
                strokeWidth="4"
              />
            )}
          </svg>
        </div>

        <div
          className={`fixed top-4 left-4 bottom-0 flex items-start z-[60] transition-all duration-300 ${
            showSidebar ? "w-16 sm:w-20 bg-violet-500" : "w-12 sm:w-16"
          }`}
        >
          <div className="h-full flex flex-col items-center gap-6">
            <button
              onClick={togglePause}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-violet-500 hover:bg-violet-600 flex items-center justify-center transition-colors shadow-lg touch-none"
              aria-label={showSidebar ? "Resume game" : "Pause game"}
              disabled={gameState === "won"}
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
                  } flex items-center justify-center transition-colors shadow-lg touch-none`}
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
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors shadow-lg touch-none"
                  aria-label="Reset game"
                >
                  <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </button>
              </>
            )}
          </div>
        </div>

        <button
          onClick={showHelp}
          className="fixed top-4 right-4 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg touch-none z-[60]"
          aria-label="Show help"
        >
          <HelpCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
        </button>

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

        {showOverlay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80]">
            <div className="bg-white p-6 sm:p-8 rounded-xl max-w-sm w-11/12 text-center">
              {gameState === "start" && (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4">{gameConfig.gameTitle}</h2>
                  <p className="mb-6">{gameConfig.instructions}</p>
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
                  <p className="mb-6">{gameConfig.instructions}</p>
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
                  <p className="mb-6">You've matched all the space objects!</p>
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

export default SpaceMemoryGame
