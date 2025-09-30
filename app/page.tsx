import { CardSortingGame } from "../components/card-sorting-game"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
      <CardSortingGame />
    </main>
  )
}
