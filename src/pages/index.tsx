import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Head from 'next/head'

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false })
const MultiplayerSystem = dynamic(() => import('@/components/MultiplayerSystem'), { ssr: false })

export default function Home() {
  const { publicKey, connected } = useWallet()
  const [isGameReady, setIsGameReady] = useState(false)
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
        <div className="absolute top-4 right-4 z-50">
          <WalletMultiButton 
            className="!bg-purple-600 hover:!bg-purple-700"
            style={{ fontSize: '14px' }}
          >
            {!connected ? 'Connect Wallet' : undefined}
          </WalletMultiButton>
        </div>

        {/* Landing page content before wallet connection */}
        {!connected && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-6xl font-pixel text-white mb-8 drop-shadow-lg">
                $WISH Wishing Well
              </h1>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto font-pixel">
                Connect your Phantom wallet to enter the magical realm and play with other users!
              </p>
              <div className="text-white/70 font-pixel text-sm">
                <p>🎮 Multiplayer Gaming</p>
                <p>💰 Crypto Rewards</p>
                <p>✨ Magical Experience</p>
              </div>
            </div>
          </div>
        )}

        {/* Game content when wallet connected */}
        {connected && (
          <>
            <div className="relative z-10">
              <GameCanvas isWalletConnected={connected} />
            </div>

            {/* New Multiplayer System - only when wallet connected */}
            <MultiplayerSystem isActive={connected} />
          </>
        )}


      </div>
    </>
  )
}