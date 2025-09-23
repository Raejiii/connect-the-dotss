import ReplayIcon from "@/assets/ReplayIcon";
import type { GameStateType } from "@/types/TGames";
const ReplayScreen = ({
  type,
  handleResetGame,
  setGameState,
}: {
  type: "timeUp" | "win" | "";
  handleResetGame: () => void;
  setGameState: React.Dispatch<React.SetStateAction<GameStateType>>;
}) => {
  return type !== "" ? (
    <div
      style={{ pointerEvents: "auto" }}
      className="absolute top-0 h-screen w-screen z-60 bg-black/50 backdrop-blur-xs flex flex-col justify-center items-center"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          setGameState((prev) => ({
            ...prev,
            isPlaying: true,
            hasStarted: true,
            hasWon: false,
            timeLeft: prev.duration,
          }));
          handleResetGame();
        }}
        style={{ pointerEvents: "auto" }}
        className=" cursor-pointer scale-[1.5]"
      >
        {type == "timeUp" && (
          <div
            className="md:text-3xl text-4xl font-bold text-green-400"
            style={{
              textShadow:
                "4px 4px 8px rgba(128, 0, 128, 0.8), -2px -2px 4px rgba(0, 0, 0, 0.6)",
              filter: "drop-shadow(0 0 10px rgba(0, 255, 0, 0.7))",
            }}
          >
            Time up
          </div>
        )}
        <span className="flex items-center justify-center mt-8">
          <ReplayIcon />
        </span>
      </div>
    </div>
  ) : null;
};

export default ReplayScreen;
