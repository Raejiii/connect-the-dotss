"use client"

import { useState, useEffect, useRef } from "react"
import { Pause, Play, RotateCcw, HelpCircle, Music, VolumeX, SkipForward } from "lucide-react"
import confetti from "canvas-confetti"
import gameConfig from "../config/game-config.json"

export function ConnectTheDotsGame() {
  const [showSplash, setShowSplash] = useState(true)
  const [gameState, setGameState] = useState("start")
  const [showOverlay, setShowOverlay] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [floatingText, setFloatingText] = useState({ text: "", show: false })
  const [isSplashFading, setIsSplashFading] = useState(false)
  const [currentShapeIndex, setCurrentShapeIndex] = useState(0)
  const [currentShape, setCurrentShape] = useState(gameConfig.shapes[0]) // Initialize with first shape
  const [connectedDots, setConnectedDots] = useState([])
  const [lines, setLines] = useState([])
  const [currentLine, setCurrentLine] = useState(null)
  const [nextDotNumber, setNextDotNumber] = useState(1)
  const [isShapeComplete, setIsShapeComplete] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startDot, setStartDot] = useState(null)
  const audioRefs = useRef({})
  const gameAreaRef = useRef(null)
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
    setCurrentShapeIndex(0)
    loadShape(0)
    setGameState("start")
    setShowOverlay(true)
    setShowSidebar(false)
    stopAllAudio()
  }

  const loadShape = (shapeIndex) => {
    if (!gameConfig.shapes || !gameConfig.shapes[shapeIndex]) {
      console.error("Shape not found at index:", shapeIndex)
      return
    }

    const shape = gameConfig.shapes[shapeIndex]
    setCurrentShape(shape)
    setConnectedDots([])
    setLines([])
    setCurrentLine(null)
    setNextDotNumber(1)
    setIsShapeComplete(false)
    setIsDrawing(false)
    setStartDot(null)
  }

  const nextShape = () => {
    if (!gameConfig.shapes || !gameConfig.shapes.length) return

    const nextIndex = (currentShapeIndex + 1) % gameConfig.shapes.length
    setCurrentShapeIndex(nextIndex)
    loadShape(nextIndex)
    playAudio("uiClick")
  }

  const startGame = () => {
    setGameState("playing")
    setShowOverlay(false)
    setShowSidebar(false)
    playAudio("uiClick")
    playAudio("start")
  }

  const playConfetti = () => {
    const duration = 3 * 1000
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

      const particleCount = 50 * (timeLeft / duration)

      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        }),
      )
    }, 250)
  }

  const getDotPosition = (dot) => {
    if (!gameAreaRef.current) return { x: 0, y: 0 }
    const rect = gameAreaRef.current.getBoundingClientRect()
    return {
      x: (dot.x / 100) * rect.width,
      y: (dot.y / 100) * rect.height,
    }
  }

  const getEventPoint = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
    }
    return { x: e.clientX, y: e.clientY }
  }

  const getTouchedDot = (point) => {
    if (!gameAreaRef.current || !currentShape) return null
    const rect = gameAreaRef.current.getBoundingClientRect()
    const relativeX = ((point.x - rect.left) / rect.width) * 100
    const relativeY = ((point.y - rect.top) / rect.height) * 100

    return currentShape.dots.find((dot) => {
      const distance = Math.sqrt(Math.pow(dot.x - relativeX, 2) + Math.pow(dot.y - relativeY, 2))
      return distance < 8 // 8% tolerance for touch
    })
  }

  const handleDotClick = (dot) => {
    if (gameState !== "playing" || isShapeComplete || !currentShape) return

    if (!isDrawing) {
      // Start drawing from this dot
      if (dot.number === nextDotNumber) {
        setIsDrawing(true)
        setStartDot(dot)
        const position = getDotPosition(dot)
        setCurrentLine({ start: position, end: position, startDot: dot })
        playAudio("connect")
      } else {
        playAudio("incorrect")
        setFloatingText({ text: `Start with dot ${nextDotNumber}!`, show: true })
        setTimeout(() => {
          setFloatingText({ text: "", show: false })
        }, 1000)
      }
    } else {
      // End drawing at this dot
      if (dot.number === nextDotNumber + 1 || (nextDotNumber === currentShape.dots.length && dot.number === 1)) {
        // Correct connection
        const startPosition = getDotPosition(startDot)
        const endPosition = getDotPosition(dot)

        setLines((prev) => [...prev, { start: startPosition, end: endPosition }])
        setConnectedDots((prev) => [...prev, startDot.number])

        if (dot.number === 1 && nextDotNumber === currentShape.dots.length) {
          // Shape completed (connected back to start)
          setConnectedDots((prev) => [...prev, startDot.number])
          setIsShapeComplete(true)
          playAudio("success")
          playAudio("levelWin")
          playConfetti()
          setFloatingText({ text: `${currentShape.name} Complete!`, show: true })
          setTimeout(() => {
            setFloatingText({ text: "", show: false })
          }, 2000)
        } else {
          setNextDotNumber(dot.number)
        }

        setIsDrawing(false)
        setStartDot(null)
        setCurrentLine(null)
        playAudio("connect")
      } else {
        // Wrong connection
        playAudio("incorrect")
        const expectedNext = nextDotNumber === currentShape.dots.length ? 1 : nextDotNumber + 1
        setFloatingText({ text: `Connect to dot ${expectedNext}!`, show: true })
        setTimeout(() => {
          setFloatingText({ text: "", show: false })
        }, 1000)
      }
    }
  }

  const handleInteractionStart = (e) => {
    e.preventDefault()
    if (gameState !== "playing" || isShapeComplete) return
    const point = getEventPoint(e)
    const dot = getTouchedDot(point)
    if (dot) {
      handleDotClick(dot)
    }
  }

  const handleInteractionMove = (e) => {
    e.preventDefault()
    if (!currentLine || !svgRef.current || !isDrawing) return
    const svgRect = svgRef.current.getBoundingClientRect()
    const point = getEventPoint(e)
    const x = point.x - svgRect.left
    const y = point.y - svgRect.top
    setCurrentLine({ ...currentLine, end: { x, y } })
  }

  const handleInteractionEnd = (e) => {
    e.preventDefault()
    if (!currentLine || !isDrawing) return
    const point = getEventPoint(e)
    const dot = getTouchedDot(point)
    if (dot && dot !== startDot) {
      handleDotClick(dot)
    } else {
      // Cancel the current line if not ending on a valid dot
      setCurrentLine(null)
      setIsDrawing(false)
      setStartDot(null)
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

  // Safety check for currentShape
  if (!currentShape) {
    console.error("Current shape is null")
    return (
      <div className="fixed inset-0 bg-[#000B18] flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
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
        {/* Game Title */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">
            {isShapeComplete ? `${currentShape.name} Complete!` : "Connect the Dots"}
          </h1>
          <p className="text-sm sm:text-base text-white/80 text-center mt-1">
            {isDrawing
              ? `Drawing from dot ${startDot?.number}...`
              : nextDotNumber > currentShape.dots.length
                ? "Connect back to dot 1 to finish!"
                : `Next: Connect dot ${nextDotNumber}`}
          </p>
        </div>

        <div
          ref={gameAreaRef}
          className="relative w-[calc(100%-7rem)] sm:w-[calc(100%-9rem)] max-w-[min(90vw,90vh)] max-h-[90vh] aspect-square mx-auto z-20 transition-all duration-300 bg-white/10 rounded-xl backdrop-blur-sm"
          style={{ touchAction: "none" }}
          onMouseDown={handleInteractionStart}
          onMouseMove={handleInteractionMove}
          onMouseUp={handleInteractionEnd}
          onMouseLeave={handleInteractionEnd}
          onTouchStart={handleInteractionStart}
          onTouchMove={handleInteractionMove}
          onTouchEnd={handleInteractionEnd}
        >
          {/* Dots */}
          {currentShape.dots
            .filter((dot, index, array) => {
              // Remove duplicate dots (like the closing dot that returns to start)
              return index === array.findIndex((d) => d.x === dot.x && d.y === dot.y)
            })
            .map((dot, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(dot)}
                className={`absolute w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold transition-all duration-300 transform hover:scale-110 ${
                  connectedDots.includes(dot.number)
                    ? "bg-green-500 text-white shadow-lg scale-110"
                    : dot.number === nextDotNumber && !isDrawing
                      ? "bg-yellow-400 text-black shadow-lg animate-pulse"
                      : isDrawing && startDot?.number === dot.number
                        ? "bg-blue-500 text-white shadow-lg scale-110"
                        : "bg-white text-black shadow-md hover:bg-gray-100"
                }`}
                style={{
                  left: `${dot.x}%`,
                  top: `${dot.y}%`,
                  transform: `translate(-50%, -50%) ${connectedDots.includes(dot.number) || dot.number === nextDotNumber ? "scale(1.1)" : "scale(1)"}`,
                  touchAction: "none",
                }}
                disabled={gameState !== "playing" || isShapeComplete}
                aria-label={`Dot number ${dot.number}`}
              >
                {dot.number}
              </button>
            ))}

          {/* SVG for lines */}
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
                stroke="#22c55e"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ))}
            {currentLine && isDrawing && (
              <line
                x1={currentLine.start.x}
                y1={currentLine.start.y}
                x2={currentLine.end.x}
                y2={currentLine.end.y}
                stroke="#eab308"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="5,5"
              />
            )}
          </svg>
        </div>

        {/* Control buttons */}
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
                <button
                  onClick={nextShape}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors shadow-lg touch-none"
                  aria-label="Next shape"
                >
                  <SkipForward className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
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
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-green-400 animate-float-fade"
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
                  <p className="mb-6 text-sm text-gray-600">
                    Click and drag from one numbered dot to the next to draw lines and reveal the hidden shape!
                  </p>
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConnectTheDotsGame
