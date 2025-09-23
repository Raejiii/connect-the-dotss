import { Lightbulb } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { GameStateType } from "@/types/TGames";

function HintBox({
  hint,
  setGameState,
}: {
  gameState: GameStateType;
  hint: string;
  setGameState: React.Dispatch<React.SetStateAction<GameStateType>>;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          onClick={() => {
            setGameState((prev) => ({
              ...prev,
              isPlaying: false,
            }));
          }}
          className="fixed right-16 lg:right-20 md:top-3 top-2 lg:top-4 md:size-12 size-10 lg:size-14 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors shadow-lg touch-none z-10"
          aria-label="Get Hint"
          title="Get Hint"
        >
          <Lightbulb className="lg:size-10 md:size-8 size-7 text-white" />
        </button>
      </DialogTrigger>
      <DialogContent className="md:max-w-80 max-w-72 lg:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Hint Box</DialogTitle>
          <DialogDescription className="text-black text-center">
            {hint || "No help is available for this game."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="justify-center">
          <DialogClose
            onClick={() => {
              setGameState((prev) => ({
                ...prev,
                isPlaying: true,
              }));
            }}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 inline-flex items-center justify-center gap-2 whitespace-nowrap  text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-blue-400/40 focus-visible:ring-blue-400/40 focus-visible:ring-[3px]  shadow-xs  aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
          >
            Got it
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default HintBox;
