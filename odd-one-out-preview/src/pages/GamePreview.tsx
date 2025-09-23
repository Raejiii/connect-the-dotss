import CountdownTimer from "@/components/Countdown";
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";
import PreviewSidebar from "@/components/PreviewSidebar";
import HintBox from "@/components/HintBox";
import confetti, { type Shape } from "canvas-confetti";
import {
  type GameItemType,
  type GameConfigType,
  type GameStateType,
} from "@/types/TGames";
import { shuffleArray, uploadedAssetURL } from "@/lib/utils";
import Image from "@/components/ui/image";
import FloatingText from "@/components/FloatingText";
import HowToPlay from "@/components/HowToPlay";
import type { RefType } from "@/App";
import ReplayScreen from "@/components/ReplayScreen";

const GamePreview = forwardRef<
  RefType,
  { gameId: string; config: GameConfigType }
>(({ gameId, config }) => {
  const [gameState, setGameState] = useState<GameStateType>({
    isPlaying: false,
    isMuted: false,
    hasWon: false,
    hasTimeUp: false,
    timeLeft: 0,
    duration: 0,
    hasStarted: false,
  });
  const [firstTap, setFirstTap] = useState<boolean>(true);
  const [showSplashScreen, setShowSplashScreen] = useState<boolean>(true);
  const [floatingText, setFloatingText] = useState<string | null>(null);
  const [gameConfig, setGameConfig] = useState<GameConfigType | null>(null);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const backgroundMusicRef = useRef<HTMLAudioElement>(
    new Audio("media/background.mp3")
  );
  const instructionsAudioRef = useRef<HTMLAudioElement>(
    new Audio(
      config?.audio?.instructions?.src
        ? uploadedAssetURL({ gameId, src: config.audio.instructions.src })
        : "media/instructions.mp3"
    )
  );
  const uiClickMusicRef = useRef<HTMLAudioElement>(
    new Audio("media/ui-click.webm")
  );
  const successMusicRef = useRef<HTMLAudioElement>(
    new Audio("media/success.webm")
  );
  const levelWinMusicRef = useRef<HTMLAudioElement>(
    new Audio("media/level-up.mp3")
  );
  const clapMusicRef = useRef<HTMLAudioElement>(new Audio("media/clap.webm"));
  const gameGridRef = useRef<HTMLDivElement | null>(null);
  const playgroudRef = useRef<HTMLDivElement | null>(null);
  // Guard to indicate we've already played success SFX on correct selection (single/last level)
  const playedImmediateSuccessRef = useRef<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplashScreen(false);
    }, 1000);

    // Initialize audio elements when config/gameId change
    instructionsAudioRef.current = new Audio(
      config?.audio?.instructions?.src
        ? uploadedAssetURL({ gameId, src: config.audio.instructions.src })
        : "media/instructions.mp3"
    );
    successMusicRef.current = new Audio("media/success.webm");
    clapMusicRef.current = new Audio("media/clap.webm");
    backgroundMusicRef.current = new Audio("media/background.mp3");

    return () => {
      clearTimeout(timer);
      // Only pause/stop on cleanup; do not recreate elements here
      instructionsAudioRef.current?.pause();
      successMusicRef.current?.pause();
      clapMusicRef.current?.pause();
      backgroundMusicRef.current?.pause();
    };
  }, [config, gameId]);

  // Initialize local gameConfig from incoming config so the grid renders items
  useEffect(() => {
    if (!config) return;
    if (config.levels && config.levels.length > 0) {
      const level0 = config.levels[0];
      setGameConfig({ ...config, gameItems: [...(level0.gameItems ?? [])] });
      setCurrentLevelIndex(0);
    } else {
      setGameConfig({ ...config, gameItems: [...(config.gameItems ?? [])] });
    }
    setGameState((prev) => ({
      ...prev,
      duration: config.duration ?? 0,
      timeLeft: config.duration ?? 0,
    }));
  }, [config]);

  const handleTimeUp = () => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
      backgroundMusicRef.current.currentTime = 0;
    }
  };

  const playConfetti = (cardElement: HTMLElement | null) => {
    if (cardElement && gameGridRef.current) {
      const rect = cardElement.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      const relativeX = x / window.innerWidth;
      const relativeY = y / window.innerHeight;

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: relativeX, y: relativeY },
        gravity: 1.5,
        scalar: 0.7,
        startVelocity: 20,
      });
    }
  };

  const playBigConfetti = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 1000,
    };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 100 * (timeLeft / duration);

      confetti(
        Object.assign({}, defaults, {
          particleCount: particleCount * 0.5,
          shapes: ["circle"] as Shape[],
          scalar: 2,
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        })
      );

      confetti(
        Object.assign({}, defaults, {
          particleCount: particleCount * 0.5,
          shapes: ["square"] as Shape[],
          scalar: 1.5,
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        })
      );
    }, 250);
  };

  const handleResetGame = () => {
    setFloatingText(null);
    if (!gameState.isMuted && instructionsAudioRef.current) {
      instructionsAudioRef.current.onended = () => {
        if (backgroundMusicRef.current && instructionsAudioRef.current) {
          backgroundMusicRef.current.currentTime = 0;
          backgroundMusicRef.current.loop = true;
          backgroundMusicRef.current.play();
          instructionsAudioRef.current.currentTime = 0;
        }
      };
      instructionsAudioRef.current.currentTime = 0;
      instructionsAudioRef.current.play();
    }
    // Always start from level 0 if levels exist
    setCurrentLevelIndex(0);
    setGameConfig((prev) => {
      if (!prev) return prev;
      if (prev.levels && prev.levels.length > 0) {
        const base = prev.levels[0]?.gameItems ?? [];
        const shuffled = shuffleArray<GameItemType>([...base]);
        return { ...prev, gameItems: shuffled } as GameConfigType;
      } else {
        const shuffled = shuffleArray<GameItemType>([
          ...(prev.gameItems ?? []),
        ]);
        return { ...prev, gameItems: shuffled } as GameConfigType;
      }
    });
    // Set game state to a fresh run
    setGameState((prev) => ({
      ...prev,
      isPlaying: true,
      hasStarted: true,
      hasWon: false,
      hasTimeUp: false,
      timeLeft: gameConfig?.duration || 0,
      duration: gameConfig?.duration || 0,
    }));
  };
  useEffect(() => {
    const handleUiClick = () => {
      if (!gameState.isMuted && uiClickMusicRef.current) {
        uiClickMusicRef.current.play();
      }
    };
    window.addEventListener("click", handleUiClick);
    return () => {
      window.removeEventListener("click", handleUiClick);
    };
  }, [gameState]);

  const handleStartGame = () => {
    if (!gameState.isMuted && instructionsAudioRef.current) {
      instructionsAudioRef.current.play();
      instructionsAudioRef.current.addEventListener("ended", () => {
        if (backgroundMusicRef.current && instructionsAudioRef.current) {
          backgroundMusicRef.current.play();
          backgroundMusicRef.current.loop = true;
          instructionsAudioRef.current.currentTime = 0;
        }
      });
    }
    // On first start, populate items from current level or base config so the game uses the provided config
    setGameConfig((prev) => {
      const base = prev ?? config;
      if (!base) return prev;
      if (base.levels && base.levels.length > 0) {
        const level = base.levels[currentLevelIndex] ?? base.levels[0];
        return {
          ...base,
          gameItems: shuffleArray<GameItemType>([...(level.gameItems ?? [])]),
        } as GameConfigType;
      }
      return {
        ...base,
        gameItems: shuffleArray<GameItemType>([...(base.gameItems ?? [])]),
      } as GameConfigType;
    });
    setGameState((prev) => ({
      ...prev,
      isPlaying: true,
      hasStarted: true,
      timeLeft: gameConfig?.duration || 0,
    }));
  };

  const togglePause = () => {
    if (
      !gameState.isPlaying &&
      !gameState.isMuted &&
      backgroundMusicRef.current
    ) {
      if (
        instructionsAudioRef.current &&
        instructionsAudioRef.current.currentTime > 0
      ) {
        instructionsAudioRef.current.onended = () => {
          if (backgroundMusicRef.current && instructionsAudioRef.current) {
            backgroundMusicRef.current.currentTime = 0;
            backgroundMusicRef.current.loop = true;
            backgroundMusicRef.current.play();
            instructionsAudioRef.current.currentTime = 0;
          }
        };
        instructionsAudioRef.current.play();
      } else {
        backgroundMusicRef.current.play();
      }
    } else {
      instructionsAudioRef.current?.pause();
      backgroundMusicRef.current?.pause();
    }
    setGameState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const toggleMute = () => {
    if (
      !gameState.isMuted &&
      backgroundMusicRef.current &&
      instructionsAudioRef.current
    ) {
      backgroundMusicRef.current.pause();
      instructionsAudioRef.current.pause();
      backgroundMusicRef.current.currentTime = 0;
      instructionsAudioRef.current.currentTime = 0;
    } else if (gameState.isPlaying && backgroundMusicRef.current) {
      backgroundMusicRef.current.play();
    }
    setGameState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const handleWin = (skipFloating?: boolean) => {
    setGameState((prev) => ({
      ...prev,
      duration: gameConfig?.duration ?? 0,
      timeLeft: gameConfig?.duration ?? 0,
    }));
    if (
      !gameState.isMuted &&
      backgroundMusicRef.current &&
      successMusicRef.current
    ) {
      backgroundMusicRef.current.pause();
      backgroundMusicRef.current.currentTime = 0;
      if (playedImmediateSuccessRef.current) {
        // Success already played on selection; only play clap now
        playedImmediateSuccessRef.current = false;
        if (clapMusicRef.current) {
          clapMusicRef.current.currentTime = 0;
          clapMusicRef.current.play();
          clapMusicRef.current.loop = false;
        }
      } else {
        successMusicRef.current.currentTime = 0;
        successMusicRef.current.play();
        successMusicRef.current.onended = () => {
          if (clapMusicRef.current) {
            clapMusicRef.current.currentTime = 0;
            clapMusicRef.current.play();
            clapMusicRef.current.loop = false;
          }
        };
      }
    }

    playBigConfetti();
    if (!skipFloating) {
      setFloatingText("Congratulations!");
    }
    setTimeout(() => {
      setFloatingText(null);
      const shuffledItems: GameItemType[] = shuffleArray<GameItemType>(
        gameConfig?.gameItems || []
      );

      setGameConfig((prev) =>
        prev ? { ...prev, gameItems: shuffledItems } : null
      );

      setGameState((prev) => ({ ...prev, isPlaying: false, hasWon: true }));
    }, 3000);
  };
  const handleCardClick = (index: number) => {
    if (!gameState.isPlaying) return;

    const selectedImage = gameConfig?.gameItems?.[index];
    if (!selectedImage) return;
    if (selectedImage.isCorrect) {
      playConfetti(document.getElementById(`card-${index}`));
      // Feedback sequence timings
      const reasonDelay = 3000;

      // Show oddReason
      const reason = (selectedImage.oddReason || "").trim();
      setFloatingText(reason ? reason : "Correct!");

      // Level progression
      const levelsLen = gameConfig?.levels?.length ?? 0;
      const hasLevels = levelsLen > 0;
      const isLastLevel = !hasLevels || currentLevelIndex >= levelsLen - 1;

      // Audio for correct answer: always play success immediately
      if (!gameState.isMuted && successMusicRef.current) {
        successMusicRef.current.onended = null; // ensure no chained handlers
        successMusicRef.current.currentTime = 0;
        successMusicRef.current.play();
      }

      // If single level or last level, mark that success already played so handleWin only plays clap later
      if (!hasLevels || isLastLevel) {
        playedImmediateSuccessRef.current = true;
      }

      if (hasLevels && !isLastLevel) {
        // After reason delay, show Level Up! message, play level-win, then advance level
        setTimeout(() => {
          // Show level up
          setFloatingText("Level Up!");
          if (!gameState.isMuted && levelWinMusicRef.current) {
            levelWinMusicRef.current.currentTime = 0;
            levelWinMusicRef.current.play();
          }
          // After a short delay, proceed to next level
          setTimeout(() => {
            setFloatingText(null);
            const nextIdx = currentLevelIndex + 1;
            setCurrentLevelIndex(nextIdx);
            // Refresh items for next level
            setGameConfig((prev) => {
              if (!prev || !prev.levels || prev.levels.length === 0)
                return prev;
              const boundedIdx = Math.min(nextIdx, prev.levels.length - 1);
              const nextLevel = prev.levels[boundedIdx];
              const shuffled = shuffleArray<GameItemType>([
                ...nextLevel.gameItems,
              ]);
              return { ...prev, gameItems: shuffled } as GameConfigType;
            });
          }, 1500);
        }, reasonDelay);
      } else {
        // after showing reason, finalize win
        setTimeout(() => {
          handleWin();
        }, reasonDelay);
      }
    } else {
      setFloatingText("Try again!");
      setTimeout(() => {
        setFloatingText(null);
      }, 1500);
    }
  };

  if (showSplashScreen) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Image
          src="images/eklavya.png"
          alt="eklavya - making learning accessible"
          className="w-full h-full object-contain animate-fade-in"
        />
      </div>
    );
  }

  // Resolve background URL
  const resolveBackgroundCss = (src?: string | null) => {
    if (!src) return "url('images/background7.png')";
    const clean = src.replace(/^\/+/, "").trim();

    // Direct http(s) URLs
    if (/^https?:\/\//i.test(clean)) {
      return `url('${clean}')`;
    }

    // Known public preset images
    const publicPresets = [
      "images/blueSky.png",
      "images/background4.jpg",
      "images/background7.png",
      "images/mountain.png",
      "images/eklavya.png",
    ];

    if (publicPresets.includes(clean)) {
      return `url('${clean}')`;
    }

    // All other paths (including uploaded images/...) via uploadedAssetURL
    return `url('${uploadedAssetURL({ gameId, src: clean })}')`;
  };

  return (
    <div
      className="w-screen overflow-auto relative bg-[#000B18]"
      style={{
        backgroundImage: resolveBackgroundCss(config?.background ?? null),
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div ref={playgroudRef} className="w-full h-full min-h-screen flex items-center justify-center pt-20 px-4 pb-4">
        <div
          ref={gameGridRef}
          className="grid rounded-xl relative transition-all duration-300"
          style={{
            pointerEvents: gameState.isPlaying ? "auto" : "none",
            gridTemplateColumns: `repeat(${Math.ceil(
              Math.sqrt(gameConfig?.gameItems?.length || 0)
            )}, 1fr)`,
            gridTemplateRows: `repeat(${Math.ceil(
              Math.sqrt(gameConfig?.gameItems?.length || 0)
            )}, 1fr)`,
            width: `min(100vw, 100vh - 120px, 550px)`,
            height: `min(100vw, 100vh - 120px, 550px)`,
            gap: `min(1vw, 1vh, 8px)`,
            padding: `min(1.5vw, 1.5vh, 12px)`,
            boxSizing: "border-box",
          }}
        >
          {(gameConfig?.gameItems ?? []).map((image, index) => (
            <div
              key={index}
              className="w-full h-full aspect-square border-2 border-[#FF6B35] bg-[#FFC8B4] rounded-xl overflow-hidden p-1"
            >
              <button
                id={`card-${index}`}
                onClick={() => handleCardClick(index)}
                className="w-full h-full flex items-center rounded-lg justify-center border-2 border-[#FF6B35] bg-white hover:bg-gray-50 cursor-pointer"
                disabled={!gameState.isPlaying}
                aria-label={`Card ${image.title}`}
                style={{ padding: "min(1vw, 1vh, 8px)" }}
              >
                <Image
                  src={uploadedAssetURL({
                    gameId,
                    src: image.src || "",
                  })}
                  alt={image.title || "Placeholder"}
                  className="max-w-[90%] max-h-[90%] object-contain"
                  draggable="false"
                />
              </button>
            </div>
          ))}
        </div>
      </div>
      {firstTap && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setFirstTap(false);
            handleStartGame();
          }}
          className="absolute top-0 h-screen w-screen z-50 bg-black/50 backdrop-blur-xs cursor-pointer flex flex-col items-center justify-center"
        >
          <div className="md:text-6xl text-4xl font-bold text-white">
            Tap to start
          </div>
        </div>
      )}
      <CountdownTimer
        initialTime={gameConfig?.duration || 0}
        onTimeUp={handleTimeUp}
        gameState={gameState}
        setGameState={setGameState}
        gameName={"Find the Odd One"}
      />
      <PreviewSidebar
        showRestartButton={gameConfig?.showRestartButton ?? true}
        resetGame={handleResetGame}
        gameState={gameState}
        setGameState={setGameState}
        togglePause={togglePause}
        toggleMute={toggleMute}
      />
      <HowToPlay gameState={gameState} setGameState={setGameState} />
      <HintBox
        hint="Find the one item that looks different from the rest."
        gameState={gameState}
        setGameState={setGameState}
      />

      <ReplayScreen
        type={gameState.hasWon ? "win" : gameState.hasTimeUp ? "timeUp" : ""}
        handleResetGame={handleResetGame}
        setGameState={setGameState}
      />
      <FloatingText message={floatingText} />
    </div>
  );
});

export default GamePreview;
