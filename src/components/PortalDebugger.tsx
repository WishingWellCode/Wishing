import { useState, useRef, useEffect } from 'react'

interface Point {
  x: number
  y: number
  id: number
}

interface PortalDebuggerProps {
  isActive: boolean
  onClose: () => void
}

export default function PortalDebugger({ isActive, onClose }: PortalDebuggerProps) {
  const [points, setPoints] = useState<Point[]>([])
  const [nextId, setNextId] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive) {
      setPoints([])
      setNextId(1)
    }
  }, [isActive])

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.round(event.clientX - rect.left)
    const y = Math.round(event.clientY - rect.top)

    const newPoint: Point = { x, y, id: nextId }
    setPoints(prev => [...prev, newPoint])
    setNextId(prev => prev + 1)

    console.log(`📍 Point ${nextId}: {x: ${x}, y: ${y}}`)
  }

  const handleRightClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    clearPoints()
  }

  const clearPoints = () => {
    setPoints([])
    setNextId(1)
    console.clear()
    console.log('🗑️ Cleared all points')
  }

  const removeLastPoint = () => {
    if (points.length > 0) {
      const removedPoint = points[points.length - 1]
      setPoints(prev => prev.slice(0, -1))
      console.log(`❌ Removed point ${removedPoint.id}: {x: ${removedPoint.x}, y: ${removedPoint.y}}`)
    }
  }

  const exportCoordinates = () => {
    if (points.length === 0) {
      console.log('⚠️ No points to export')
      return
    }

    const coordsArray = points.map(point => `{x: ${point.x}, y: ${point.y}}`).join(',\n          ')
    const output = `Portal coordinates (${points.length} points):
        coords: [
          ${coordsArray}
        ]`
    
    console.log('📋 PORTAL COORDINATES:')
    console.log(output)
    
    // Also copy to clipboard if available
    if (navigator.clipboard) {
      navigator.clipboard.writeText(coordsArray).then(() => {
        console.log('📋 Coordinates copied to clipboard!')
      }).catch(() => {
        console.log('📋 Could not copy to clipboard, but coordinates are logged above')
      })
    }
  }

  const testPointInPolygon = (testX: number, testY: number) => {
    if (points.length < 3) {
      console.log('⚠️ Need at least 3 points to test polygon')
      return
    }

    // Point-in-polygon algorithm (same as used in game)
    let isInside = false
    const x = testX
    const y = testY
    
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x
      const yi = points[i].y
      const xj = points[j].x
      const yj = points[j].y
      
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
        isInside = !isInside
      }
    }
    
    console.log(`🎯 Point (${testX}, ${testY}) is ${isInside ? 'INSIDE' : 'OUTSIDE'} the polygon`)
    return isInside
  }

  if (!isActive) return null

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Debug Overlay - transparent and pointer-events only where needed */}
      <div 
        ref={containerRef}
        className="absolute inset-0 cursor-crosshair pointer-events-auto"
        onClick={handleClick}
        onContextMenu={handleRightClick}
        style={{ background: 'transparent' }}
      >
        {/* Render points */}
        {points.map((point, index) => (
          <div key={point.id}>
            {/* Point marker - made much more visual */}
            <div
              className="absolute bg-red-500 border-4 border-white rounded-full flex items-center justify-center text-white font-bold pointer-events-none shadow-lg"
              style={{
                width: '24px',
                height: '24px',
                left: point.x - 12,
                top: point.y - 12,
                fontSize: '12px',
                boxShadow: '0 0 10px rgba(255,0,0,0.8), 0 0 20px rgba(255,0,0,0.4)',
                zIndex: 10000
              }}
            >
              {point.id}
            </div>
            
            {/* Pulsing ring animation */}
            <div
              className="absolute border-2 border-red-400 rounded-full pointer-events-none animate-ping"
              style={{
                width: '32px',
                height: '32px',
                left: point.x - 16,
                top: point.y - 16,
                zIndex: 9999
              }}
            />
            
            {/* Line to next point */}
            {index < points.length - 1 && (
              <svg
                className="absolute pointer-events-none"
                style={{
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%'
                }}
              >
                <line
                  x1={point.x}
                  y1={point.y}
                  x2={points[index + 1].x}
                  y2={points[index + 1].y}
                  stroke="red"
                  strokeWidth="4"
                  strokeDasharray="8,4"
                  style={{ filter: 'drop-shadow(0px 0px 4px rgba(255,0,0,0.6))' }}
                />
              </svg>
            )}
            
            {/* Line back to first point (close polygon) */}
            {index === points.length - 1 && points.length > 2 && (
              <svg
                className="absolute pointer-events-none"
                style={{
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%'
                }}
              >
                <line
                  x1={point.x}
                  y1={point.y}
                  x2={points[0].x}
                  y2={points[0].y}
                  stroke="red"
                  strokeWidth="4"
                  strokeDasharray="8,4"
                  style={{ filter: 'drop-shadow(0px 0px 4px rgba(255,0,0,0.6))' }}
                />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Control Panel - smaller and with pointer events */}
      <div className="absolute top-4 left-4 bg-black/90 p-3 rounded-lg border-2 border-red-500 text-white font-pixel text-xs max-w-xs pointer-events-auto">
        <h3 className="text-sm text-red-400 mb-2">Portal Debugger</h3>
        
        <div className="space-y-1 mb-3 text-xs">
          <p>L-Click: Add ({points.length})</p>
          <p>R-Click: Clear all</p>
          <p className="text-yellow-400 text-xs">
            {points.length === 0 && "Click to map portal"}
            {points.length === 1 && "Need 2+ points"}
            {points.length === 2 && "Need 1+ point"}
            {points.length >= 3 && "Ready to export!"}
          </p>
        </div>

        <div className="space-y-1">
          <button
            onClick={exportCoordinates}
            disabled={points.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-1 px-2 rounded text-xs"
          >
            Export
          </button>
          
          <button
            onClick={removeLastPoint}
            disabled={points.length === 0}
            className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white py-1 px-2 rounded text-xs"
          >
            Undo Last
          </button>
          
          <button
            onClick={clearPoints}
            disabled={points.length === 0}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white py-1 px-2 rounded text-xs"
          >
            Clear All
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-xs"
          >
            Close
          </button>
        </div>

        {points.length >= 3 && (
          <div className="mt-4 p-3 bg-gray-800 rounded">
            <p className="text-green-400 mb-2">Test Point in Polygon:</p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="X"
                className="w-16 p-1 bg-black text-white rounded"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const x = parseInt(e.currentTarget.value)
                    const yInput = e.currentTarget.nextElementSibling as HTMLInputElement
                    const y = parseInt(yInput.value)
                    if (!isNaN(x) && !isNaN(y)) {
                      testPointInPolygon(x, y)
                    }
                  }
                }}
              />
              <input
                type="number"
                placeholder="Y"
                className="w-16 p-1 bg-black text-white rounded"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const y = parseInt(e.currentTarget.value)
                    const xInput = e.currentTarget.previousElementSibling as HTMLInputElement
                    const x = parseInt(xInput.value)
                    if (!isNaN(x) && !isNaN(y)) {
                      testPointInPolygon(x, y)
                    }
                  }
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Enter X,Y and press Enter to test</p>
          </div>
        )}
      </div>

      {/* Minimized Instructions - just show key info */}
      <div className="absolute bottom-4 right-4 bg-black/80 p-2 rounded-lg border border-gray-600 text-white font-pixel text-xs max-w-xs pointer-events-auto">
        <p className="text-yellow-400">L-Click: Add point | R-Click: Clear</p>
        <p className="text-gray-300">Console logs coordinates</p>
      </div>
    </div>
  )
}