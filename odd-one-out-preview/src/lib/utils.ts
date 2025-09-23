import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// Format time as MM:SS
export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

export const getPathFromURL = (url: string) => {
  const urlObj = new URL(url);
  return urlObj.pathname;
};

export const getFileNameFromURL = (url: string) => {
  return url.split("/").pop();
};

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // Make a copy to avoid mutating the original array
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function isLocalHost() {
  return window.location.port === "5174";
}

export const uploadedAssetURL = ({
  gameId,
  src,
}: {
  gameId: string;
  src: string;
}) => {
  return isLocalHost()
    ? `${import.meta.env.VITE_CONTENT_BASE_URL}/${gameId}/${src}`
    : src;
};
