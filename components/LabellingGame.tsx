"use client"

import { useState, useEffect, useRef } from "react"
import { Pause, Play, RotateCcw, HelpCircle, Music, VolumeX, SkipForward } from "lucide-react"
import confetti from "canvas-confetti"
import { gameConfig } from "../config/game-config"
import { useRouter } from "next/navigation"

export function LabellingGame() {
  const [showSplash, setShowSplash] = useState(true)
  const [gameState, setGameState] = useState("start")
  const [showOverlay, setShowOverlay] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [floatingText, setFloatingText] = useState({ text: "", show: false })
  const [isSplashFading, setIsSplashFading] = useState(false)
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0)
  const [currentScenario, setCurrentScenario] = useState(gameConfig.scenarios[0])
  const [placedLabels, setPlacedLabels] = useState({})
  const [draggedLabel, setDraggedLabel] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [isComplete, setIsComplete] = useState(false)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [totalLevels] = useState(gameConfig.scenarios.length)
  const [difficulty, setDifficulty] = useState("all")
  const [filteredScenarios, setFilteredScenarios] = useState(gameConfig.scenarios)
  const [eKeyPresses, setEKeyPresses] = useState([])
  const audioRefs = useRef({})
  const gameAreaRef = useRef(null)
  const labelsAreaRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key.toLowerCase() === "e") {
        const now = Date.now()
        setEKeyPresses((prev) => {
          // Keep only presses from the last 2 seconds
          const recentPresses = prev.filter((time) => now - time < 2000)
          const newPresses = [...recentPresses, now]

          // If we have 5 presses in 2 seconds, navigate to editor
          if (newPresses.length >= 5) {
            router.push("/editor")
            return []
          }

          return newPresses
        })
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [router])

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

  useEffect(() => {
    if (difficulty === "all") {
      setFilteredScenarios(gameConfig.scenarios)
    } else {
      setFilteredScenarios(gameConfig.scenarios.filter((scenario) => scenario.difficulty === difficulty))
    }
  }, [difficulty])

  const playAudio = (name, loop = false) => {
    if (!isMuted) {
      if (!audioRefs.current[name]) {
        audioRefs.current[name] = new Audio(gameConfig.audio[name])
        audioRefs.current[name].loop = loop
      }

      if (audioRefs.current[name].paused || name === "connect") {
        if (name === "connect") {
          audioRefs.current[name].currentTime = 0
        }
        audioRefs.current[name].play().catch((error) => {
          console.error(`Error playing audio ${name}:`, error)
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
    setCurrentScenarioIndex(0)
    setCurrentLevel(1)
    loadScenario(0)
    setGameState("start")
    setShowOverlay(true)
    setShowSidebar(false)
    stopAllAudio()
  }

  const loadScenario = (scenarioIndex) => {
    const scenariosToUse = filteredScenarios.length > 0 ? filteredScenarios : gameConfig.scenarios
    if (!scenariosToUse || !scenariosToUse[scenarioIndex]) {
      console.error("Scenario not found at index:", scenarioIndex)
      return
    }

    const scenario = scenariosToUse[scenarioIndex]
    setCurrentScenario(scenario)
    setPlacedLabels({})
    setDraggedLabel(null)
    setIsComplete(false)
  }

  const nextScenario = () => {
    const scenariosToUse = filteredScenarios.length > 0 ? filteredScenarios : gameConfig.scenarios
    if (!scenariosToUse || !scenariosToUse.length) return

    const nextIndex = (currentScenarioIndex + 1) % scenariosToUse.length
    setCurrentScenarioIndex(nextIndex)
    setCurrentLevel(nextIndex + 1)
    loadScenario(nextIndex)
    playAudio("uiClick")
  }

  const autoAdvanceToNextLevel = () => {
    const scenariosToUse = filteredScenarios.length > 0 ? filteredScenarios : gameConfig.scenarios
    if (!scenariosToUse || !scenariosToUse.length) return

    if (currentScenarioIndex + 1 < scenariosToUse.length) {
      setTimeout(() => {
        const nextIndex = currentScenarioIndex + 1
        setCurrentScenarioIndex(nextIndex)
        setCurrentLevel(nextIndex + 1)
        loadScenario(nextIndex)
        setGameState("playing")
        setShowOverlay(false)
        playAudio("uiClick")

        setFloatingText({ text: `Level ${nextIndex + 1}!`, show: true })
        setTimeout(() => {
          setFloatingText({ text: "", show: false })
        }, 2000)
      }, 3000)
    } else {
      setTimeout(() => {
        setGameState("allComplete")
        setShowOverlay(true)
      }, 3000)
    }
  }

  const setDifficultyLevel = (newDifficulty) => {
    setDifficulty(newDifficulty)
    setCurrentScenarioIndex(0)
    setCurrentLevel(1)

    setTimeout(() => {
      loadScenario(0)
    }, 100)

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

  const getEventPoint = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
    }
    return { x: e.clientX, y: e.clientY }
  }

  const handleLabelDragStart = (e, label) => {
    e.preventDefault()
    const point = getEventPoint(e)
    const labelElement = e.currentTarget
    const rect = labelElement.getBoundingClientRect()

    setDraggedLabel(label)
    setDragOffset({
      x: point.x - rect.left,
      y: point.y - rect.top,
    })
    setDragPosition({
      x: point.x - dragOffset.x,
      y: point.y - dragOffset.y,
    })
    playAudio("connect")
  }

  const handleDragMove = (e) => {
    e.preventDefault()
    if (!draggedLabel) return

    const point = getEventPoint(e)
    setDragPosition({
      x: point.x - dragOffset.x,
      y: point.y - dragOffset.y,
    })
  }

  const handleDragEnd = (e) => {
    e.preventDefault()
    if (!draggedLabel || !gameAreaRef.current) return

    const point = getEventPoint(e)
    const gameRect = gameAreaRef.current.getBoundingClientRect()

    const relativeX = ((point.x - gameRect.left) / gameRect.width) * 100
    const relativeY = ((point.y - gameRect.top) / gameRect.height) * 100

    let closestPosition = null
    let minDistance = Number.POSITIVE_INFINITY

    currentScenario.labelPositions.forEach((position) => {
      const distance = Math.sqrt(Math.pow(position.x - relativeX, 2) + Math.pow(position.y - relativeY, 2))
      if (distance < minDistance && distance < 15) {
        minDistance = distance
        closestPosition = position
      }
    })

    if (closestPosition && closestPosition.label === draggedLabel) {
      setPlacedLabels((prev) => ({
        ...prev,
        [draggedLabel]: closestPosition,
      }))
      playAudio("success")

      const newPlacedLabels = { ...placedLabels, [draggedLabel]: closestPosition }
      if (Object.keys(newPlacedLabels).length === currentScenario.labels.length) {
        setIsComplete(true)
        playAudio("levelWin")
        playConfetti()
        setFloatingText({ text: `${currentScenario.name} Complete!`, show: true })
        setTimeout(() => {
          setFloatingText({ text: "", show: false })
        }, 2000)
        autoAdvanceToNextLevel()
      }
    } else if (closestPosition) {
      playAudio("incorrect")
      setFloatingText({ text: "Try again!", show: true })
      setTimeout(() => {
        setFloatingText({ text: "", show: false })
      }, 1500)
    } else {
      playAudio("incorrect")
    }

    setDraggedLabel(null)
    setDragOffset({ x: 0, y: 0 })
    setDragPosition({ x: 0, y: 0 })
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

  if (!currentScenario) {
    console.error("Current scenario is null")
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
          backgroundImage: `
  radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px),
  radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 30px),
  radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 40px),
  radial-gradient(rgba(255,255,255,.4), rgba(255,255,255,.1) 2px, transparent 30px)
`,
          backgroundSize: "550px 550px, 350px 350px, 250px 250px, 150px 150px",
          backgroundPosition: "0 0, 40px 60px, 130px 270px, 70px 100px",
          animation: "backgroundScroll 60s linear infinite",
        }}
      />

      <div className="w-full h-full relative flex flex-col items-center justify-center z-10 px-4">
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">
            {isComplete ? `${currentScenario.name} Complete!` : currentScenario.title}
          </h1>
          <div className="flex items-center justify-center gap-4 mt-1">
            <p className="text-sm sm:text-base text-white/80 text-center">
              Level {currentLevel} of {filteredScenarios.length} • {currentScenario.difficulty?.toUpperCase() || "EASY"}
            </p>
            <span
              className={`px-2 py-1 rounded text-xs font-bold ${
                currentScenario.difficulty === "easy"
                  ? "bg-green-500 text-white"
                  : currentScenario.difficulty === "medium"
                    ? "bg-yellow-500 text-black"
                    : "bg-red-500 text-white"
              }`}
            >
              {currentScenario.difficulty?.toUpperCase() || "EASY"}
            </span>
          </div>
          <p className="text-sm sm:text-base text-white/80 text-center mt-1">
            {isComplete
              ? "Great job! Moving to next level..."
              : `Drag labels to correct positions (${Object.keys(placedLabels).length}/${currentScenario.labels.length})`}
          </p>
        </div>

        <div className="flex w-full max-w-6xl gap-4 items-center justify-center">
          <div
            ref={gameAreaRef}
            className="relative w-[60%] max-w-[500px] aspect-square mx-auto z-20 transition-all duration-300 bg-white/10 rounded-xl backdrop-blur-sm"
            style={{ touchAction: "none" }}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            <img
              src={currentScenario.image || "/placeholder.svg"}
              alt={currentScenario.title}
              className="w-full h-full object-contain rounded-xl"
            />

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {currentScenario.labelPositions.map((position) => {
                console.log(
                  `[v0] Drawing line for ${position.label}: from (${position.x}%, ${position.y}%) to (${position.targetX}%, ${position.targetY}%)`,
                )
                return (
                  <line
                    key={`line-${position.id}`}
                    x1={`${position.x}%`}
                    y1={`${position.y}%`}
                    x2={`${position.targetX}%`}
                    y2={`${position.targetY}%`}
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray={placedLabels[position.label] ? "0" : "5,5"}
                    className="transition-all duration-300"
                  />
                )
              })}
            </svg>

            {currentScenario.labelPositions.map((position) => (
              <div
                key={position.id}
                className={`absolute w-20 h-8 rounded border-2 border-dashed transition-all duration-300 ${
                  placedLabels[position.label] ? "bg-green-500/20 border-green-500" : "bg-black/50 border-white/50"
                }`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}

            {Object.entries(placedLabels).map(([label, position]) => (
              <div
                key={`placed-${label}`}
                className="absolute bg-white text-black px-2 py-1 rounded text-sm font-bold shadow-lg"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {label}
              </div>
            ))}
          </div>

          <div
            ref={labelsAreaRef}
            className="w-[30%] max-w-[200px] flex flex-col gap-3 p-4 bg-white/10 rounded-xl backdrop-blur-sm"
          >
            <h3 className="text-white font-bold text-center mb-2">Labels</h3>
            {currentScenario.labels
              .filter((label) => !placedLabels[label])
              .map((label) => (
                <div
                  key={label}
                  className="bg-white text-black px-3 py-2 rounded text-sm font-bold cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl transition-shadow"
                  onMouseDown={(e) => handleLabelDragStart(e, label)}
                  onTouchStart={(e) => handleLabelDragStart(e, label)}
                  style={{ touchAction: "none" }}
                >
                  {label}
                </div>
              ))}
          </div>
        </div>

        {draggedLabel && (
          <div
            className="fixed bg-white text-black px-3 py-2 rounded text-sm font-bold shadow-xl pointer-events-none z-[100]"
            style={{
              left: `${dragPosition.x}px`,
              top: `${dragPosition.y}px`,
              touchAction: "none",
            }}
          >
            {draggedLabel}
          </div>
        )}

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
                  onClick={nextScenario}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors shadow-lg touch-none"
                  aria-label="Next scenario"
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
                  <p className="mb-4">{gameConfig.instructions}</p>

                  <div className="mb-6">
                    <p className="text-sm font-semibold mb-2">Choose Difficulty:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {["easy", "medium", "hard", "all"].map((diff) => (
                        <button
                          key={diff}
                          onClick={() => setDifficultyLevel(diff)}
                          className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                            difficulty === diff
                              ? diff === "easy"
                                ? "bg-green-500 text-white"
                                : diff === "medium"
                                  ? "bg-yellow-500 text-black"
                                  : diff === "hard"
                                    ? "bg-red-500 text-white"
                                    : "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {diff.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {difficulty === "all"
                        ? `All ${totalLevels} scenarios`
                        : `${gameConfig.scenarios.filter((s) => s.difficulty === difficulty).length} ${difficulty} scenarios`}
                    </p>
                  </div>

                  <button
                    onClick={startGame}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Start Game
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
