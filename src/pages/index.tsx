import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Head from 'next/head'

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false })

export default function Home() {
  const { publicKey, connected } = useWallet()
  const [isGameReady, setIsGameReady] = useState(false)
  const [testMode, setTestMode] = useState(false)

  useEffect(() => {
    if (connected && publicKey) {
      setIsGameReady(true)
    }
  }, [connected, publicKey])

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
        <div className="absolute top-4 right-4 z-50">
          <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
        </div>

        <div className="relative z-10">
          <GameCanvas isWalletConnected={connected} testMode={testMode} />
        </div>
        
        <div className="absolute top-4 left-4 z-50">
          {!connected && !testMode && (
            <div className="bg-black/70 p-4 rounded-lg">
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !font-pixel mb-2" />
              <br />
              <button 
                onClick={() => setTestMode(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-pixel text-xs px-3 py-2 rounded"
              >
                TEST MODE
              </button>
            </div>
          )}
        </div>

        {(connected || testMode) && (
          <div className="absolute bottom-4 left-4 bg-black/70 p-4 rounded-lg text-white font-pixel text-xs z-50">
            <p>WASD/Arrow Keys - Move</p>
            <p>{testMode ? 'TEST MODE ACTIVE' : 'E - Interact'}</p>
          </div>
        )}
      </div>
    </>
  )
}