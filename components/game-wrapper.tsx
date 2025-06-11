"use client"

import dynamic from "next/dynamic"

const DynamicConnectTheDotsGame = dynamic(() => import("./ConnectTheDotsGame"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-[#000B18]">
      <div className="text-xl text-white">Loading game...</div>
    </div>
  ),
})

export default function GameWrapper() {
  return (
    <div className="h-screen w-screen bg-[#000B18] overflow-hidden">
      <DynamicConnectTheDotsGame />
    </div>
  )
}
