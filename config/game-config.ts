import type { GameConfig } from "@/types/game"

export const gameConfig: GameConfig = {
  gameType: "pictures",
  scenes: [
    {
      id: "communication-history",
      question: "Sort from the oldest to the most recent.",
      hint: "Think about when these communication methods were invented in history.",
      cards: [
        {
          id: "postmail",
          name: "Post Mail",
          image: "/images/postmail.jpg",
        },
        {
          id: "telegraph",
          name: "Telegraph",
          image: "/images/telegraph.jpg",
        },
        {
          id: "telephone",
          name: "Telephone",
          image: "/images/telephone.jpg",
        },
        {
          id: "radio",
          name: "Radio",
          image: "/images/radio.jpg",
        },
        {
          id: "mobile",
          name: "Mobile",
          image: "/images/mobile.jpg",
        },
      ],
      correctOrder: ["postmail", "telegraph", "telephone", "radio", "mobile"],
    },
  ],
}
