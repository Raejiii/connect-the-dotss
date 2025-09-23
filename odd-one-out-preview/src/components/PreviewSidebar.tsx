import type { GameStateType } from "@/types/TGames";
import { Music, Pause, Play, RotateCcw, VolumeX } from "lucide-react";

function PreviewSidebar({
  gameState,
  showRestartButton = true,
  resetGame,
  togglePause,
  toggleMute,
}: {
  gameState: GameStateType;
  setGameState: React.Dispatch<React.SetStateAction<GameStateType>>;
  showRestartButton: boolean;
  resetGame?: () => void;
  togglePause: () => void;
  toggleMute: () => void;
}) {
  const { isMuted, isPlaying, hasWon } = gameState;

  return (
    <div
      className={`fixed w-fit p-2 md:p-3 lg:p-4 top-0 left-0 bottom-0 flex items-start z-10 transition-all duration-300 ${
        !isPlaying ? " bg-violet-500" : ""
      }`}
    >
      <div className="h-full flex flex-col items-center gap-6">
        <button
          onClick={togglePause}
          className="md:size-12 size-10 lg:size-16 rounded-full bg-violet-500 hover:bg-violet-600 flex items-center justify-center transition-colors shadow-lg touch-none"
          aria-label={!isPlaying ? "Resume game" : "Pause game"}
          disabled={hasWon}
          title={!isPlaying ? "Resume game" : "Pause game"}
        >
          {!isPlaying ? (
            <Play className="lg:size-10 md:size-8 size-7 text-white" />
          ) : (
            <Pause className="lg:size-10 md:size-8 size-7 text-white" />
          )}
        </button>
        {!isPlaying && (
          <>
            <button
              onClick={toggleMute}
              className={`md:size-12 size-10 lg:size-16 rounded-full ${
                isMuted
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              } flex items-center justify-center transition-colors shadow-lg touch-none`}
              aria-label={isMuted ? "Unmute" : "Mute"}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="lg:size-10 md:size-8 size-7 text-white" />
              ) : (
                <Music className="lg:size-10 md:size-8 size-7 text-white" />
              )}
            </button>
            <button
              onClick={() => resetGame?.()}
              className={`${
                showRestartButton ? "" : "hidden"
              } md:size-12 size-10 lg:size-16 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors shadow-lg touch-none`}
              aria-label="Reset game"
              title="Reset game"
            >
              <RotateCcw className="lg:size-10 md:size-8 size-7 text-white" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default PreviewSidebar;
