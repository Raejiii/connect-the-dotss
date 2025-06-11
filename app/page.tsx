import { SpaceMemoryGame } from '../components/SpaceMemoryGame'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-8">Space Memory Game</h1>
      <SpaceMemoryGame />
    </main>
  )
}
