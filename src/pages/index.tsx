import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Head from 'next/head'
import PreWalletOverlay from '@/components/PreWalletOverlay'

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false, loading: () => null })
const MultiplayerManager = dynamic(() => import('@/components/MultiplayerManager'), { ssr: false })
const MultiplayerOverlay = dynamic(() => import('@/components/MultiplayerOverlay'), { ssr: false })

export default function Home() {
  const { publicKey, connected } = useWallet()
  const [players, setPlayers] = useState([])
  const [currentPlayerId, setCurrentPlayerId] = useState(null)
  const [showHelp, setShowHelp] = useState(false)

  return (
    <>
      <Head>
        <title>$WISH Wishing Well</title>
        <meta name="description" content="Throw your $WISH tokens into the magical fountain!" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </Head>

      {/* Full screen container */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#000' }}>
        {/* Game Canvas - Background */}
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

        {/* Multiplayer Overlay */}
        {connected && (
          <MultiplayerOverlay 
            players={players}
            currentPlayerId={currentPlayerId}
          />
        )}

        {/* Help overlay */}
        {showHelp && <PreWalletOverlay onClose={() => setShowHelp(false)} />}
      </div>

      {/* BUTTONS - Completely separate from game container */}
      <div
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 99999,
          pointerEvents: 'auto'
        }}
      >
        <WalletMultiButton 
          className="!bg-purple-600 hover:!bg-purple-700"
          style={{ 
            fontSize: '14px',
            position: 'relative',
            zIndex: 99999
          }}
        />
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 99999,
          pointerEvents: 'auto'
        }}
      >
        <button
          onClick={() => setShowHelp(true)}
          style={{
            backgroundColor: '#9333ea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            zIndex: 99999,
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#7c3aed'
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#9333ea'
          }}
        >
          Help
        </button>
      </div>
    </>
  )
}