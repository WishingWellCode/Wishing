import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Head from 'next/head'
import PreWalletOverlay from '@/components/PreWalletOverlay'

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false })
const MultiplayerManager = dynamic(() => import('@/components/MultiplayerManager'), { ssr: false })
const MultiplayerOverlay = dynamic(() => import('@/components/MultiplayerOverlay'), { ssr: false })

export default function Home() {
  const { publicKey, connected } = useWallet()
  const [isGameReady, setIsGameReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [players, setPlayers] = useState([])
  const [currentPlayerId, setCurrentPlayerId] = useState(null)

  useEffect(() => {
    if (connected && publicKey) {
      setIsGameReady(true)
    } else {
      setIsGameReady(false)
      setPlayers([])
      setCurrentPlayerId(null)
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
    return <div style={{ background: 'url(/assets/backgrounds/sixseven.png)', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh' }} />
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
          backgroundImage: connected ? 'url(/assets/backgrounds/Realbackground.jpg)' : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          height: '100vh',
          width: '100vw'
        }}
      >
        {/* Connected state: show wallet button in top-right */}
        {connected && (
          <div className="fixed top-4 right-4 z-50" style={{ zIndex: 9999 }}>
            <WalletMultiButton 
              className="!bg-purple-600 hover:!bg-purple-700"
              style={{ fontSize: '14px' }}
            />
          </div>
        )}

        {/* Pre-connection state: show PreWalletOverlay */}
        {!connected && <PreWalletOverlay />}

        {/* Game Canvas - Only render when wallet is connected */}
        {connected && <GameCanvas isWalletConnected={connected} />}

        {/* Multiplayer Manager - handles connection and data */}
        {connected && (
          <MultiplayerManager 
            isActive={connected} 
            onPlayersUpdate={(players) => {
              setPlayers(players)
              // Find current player in the list
              const currentPlayer = players.find(p => p.walletAddress === publicKey?.toString())
              setCurrentPlayerId(currentPlayer?.id || null)
            }}
          />
        )}

      </div>

      {/* Multiplayer Overlay - OUTSIDE main container to be above everything */}
      {connected && (
        <MultiplayerOverlay 
          players={players}
          currentPlayerId={currentPlayerId}
        />
      )}
    </>
  )
}