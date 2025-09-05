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

      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900">
        <div className="absolute top-4 right-4 z-50">
          <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
        </div>

        {!connected && !testMode ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center p-8 bg-black/50 rounded-lg">
              <h1 className="text-4xl font-pixel text-yellow-400 mb-8">
                $WISH Wishing Well
              </h1>
              <p className="text-white font-pixel text-sm mb-8">
                Connect your wallet to enter the magical realm
              </p>
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !font-pixel mb-4" />
              <br />
              <button 
                onClick={() => setTestMode(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-pixel text-sm px-4 py-2 rounded"
              >
                TEST MODE (No Wallet)
              </button>
            </div>
          </div>
        ) : (
          <>
            {(isGameReady || testMode) && <GameCanvas />}
            <div className="absolute bottom-4 left-4 bg-black/70 p-4 rounded-lg text-white font-pixel text-xs">
              <p>WASD/Arrow Keys - Move</p>
              <p>{testMode ? 'TEST MODE' : 'E - Interact'}</p>
            </div>
          </>
        )}
      </div>
    </>
  )
}