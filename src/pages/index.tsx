import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Head from 'next/head'

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false })
const CoordinateDebugger = dynamic(() => import('@/components/CoordinateDebugger'), { ssr: false })
const MultiplayerManager = dynamic(() => import('@/components/MultiplayerManager'), { ssr: false })
const MultiplayerOverlay = dynamic(() => import('@/components/MultiplayerOverlay'), { ssr: false })

interface Player {
  id: string
  walletAddress: string
  username: string
  x: number
  y: number
  sprite: string
}

export default function Home() {
  const { publicKey, connected } = useWallet()
  const [isGameReady, setIsGameReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [multiplayerPlayers, setMultiplayerPlayers] = useState<Player[]>([])
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)

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
          <WalletMultiButton 
            className="!bg-purple-600 hover:!bg-purple-700"
            style={{ fontSize: '14px' }}
          >
            {!connected ? 'Connect Wallet' : undefined}
          </WalletMultiButton>
        </div>

        <div className="relative z-10">
          <GameCanvas isWalletConnected={connected} />
        </div>

        {/* Multiplayer Manager - handles WebSocket connection */}
        <MultiplayerManager
          isActive={true} // Always active on landing page
          onPlayersUpdate={(players) => {
            setMultiplayerPlayers(players)
            // Extract current player ID from window
            const multiplayerManager = (window as any).multiplayerManager
            if (multiplayerManager) {
              setCurrentPlayerId(multiplayerManager.playerId)
            }
          }}
        />

        {/* Multiplayer Overlay - shows other players */}
        <MultiplayerOverlay 
          players={multiplayerPlayers}
          currentPlayerId={currentPlayerId}
        />

        {connected && (
          <div className="absolute bottom-4 left-4 bg-black/70 p-4 rounded-lg text-white font-pixel text-xs z-50">
            <p>WASD/Arrow Keys - Move</p>
            <p>E - Interact</p>
            <p className="text-cyan-400 mt-1">🎮 Multiplayer Active</p>
          </div>
        )}

        {/* Coordinate Debugger */}
        <CoordinateDebugger />
      </div>
    </>
  )
}