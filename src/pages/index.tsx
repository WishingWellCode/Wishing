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
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    if (connected && publicKey) {
      setIsGameReady(true)
    } else {
      setIsGameReady(false)
      setPlayers([])
      setCurrentPlayerId(null)
    }
  }, [connected, publicKey])

  // Remove loading delay completely
  useEffect(() => {
    setIsLoading(false)
  }, [])

  return (
    <>
      <Head>
        <title>$WISH Wishing Well</title>
        <meta name="description" content="Throw your $WISH tokens into the magical fountain!" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen w-full relative" style={{ backgroundColor: '#000' }}>
        {/* Game Canvas */}
        <GameCanvas isWalletConnected={connected} />

        {/* UI Buttons - Overlaid on top */}
        <div className="absolute top-4 left-4 z-50">
          <WalletMultiButton 
            className="!bg-purple-600 hover:!bg-purple-700"
            style={{ fontSize: '14px' }}
          />
        </div>
        
        <div className="absolute bottom-4 right-4 z-50">
          <button
            onClick={() => setShowHelp(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white border-none rounded px-4 py-2 text-sm font-semibold cursor-pointer transition-all shadow"
          >
            Help
          </button>
        </div>

        {/* Help overlay */}
        {showHelp && <PreWalletOverlay onClose={() => setShowHelp(false)} />}

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

        {/* Multiplayer Overlay */}
        {connected && (
          <MultiplayerOverlay 
            players={players}
            currentPlayerId={currentPlayerId}
          />
        )}
      </div>
    </>
  )
}