import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'

interface WinnerEntry {
  winner: string
  amount: string
  tx: string
  ts: string
}

export default function Winners() {
  const { connected } = useWallet()
  const [winners, setWinners] = useState<WinnerEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchWinners()
  }, [])

  const fetchWinners = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('https://wish-well-worker.stealthbundlebot.workers.dev/api/stats/latest?limit=20')
      if (response.ok) {
        const data = await response.json()
        setWinners(data)
      } else {
        console.error('Failed to fetch winners data')
        setWinners([])
      }
    } catch (error) {
      console.error('Error fetching winners:', error)
      setWinners([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatAddress = (address: string) => {
    if (address.length > 10) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    }
    return address
  }

  const formatAmount = (amount: string) => {
    // WNDR has 9 decimals like SOL (pumpfun token)
    const amountNum = parseFloat(amount) / 1000000000 // Convert to WNDR with 9 decimals
    return amountNum.toFixed(2)
  }

  return (
    <>
      <Head>
        <title>Winners - $WNDR Wishing Well</title>
        <meta name="description" content="View all winning wishes from the magical fountain!" />
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
        {/* Header with wallet button and back button */}
        <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-center">
          <Link 
            href="/"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-pixel text-sm transition-colors"
            style={{ fontFamily: '"Press Start 2P"' }}
          >
            ← Back to Well
          </Link>
          
          <WalletMultiButton 
            className="!bg-purple-600 hover:!bg-purple-700"
            style={{ fontSize: '14px' }}
          >
            {!connected ? 'Connect Wallet' : undefined}
          </WalletMultiButton>
        </div>

        {/* Main content */}
        <div className="relative z-10 pt-24 pb-12 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Title */}
            <h1 
              className="text-4xl md:text-5xl text-center mb-4 text-white"
              style={{ 
                fontFamily: '"Press Start 2P"',
                textShadow: '0 0 20px rgba(255, 0, 255, 0.8), 0 0 40px rgba(0, 255, 255, 0.6)'
              }}
            >
              LUCKY WINNERS
            </h1>
            
            <p 
              className="text-center text-pink-300 mb-12"
              style={{ 
                fontFamily: '"Press Start 2P"',
                fontSize: '12px',
                textShadow: '0 0 10px rgba(255, 0, 255, 0.6)'
              }}
            >
              Verified on-chain winning wishes
            </p>

            {/* Winners table */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 border-purple-500/50 shadow-2xl"
              style={{
                boxShadow: '0 0 30px rgba(255, 0, 255, 0.4), inset 0 0 20px rgba(0, 255, 255, 0.2)'
              }}
            >
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-white animate-pulse" style={{ fontFamily: '"Press Start 2P"' }}>
                    Loading winners...
                  </p>
                </div>
              ) : winners.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400" style={{ fontFamily: '"Press Start 2P"', fontSize: '12px' }}>
                    No winners yet. Be the first!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-purple-500/30">
                        <th className="text-left py-4 px-4 text-purple-300" 
                            style={{ fontFamily: '"Press Start 2P"', fontSize: '12px' }}>
                          Date
                        </th>
                        <th className="text-right py-4 px-4 text-purple-300" 
                            style={{ fontFamily: '"Press Start 2P"', fontSize: '12px' }}>
                          Won (WNDR)
                        </th>
                        <th className="text-center py-4 px-4 text-purple-300" 
                            style={{ fontFamily: '"Press Start 2P"', fontSize: '12px' }}>
                          Verify
                        </th>
                        <th className="text-right py-4 px-4 text-purple-300" 
                            style={{ fontFamily: '"Press Start 2P"', fontSize: '12px' }}>
                          Winner
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {winners.map((winner, index) => (
                        <tr 
                          key={`${winner.tx}-${index}`}
                          className="border-b border-purple-500/20 hover:bg-purple-500/10 transition-colors"
                        >
                          <td className="py-4 px-4 text-gray-300" 
                              style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                            {formatDate(winner.ts)}
                          </td>
                          <td className="text-right py-4 px-4 text-green-400 font-bold" 
                              style={{ fontFamily: '"Press Start 2P"', fontSize: '14px' }}>
                            {formatAmount(winner.amount)}
                          </td>
                          <td className="text-center py-4 px-4">
                            <a 
                              href={`https://solscan.io/tx/${winner.tx}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                              style={{ fontFamily: '"Press Start 2P"', fontSize: '10px' }}
                            >
                              <span>VIEW</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </td>
                          <td className="text-right py-4 px-4 text-pink-300" 
                              style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                            {formatAddress(winner.winner)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Live indicator */}
              <div className="mt-6 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs" style={{ fontFamily: '"Press Start 2P"' }}>
                  LIVE FEED
                </span>
              </div>
            </div>

            {/* Footer info */}
            <div className="mt-8 text-center">
              <p className="text-purple-300 text-xs" style={{ fontFamily: '"Press Start 2P"' }}>
                All transactions verified on Solana blockchain
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}