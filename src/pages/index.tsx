import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Head from 'next/head'

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
          height: '100vh',
          width: '100vw'
        }}
      >
        {/* Wallet button only */}
        <div className="fixed top-4 right-4 z-50" style={{ zIndex: 9999 }}>
          <WalletMultiButton 
            className="!bg-purple-600 hover:!bg-purple-700"
            style={{ fontSize: '14px' }}
          >
            {!connected ? 'Connect Wallet' : undefined}
          </WalletMultiButton>
        </div>

        {/* Centered welcome box before wallet connection */}
        {!connected && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-lg p-6 max-w-lg mx-4">
              <div className="text-white/90 font-pixel text-sm leading-relaxed space-y-4">
                <p>Connect your Phantom wallet to enter the magical realm and play with other users!</p>
                
                <div>
                  <p className="text-white mb-2">🎮 How to Play:</p>
                  <p>• Use WASD or arrow keys to move around</p>
                  <p>• Click the fountain to throw WISH tokens</p>
                  <p>• Win big or lose it all in the magical well!</p>
                </div>
                
                <div>
                  <p className="text-white mb-2">🚪 Portals:</p>
                  <p>• Info - Learn about the game</p>
                  <p>• House - Purchase and manage your property</p>
                  <p>• Links - Join our community</p>
                  <p>• Upgrades - Enhance your house</p>
                </div>
                
                <p className="text-white/60 text-center">🎮 Multiplayer Gaming • 💰 Crypto Rewards</p>
              </div>
            </div>
          </div>
        )}

        {/* Game Canvas - Always render, switches scenes based on wallet connection */}
        <GameCanvas isWalletConnected={connected} />

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