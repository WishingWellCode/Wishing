import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import StatsTable from '@/components/StatsTable'

interface StatsEntry {
  winner: string
  amount: string
  tx: string
  ts: string
}

export default function InfoPage() {
  const [stats, setStats] = useState<StatsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Track page view
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'info.view')
    } else {
      console.log('Analytics: info.view')
    }

    // Fetch stats data
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stats/latest?limit=20')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        throw new Error('Failed to fetch stats')
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Unable to load verification data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Info — Wishing</title>
        <meta
          name="description"
          content="How Wishing works: gameplay, housing, and verifiable gambling statistics with on-chain proofs."
        />
        <meta property="og:title" content="Info — Wishing" />
        <meta
          property="og:description"
          content="How Wishing works: gameplay, housing, and verifiable gambling statistics with on-chain proofs."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Info — Wishing" />
        <meta
          name="twitter:description"
          content="How Wishing works: gameplay, housing, and verifiable gambling statistics with on-chain proofs."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </Head>

      <div 
        className="min-h-screen bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: 'url(/assets/backgrounds/Realbackground.jpg)'
        }}
      >
        <div className="min-h-screen bg-black/60">
          {/* Header */}
          <div className="bg-black/80 border-b border-purple-500">
            <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-pixel text-purple-400">Info — Wishing</h1>
              <Link 
                href="/"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-pixel text-sm transition-colors"
              >
                ← Back to Game
              </Link>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="max-w-6xl mx-auto px-6 py-6">
            <nav className="bg-black/80 border border-purple-500 rounded-lg p-4 mb-8">
              <h2 className="text-lg font-pixel text-purple-400 mb-4">Contents</h2>
              <ul className="space-y-2 text-sm font-pixel text-white">
                <li><a href="#what-is-wishing" className="text-cyan-400 hover:text-cyan-300">What is Wishing?</a></li>
                <li><a href="#how-to-play" className="text-cyan-400 hover:text-cyan-300">How to Play</a></li>
                <li><a href="#housing-system" className="text-cyan-400 hover:text-cyan-300">Housing System</a></li>
                <li><a href="#gambling-verification" className="text-cyan-400 hover:text-cyan-300">Gambling Mechanics & Verification</a></li>
                <li><a href="#fairness-limits" className="text-cyan-400 hover:text-cyan-300">Fairness & Limits</a></li>
                <li><a href="#faq" className="text-cyan-400 hover:text-cyan-300">FAQ</a></li>
              </ul>
            </nav>

            {/* Content Sections */}
            <div className="space-y-8">
              {/* What is Wishing */}
              <section id="what-is-wishing" className="bg-black/80 border border-purple-500 rounded-lg p-6">
                <h2 className="text-xl font-pixel text-purple-400 mb-4">What is Wishing?</h2>
                <div className="text-white font-pixel text-sm leading-relaxed space-y-4">
                  <p>
                    Wishing is a Solana-based interactive experience where players can explore a virtual world, 
                    participate in on-chain gambling mechanics, and build their housing portfolio.
                  </p>
                  <p>
                    The game revolves around the $WISH token and provides transparent, verifiable gameplay 
                    through blockchain technology. Every interaction is recorded on-chain for complete transparency.
                  </p>
                </div>
              </section>

              {/* How to Play */}
              <section id="how-to-play" className="bg-black/80 border border-purple-500 rounded-lg p-6">
                <h2 className="text-xl font-pixel text-purple-400 mb-4">How to Play</h2>
                <div className="text-white font-pixel text-sm leading-relaxed space-y-4">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Connect your Solana wallet (Phantom recommended)</li>
                    <li>Use WASD or arrow keys to move your character around</li>
                    <li>Interact with different portals to access various features:</li>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Portal 1: Housing District & Upgrades</li>
                      <li>Portal 3: Recent Winners & Statistics</li>
                      <li>Portal 4: Information & Help (this page)</li>
                      <li>Fountain Area: $WISH Token Gambling</li>
                    </ul>
                    <li>Move to the fountain center to participate in gambling mechanics</li>
                    <li>Visit the upgrades page to purchase houses for gameplay bonuses</li>
                  </ol>
                </div>
              </section>

              {/* Housing System */}
              <section id="housing-system" className="bg-black/80 border border-purple-500 rounded-lg p-6">
                <h2 className="text-xl font-pixel text-purple-400 mb-4">Housing System</h2>
                <div className="text-white font-pixel text-sm leading-relaxed space-y-4">
                  <p>
                    Houses provide gameplay bonuses and can be purchased with $WISH tokens. 
                    There are 6 tiers of houses, each offering increased win rate bonuses:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                      <div className="text-green-400 font-bold">Tier 1: Starter Shack</div>
                      <div className="text-xs">+0.5% Win Boost</div>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                      <div className="text-green-400 font-bold">Tier 2: Cozy Cottage</div>
                      <div className="text-xs">+1.5% Win Boost</div>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                      <div className="text-green-400 font-bold">Tier 3: Suburban Home</div>
                      <div className="text-xs">+4.0% Win Boost</div>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                      <div className="text-green-400 font-bold">Tier 4: Luxury Villa</div>
                      <div className="text-xs">+8.0% Win Boost</div>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                      <div className="text-green-400 font-bold">Tier 5: Grand Mansion</div>
                      <div className="text-xs">+15.0% Win Boost</div>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                      <div className="text-green-400 font-bold">Tier 6: Royal Palace</div>
                      <div className="text-xs">+25.0% Win Boost</div>
                    </div>
                  </div>
                  <p className="mt-4">
                    <Link href="/upgrades" className="text-cyan-400 hover:text-cyan-300">
                      → Visit Upgrades Page
                    </Link>
                    {" | "}
                    <Link href="/house" className="text-cyan-400 hover:text-cyan-300">
                      → View My Current House
                    </Link>
                  </p>
                </div>
              </section>

              {/* Gambling Mechanics & Verification */}
              <section id="gambling-verification" className="bg-black/80 border border-purple-500 rounded-lg p-6">
                <h2 className="text-xl font-pixel text-purple-400 mb-4">Gambling Mechanics & Verification</h2>
                <div className="text-white font-pixel text-sm leading-relaxed space-y-4">
                  <ul className="list-disc list-inside space-y-2">
                    <li>Every win is recorded with the winner's wallet, the amount, the on-chain transaction, and the exact timestamp.</li>
                    <li>You can independently verify each result on Solana explorers (e.g., Solscan).</li>
                    <li>The table below shows the most recent outcomes.</li>
                  </ul>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-pixel text-cyan-400 mb-4">Recent Gambling Results</h3>
                    <StatsTable 
                      stats={stats} 
                      loading={loading} 
                      error={error}
                      onRetry={fetchStats}
                    />
                  </div>
                </div>
              </section>

              {/* Fairness & Limits */}
              <section id="fairness-limits" className="bg-black/80 border border-purple-500 rounded-lg p-6">
                <h2 className="text-xl font-pixel text-purple-400 mb-4">Fairness & Limits</h2>
                <div className="text-white font-pixel text-sm leading-relaxed space-y-4">
                  <ul className="list-disc list-inside space-y-2">
                    <li>All gambling mechanics use provably fair randomization</li>
                    <li>Minimum bet: 1,000 $WISH tokens</li>
                    <li>All transactions are processed on the Solana blockchain</li>
                    <li>Win rates are transparent and verifiable through transaction history</li>
                    <li>Housing bonuses stack additively with base win rates</li>
                  </ul>
                </div>
              </section>

              {/* FAQ */}
              <section id="faq" className="bg-black/80 border border-purple-500 rounded-lg p-6">
                <h2 className="text-xl font-pixel text-purple-400 mb-4">FAQ</h2>
                <div className="text-white font-pixel text-sm leading-relaxed space-y-6">
                  <div>
                    <h4 className="text-cyan-400 font-bold mb-2">What wallets are supported?</h4>
                    <p>We support all Solana wallets, with Phantom being the recommended choice for the best experience.</p>
                  </div>
                  
                  <div>
                    <h4 className="text-cyan-400 font-bold mb-2">What if I encounter errors?</h4>
                    <p>Most errors are related to wallet connection or insufficient token balance. Ensure your wallet is connected and you have enough $WISH tokens for transactions.</p>
                  </div>
                  
                  <div>
                    <h4 className="text-cyan-400 font-bold mb-2">Is my data private and secure?</h4>
                    <p>We only use your wallet address for on-chain transactions. No personal information is collected or stored. All gameplay data is public on the Solana blockchain.</p>
                  </div>
                  
                  <div>
                    <h4 className="text-cyan-400 font-bold mb-2">How can I verify transactions?</h4>
                    <p>Every transaction has a unique signature that can be viewed on Solscan.io. Click any "VIEW TX" link in the results table above.</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center">
              <Link 
                href="/"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded font-pixel text-sm transition-colors"
              >
                ← Return to Game
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}