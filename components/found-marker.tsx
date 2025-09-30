import { Check } from 'lucide-react'

interface FoundMarkerProps {
  x: number
  y: number
}

export const FoundMarker: React.FC<FoundMarkerProps> = ({ x, y }) => {
  return (
    <div 
      className="absolute pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
        filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))',
        zIndex: 40
      }}
    >
      <div className="relative">
        <div className="absolute -inset-1 rounded-full bg-white/80 blur-[1px]" />
        <div className="relative w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  )
}
