import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import PortalDebugger from './PortalDebugger'

interface DebugPortalProps {
  isActive: boolean
  onClose: () => void
}

export default function DebugPortal({ isActive, onClose }: DebugPortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted || !isActive) return null

  // Create portal that renders outside the normal React tree
  return createPortal(
    <PortalDebugger isActive={isActive} onClose={onClose} />,
    document.body
  )
}