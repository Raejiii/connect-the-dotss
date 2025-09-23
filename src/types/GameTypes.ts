export type GameStateType = {
  isPlaying: boolean
  isMuted: boolean
  hasWon: boolean
  hasTimeUp: boolean
  hasStarted: boolean
  timeLeft: number
  duration: number
}

export type LabelPosition = {
  id: string
  x: number
  y: number
  label: string
  targetX: number
  targetY: number
}

export type Scenario = {
  id: number
  name: string
  difficulty: string
  title: string
  image: string
  labelPositions: LabelPosition[]
  labels: string[]
}

export type GameConfigType = {
  gameTitle: string
  instructions: string
  audio: {
    background: string
    success: string
    uiClick: string
    connect: string
    incorrect: string
    effect: string
    levelWin: string
    clap: string
    instructions: string
    start: string
  }
  splashScreen: {
    logo: string
    duration: number
  }
  scenarios: Scenario[]
}
