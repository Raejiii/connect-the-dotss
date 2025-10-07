export interface Card {
  id: string
  name: string
  image?: string
}

export interface Scene {
  id: string
  question: string
  hint: string
  cards: Card[]
  correctOrder: string[]
}

export interface GameConfig {
  gameType: "pictures"
  scenes: Scene[]
}
