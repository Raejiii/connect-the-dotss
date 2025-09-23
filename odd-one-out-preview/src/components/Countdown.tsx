import TimerSvg from "@/assets/TimerSvg";
import { formatTime } from "@/lib/utils";
import type { GameStateType } from "@/types/TGames";
import { useEffect, useRef } from "react";

const CountdownTimer = ({
  initialTime,
  gameState,
  setGameState,
  onTimeUp,
  gameName
}: {
  initialTime: number;
  gameState: GameStateType;
  setGameState: React.Dispatch<React.SetStateAction<GameStateType>>;
  onTimeUp: () => void;
  gameName?: string;
}) => {
  const { isPlaying, timeLeft } = gameState;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setGameState((prev) => ({
      ...prev,
      timeLeft: initialTime,
    }));
  }, [initialTime, setGameState]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          if (prev.timeLeft <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;

            onTimeUp();
            return {
              ...prev,
              timeLeft: 0,
              isPlaying: false,
              hasTimeUp: true,
            };
          }

          return {
            ...prev,
            timeLeft: prev.timeLeft - 1,
          };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, setGameState, onTimeUp]);

  // Replace the SVG-based timer with a responsive pill-shaped design
  return (
    <div className={`absolute top-2 left-1/2 -translate-x-1/2  w-fit `}>
      {gameName && (
        <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-black uppercase luckiest-guy-regular">
          {gameName}
        </div>
      )}
      <div className="flex gap-6 font-bold items-center justify-center">
        <div className="flex items-center">
          <TimerSvg/>

          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>
      {/* <div
        className={`flex items-center justify-center rounded-lg bg-white border-[#558B2F] text-base md:text-lg px-2 md:px-4 py-1 md:py-1.5 border-3 transition-all duration-200`}
        style={{
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          maxWidth: "100%",
          transform: "scale(var(--timer-scale, 1))",
          transformOrigin: "center top",
        }}
      >
        <span className={`font-bold text-[#2E7D32] whitespace-nowrap`}>
          {formatTime(timeLeft)}
        </span>
      </div> */}
    </div>
  );
};

export default CountdownTimer;
