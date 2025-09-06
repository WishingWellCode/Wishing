import { useState, useEffect } from 'react'

interface PortalArea {
  id: string
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  type: 'rectangle' | 'circle'
  label: string
}

export default function CoordinateDebugger() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [portalAreas, setPortalAreas] = useState<PortalArea[]>([])
  const [isDefiningArea, setIsDefiningArea] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentArea, setCurrentArea] = useState<Partial<PortalArea>>({})
  const [showDebugger, setShowDebugger] = useState(false)
  const [areaType, setAreaType] = useState<'rectangle' | 'circle'>('rectangle')

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX,
        y: e.clientY
      })
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      // Toggle debugger with 'D' key
      if (e.key.toLowerCase() === 'd' && e.ctrlKey) {
        e.preventDefault()
        setShowDebugger(prev => !prev)
        console.log('Debugger toggled:', !showDebugger)
      }
      // Toggle area type with 'R' for rectangle, 'C' for circle
      if (showDebugger && !isDefiningArea) {
        if (e.key.toLowerCase() === 'r') {
          setAreaType('rectangle')
        } else if (e.key.toLowerCase() === 'c') {
          setAreaType('circle')
        }
      }
    }

    const handleResize = () => {
      // Force re-render on window resize to fix F12 console issues
      setMousePos(prev => ({ ...prev }))
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('keydown', handleKeyPress)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('keydown', handleKeyPress)
      window.removeEventListener('resize', handleResize)
    }
  }, [showDebugger, isDefiningArea])

  const handleClick = (e: React.MouseEvent) => {
    if (!showDebugger) return
    
    const x = e.clientX
    const y = e.clientY

    if (!isDefiningArea) {
      // Start defining area
      setIsDefiningArea(true)
      setStartPos({ x, y })
      setCurrentArea({ x, y, type: areaType })
    } else {
      // Finish defining area
      let newArea: PortalArea

      if (areaType === 'rectangle') {
        const width = Math.abs(x - startPos.x)
        const height = Math.abs(y - startPos.y)
        const finalX = Math.min(x, startPos.x)
        const finalY = Math.min(y, startPos.y)

        newArea = {
          id: `portal-${Date.now()}`,
          x: finalX,
          y: finalY,
          width,
          height,
          type: 'rectangle',
          label: `Rect ${portalAreas.length + 1}`
        }
      } else {
        // Circle area
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2))
        
        newArea = {
          id: `portal-${Date.now()}`,
          x: startPos.x,
          y: startPos.y,
          radius,
          type: 'circle',
          label: `Circle ${portalAreas.length + 1}`
        }
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
      <div className="fixed top-20 right-4 z-[100]">
        <div className="bg-black/90 text-white p-3 rounded-lg border border-gray-600 text-sm shadow-xl">
          <div className="font-bold mb-1">Coordinate Debugger</div>
          <div>Press <kbd className="bg-gray-700 px-1 rounded">Ctrl+D</kbd> to activate</div>
        </div>
      </div>
    )
  }

  // Calculate current preview area
  const getPreviewStyle = () => {
    if (!isDefiningArea) return {}
    
    if (areaType === 'rectangle') {
      return {
        left: Math.min(mousePos.x, startPos.x),
        top: Math.min(mousePos.y, startPos.y),
        width: Math.abs(mousePos.x - startPos.x),
        height: Math.abs(mousePos.y - startPos.y)
      }
    } else {
      const radius = Math.sqrt(Math.pow(mousePos.x - startPos.x, 2) + Math.pow(mousePos.y - startPos.y, 2))
      return {
        left: startPos.x - radius,
        top: startPos.y - radius,
        width: radius * 2,
        height: radius * 2,
        borderRadius: '50%'
      }
    }
  }

  return (
    <>
      {/* Click overlay */}
      <div 
        className="fixed inset-0 z-[90] pointer-events-auto"
        onClick={handleClick}
        style={{ 
          cursor: isDefiningArea ? 'crosshair' : 'pointer',
          backgroundColor: 'transparent'
        }}
      />

      {/* Mouse coordinates */}
      <div className="fixed bottom-4 left-4 z-[100] bg-black/95 text-white p-3 rounded-lg border border-gray-600 font-mono text-sm shadow-xl">
        <div className="font-bold text-green-400">Mouse: ({mousePos.x}, {mousePos.y})</div>
        <div className="text-blue-400 mt-1">
          Mode: <span className="font-bold">{areaType}</span> | Press R/C to switch
        </div>
        <div className="text-yellow-400 mt-1">
          {isDefiningArea ? '🎯 Click to finish area' : '🖱️ Click to start defining area'}
        </div>
      </div>

      {/* Current area preview */}
      {isDefiningArea && (
        <div
          className="fixed border-2 border-yellow-400 bg-yellow-400/20 z-[95] pointer-events-none"
          style={getPreviewStyle()}
        />
      )}

      {/* Defined portal areas */}
      {portalAreas.map((area) => {
        const isCircle = area.type === 'circle'
        const style = isCircle ? {
          left: area.x - (area.radius || 0),
          top: area.y - (area.radius || 0),
          width: (area.radius || 0) * 2,
          height: (area.radius || 0) * 2,
          borderRadius: '50%'
        } : {
          left: area.x,
          top: area.y,
          width: area.width,
          height: area.height
        }

        return (
          <div
            key={area.id}
            className={`fixed border-2 z-[95] ${
              isCircle ? 'border-green-500 bg-green-500/20' : 'border-red-500 bg-red-500/20'
            }`}
            style={style}
          >
            <div className={`${isCircle ? 'bg-green-500' : 'bg-red-500'} text-white px-2 py-1 text-xs whitespace-nowrap`}>
              {area.label}
              <button
                className="ml-2 text-white hover:text-gray-200"
                onClick={(e) => {
                  e.stopPropagation()
                  removeArea(area.id)
                }}
              >
                ×
              </button>
            </div>
          </div>
        )
      })}

      {/* Control panel */}
      <div className="fixed top-20 right-4 z-[100] bg-black/95 text-white p-3 rounded-lg border border-gray-600 w-80 shadow-xl">
        <div className="text-sm font-bold mb-2 text-center">🎯 Portal Area Debugger</div>
        
        <div className="space-y-2 text-xs">
          <div className="text-center">Areas: <span className="text-green-400 font-bold">{portalAreas.length}</span></div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`px-2 py-1 rounded text-xs font-semibold ${
                areaType === 'rectangle' ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              onClick={() => setAreaType('rectangle')}
            >
              📐 Rectangle (R)
            </button>
            <button
              className={`px-2 py-1 rounded text-xs font-semibold ${
                areaType === 'circle' ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              onClick={() => setAreaType('circle')}
            >
              ⭕ Circle (C)
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-1">
            <button
              className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs font-semibold"
              onClick={() => setPortalAreas([])}
            >
              🗑️ Clear
            </button>
            <button
              className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs font-semibold"
              onClick={exportAreas}
            >
              📋 Export
            </button>
            <button
              className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs font-semibold"
              onClick={() => setShowDebugger(false)}
            >
              ❌ Hide
            </button>
          </div>
        </div>

        {portalAreas.length > 0 && (
          <div className="mt-2 max-h-24 overflow-y-auto bg-gray-800 rounded p-2">
            <div className="text-xs text-gray-400 mb-1 font-semibold">Defined Areas:</div>
            {portalAreas.map((area) => (
              <div key={area.id} className="text-xs font-mono bg-gray-700 p-1 rounded mb-1 flex justify-between items-center">
                <span className="text-white">
                  {area.label}: ({area.x}, {area.y}, {
                    area.type === 'circle' ? `r${Math.round(area.radius || 0)}` : `${area.width}×${area.height}`
                  })
                </span>
                <button
                  className="text-red-400 hover:text-red-300 ml-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeArea(area.id)
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}