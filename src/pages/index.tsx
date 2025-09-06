import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Head from 'next/head'

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false })
const CoordinateDebugger = dynamic(() => import('@/components/CoordinateDebugger'), { ssr: false })

export default function Home() {
  const { publicKey, connected } = useWallet()
  const [isGameReady, setIsGameReady] = useState(false)
  const [testMode, setTestMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (connected && publicKey) {
      setIsGameReady(true)
    }
  }, [connected, publicKey])

  // Stop loading after component mounts to prevent flash
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Auto-enable test mode for development
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 't' && e.ctrlKey) {
        e.preventDefault()
        setTestMode(!testMode)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [testMode])

  if (isLoading) {
    return <div style={{ background: 'url(/assets/backgrounds/Realbackground.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh' }} />
  }

  return (
    <>
      <Head>
        <title>$WISH Wishing Well</title>
        <meta name="description" content="Throw your $WISH tokens into the magical fountain!" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </Head>

      <div 
        className="min-h-screen w-full relative"
        style={{
          backgroundImage: 'url(/assets/backgrounds/Realbackground.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Wallet button only */}
        <div className="absolute top-4 right-4 z-50">
          <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
        </div>

        <div className="relative z-10">
          <GameCanvas isWalletConnected={connected} testMode={testMode} />
        </div>

        {(connected || testMode) && (
          <div className="absolute bottom-4 left-4 bg-black/70 p-4 rounded-lg text-white font-pixel text-xs z-50">
            <p>WASD/Arrow Keys - Move</p>
            <p>{testMode ? 'TEST MODE ACTIVE' : 'E - Interact'}</p>
          </div>
        )}

        {/* Coordinate Debugger */}
        <CoordinateDebugger />
      </div>
    </>
  )
}