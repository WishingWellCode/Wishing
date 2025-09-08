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
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.round(event.clientX - rect.left)
    const y = Math.round(event.clientY - rect.top)

    const newPoint: Point = { x, y, id: nextId }
    setPoints(prev => [...prev, newPoint])
    setNextId(prev => prev + 1)

    console.log(`📍 Point ${nextId}: {x: ${x}, y: ${y}}`)
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
    <div className="fixed inset-0 z-[9999] bg-black/50">
      {/* Debug Overlay */}
      <div 
        ref={containerRef}
        className="absolute inset-0 cursor-crosshair"
        onClick={handleClick}
        style={{ background: 'transparent' }}
      >
        {/* Render points */}
        {points.map((point, index) => (
          <div key={point.id}>
            {/* Point marker */}
            <div
              className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-white text-xs font-bold pointer-events-none"
              style={{
                left: point.x - 8,
                top: point.y - 8,
                fontSize: '10px'
              }}
            >
              {point.id}
            </div>
            
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
                  strokeWidth="2"
                  strokeDasharray="5,5"
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
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Control Panel */}
      <div className="absolute top-4 left-4 bg-black/90 p-4 rounded-lg border-2 border-red-500 text-white font-pixel text-xs max-w-sm">
        <h3 className="text-lg text-red-400 mb-3">Portal Area Debugger</h3>
        
        <div className="space-y-2 mb-4">
          <p>Click to add points ({points.length} points)</p>
          <p className="text-yellow-400">
            {points.length === 0 && "Start clicking to map the portal area"}
            {points.length === 1 && "Need at least 2 more points"}
            {points.length === 2 && "Need at least 1 more point"}
            {points.length >= 3 && "Polygon complete! Keep adding or export"}
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={exportCoordinates}
            disabled={points.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-3 rounded"
          >
            Export Coordinates
          </button>
          
          <button
            onClick={removeLastPoint}
            disabled={points.length === 0}
            className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white py-2 px-3 rounded"
          >
            Remove Last Point
          </button>
          
          <button
            onClick={clearPoints}
            disabled={points.length === 0}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white py-2 px-3 rounded"
          >
            Clear All Points
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded"
          >
            Close Debugger
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

      {/* Instructions */}
      <div className="absolute top-4 right-4 bg-black/90 p-4 rounded-lg border border-gray-600 text-white font-pixel text-xs max-w-xs">
        <h4 className="text-yellow-400 mb-2">Instructions:</h4>
        <ul className="space-y-1 text-xs">
          <li>• Click around the portal area perimeter</li>
          <li>• Points will be connected in order</li>
          <li>• Minimum 3 points needed</li>
          <li>• Check console for coordinates</li>
          <li>• Export when done mapping</li>
        </ul>
      </div>
    </div>
  )
}