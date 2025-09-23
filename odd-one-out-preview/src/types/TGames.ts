export type GameStateType = {
  isPlaying: boolean;
  isMuted: boolean;
  hasWon: boolean;
  hasTimeUp: boolean;
  hasStarted: boolean;
  timeLeft: number;
  duration: number;
};

export type GameConfigType = {
  successMessages: string[];
  incorrectMessages: string[];
  levelWinMessages: string[];
  showRestartButton: boolean;
  showAnswers: boolean;
  title: string;
  description?: string;
  instructions: string;
  duration: number; // in seconds
  // Background image path.
  background?: string | null;
  customAssets: AssetType[];
  audio: {
    instructions: {
      src: string;
    } | null;
  };
  // New multi-level structure. Preferred going forward.
  levels?: LevelType[];
  /**
   * Legacy single-level structure. Kept optional for backward compatibility.
   * If present without `levels`, it will be treated as Level 1.
   */
  gameItems?: GameItemType[];
  ekaiFormData?: Record<string, any>;
};

export type AssetType = {
  isUploadedImage?: boolean;
  src: string;
  title: string;
  isWebImage?: boolean;
};

export type GameItemType = {
  src: string | null;
  title: string | null;
  isCorrect: boolean;
  // Optional short explanation for why this item is the odd one out.
  oddReason?: string | null;
};

export type LevelType = {
  id: number;
  // Optional title/label for the level
  title?: string | null;
  gameItems: GameItemType[];
};

export type Tags = {
  id: string;
  name: string;
  UID: string;
};

export type GameDetails = {
  title: string;
  description: string;
  age: string;
};
