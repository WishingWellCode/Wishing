import { useState, useEffect } from 'react'

interface PortalArea {
  id: string
  x: number
  y: number
  width: number
  height: number
  label: string
}

export default function CoordinateDebugger() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [portalAreas, setPortalAreas] = useState<PortalArea[]>([])
  const [isDefiningArea, setIsDefiningArea] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentArea, setCurrentArea] = useState<Partial<PortalArea>>({})
  const [showDebugger, setShowDebugger] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = document.documentElement.getBoundingClientRect()
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      // Toggle debugger with 'D' key
      if (e.key.toLowerCase() === 'd' && e.ctrlKey) {
        e.preventDefault()
        setShowDebugger(!showDebugger)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('keydown', handleKeyPress)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [showDebugger])

  const handleClick = (e: React.MouseEvent) => {
    if (!showDebugger) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (!isDefiningArea) {
      // Start defining area
      setIsDefiningArea(true)
      setStartPos({ x, y })
      setCurrentArea({ x, y })
    } else {
      // Finish defining area
      const width = Math.abs(x - startPos.x)
      const height = Math.abs(y - startPos.y)
      const finalX = Math.min(x, startPos.x)
      const finalY = Math.min(y, startPos.y)

      const newArea: PortalArea = {
        id: `portal-${Date.now()}`,
        x: finalX,
        y: finalY,
        width,
        height,
        label: `Portal ${portalAreas.length + 1}`
      }

      setPortalAreas([...portalAreas, newArea])
      setIsDefiningArea(false)
      setCurrentArea({})
    }
  }

  const removeArea = (id: string) => {
    setPortalAreas(portalAreas.filter(area => area.id !== id))
  }

  const exportAreas = () => {
    const dataStr = JSON.stringify(portalAreas, null, 2)
    console.log('Portal Areas:', dataStr)
    navigator.clipboard.writeText(dataStr).then(() => {
      alert('Portal areas copied to clipboard!')
    })
  }

  if (!showDebugger) {
    return (
      <div className="fixed bottom-4 right-4 z-[100]">
        <div className="bg-black/80 text-white p-2 rounded text-xs">
          Press Ctrl+D to show coordinate debugger
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Click overlay */}
      <div 
        className="fixed inset-0 z-[90]"
        onClick={handleClick}
        style={{ cursor: isDefiningArea ? 'crosshair' : 'pointer' }}
      />

      {/* Mouse coordinates */}
      <div className="fixed top-4 left-4 z-[100] bg-black/90 text-white p-3 rounded font-mono text-sm">
        <div>Mouse: ({mousePos.x}, {mousePos.y})</div>
        <div className="text-yellow-400 mt-1">
          {isDefiningArea ? 'Click to finish area' : 'Click to start defining area'}
        </div>
      </div>

      {/* Current area preview */}
      {isDefiningArea && (
        <div
          className="fixed border-2 border-yellow-400 bg-yellow-400/20 z-[95] pointer-events-none"
          style={{
            left: Math.min(mousePos.x, startPos.x),
            top: Math.min(mousePos.y, startPos.y),
            width: Math.abs(mousePos.x - startPos.x),
            height: Math.abs(mousePos.y - startPos.y)
          }}
        />
      )}

      {/* Defined portal areas */}
      {portalAreas.map((area) => (
        <div
          key={area.id}
          className="fixed border-2 border-red-500 bg-red-500/20 z-[95]"
          style={{
            left: area.x,
            top: area.y,
            width: area.width,
            height: area.height
          }}
        >
          <div className="bg-red-500 text-white px-2 py-1 text-xs whitespace-nowrap">
            {area.label}
            <button
              className="ml-2 text-white hover:text-red-200"
              onClick={(e) => {
                e.stopPropagation()
                removeArea(area.id)
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}

      {/* Control panel */}
      <div className="fixed bottom-4 left-4 z-[100] bg-black/90 text-white p-4 rounded max-w-sm">
        <div className="text-lg font-bold mb-2">Portal Area Debugger</div>
        
        <div className="space-y-2 text-sm">
          <div>Areas defined: {portalAreas.length}</div>
          
          <div className="flex gap-2">
            <button
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
              onClick={() => setPortalAreas([])}
            >
              Clear All
            </button>
            <button
              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs"
              onClick={exportAreas}
            >
              Export Areas
            </button>
            <button
              className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-xs"
              onClick={() => setShowDebugger(false)}
            >
              Hide (Ctrl+D)
            </button>
          </div>
        </div>

        {portalAreas.length > 0 && (
          <div className="mt-3 max-h-32 overflow-y-auto">
            <div className="text-xs text-gray-300 mb-1">Areas:</div>
            {portalAreas.map((area) => (
              <div key={area.id} className="text-xs font-mono bg-gray-800 p-1 rounded mb-1">
                {area.label}: ({area.x}, {area.y}, {area.width}×{area.height})
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}