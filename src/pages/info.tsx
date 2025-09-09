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
        <style jsx global>{`
          .bg-gradient-radial {
            background: radial-gradient(circle, var(--tw-gradient-stops));
          }
        `}</style>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900 relative overflow-hidden">
        {/* Purple Galaxy Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-transparent to-transparent"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-pink-500/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-radial from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-gradient-radial from-violet-400/15 to-transparent rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="bg-black/50 backdrop-blur-sm border-b border-purple-500/30">
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
          
          {/* Main Content */}
          <main className="container mx-auto px-6 py-16">
            {/* Title Section */}
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Information Center
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Learn everything about how Wishing works: gameplay, housing, and verifiable gambling mechanics.
              </p>
            </div>

            {/* Table of Contents */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-8 mb-12 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-purple-400 mb-6 text-center">Quick Navigation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <a href="#what-is-wishing" className="bg-black/30 p-4 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-black/50 transition-all">
                  <div className="font-semibold">🎮 What is Wishing?</div>
                </a>
                <a href="#how-to-play" className="bg-black/30 p-4 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-black/50 transition-all">
                  <div className="font-semibold">🕹️ How to Play</div>
                </a>
                <a href="#housing-system" className="bg-black/30 p-4 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-black/50 transition-all">
                  <div className="font-semibold">🏠 Housing System</div>
                </a>
                <a href="#gambling-verification" className="bg-black/30 p-4 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-black/50 transition-all">
                  <div className="font-semibold">🔍 Verification</div>
                </a>
                <a href="#fairness-limits" className="bg-black/30 p-4 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-black/50 transition-all">
                  <div className="font-semibold">⚖️ Fairness & Limits</div>
                </a>
                <a href="#faq" className="bg-black/30 p-4 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-black/50 transition-all">
                  <div className="font-semibold">❓ FAQ</div>
                </a>
              </div>
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
              {/* What is Wishing */}
              <section id="what-is-wishing" className="bg-white/10 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-8 hover:bg-white/15 transition-all">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-4">🎮</div>
                  <h2 className="text-2xl font-bold text-purple-400 mb-4">What is Wishing?</h2>
                </div>
                <div className="text-gray-300 leading-relaxed space-y-4">
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
              <section id="how-to-play" className="bg-white/10 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-8 hover:bg-white/15 transition-all">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-4">🕹️</div>
                  <h2 className="text-2xl font-bold text-purple-400 mb-4">How to Play</h2>
                </div>
                <div className="text-gray-300 leading-relaxed space-y-4">
                  <ol className="list-decimal list-inside space-y-3">
                    <li>Connect your Solana wallet (Phantom recommended)</li>
                    <li>Use WASD or arrow keys to move your character around</li>
                    <li>Interact with different portals to access various features:
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-sm">
                        <li>Portal 1: Housing District & Upgrades</li>
                        <li>Portal 3: Recent Winners & Statistics</li>
                        <li>Portal 4: Information & Help (this page)</li>
                        <li>Fountain Area: $WISH Token Gambling</li>
                      </ul>
                    </li>
                    <li>Move to the fountain center to participate in gambling mechanics</li>
                    <li>Visit the upgrades page to purchase houses for gameplay bonuses</li>
                  </ol>
                </div>
              </section>

              {/* Housing System */}
              <section id="housing-system" className="bg-white/10 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-8 hover:bg-white/15 transition-all lg:col-span-2">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-4">🏠</div>
                  <h2 className="text-2xl font-bold text-purple-400 mb-4">Housing System</h2>
                </div>
                <div className="text-gray-300 leading-relaxed space-y-6">
                  <p className="text-center">
                    Houses provide gameplay bonuses and can be purchased with burned $WISH tokens. 
                    There are 6 tiers of houses, each offering increased win rate bonuses:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-black/30 p-4 rounded-lg border border-green-500/30">
                      <div className="text-green-400 font-bold text-lg">Tier 1: Starter Shack</div>
                      <div className="text-green-300">+0.5% Win Boost</div>
                    </div>
                    <div className="bg-black/30 p-4 rounded-lg border border-green-500/30">
                      <div className="text-green-400 font-bold text-lg">Tier 2: Cozy Cottage</div>
                      <div className="text-green-300">+1.5% Win Boost</div>
                    </div>
                    <div className="bg-black/30 p-4 rounded-lg border border-green-500/30">
                      <div className="text-green-400 font-bold text-lg">Tier 3: Suburban Home</div>
                      <div className="text-green-300">+4.0% Win Boost</div>
                    </div>
                    <div className="bg-black/30 p-4 rounded-lg border border-green-500/30">
                      <div className="text-green-400 font-bold text-lg">Tier 4: Luxury Villa</div>
                      <div className="text-green-300">+8.0% Win Boost</div>
                    </div>
                    <div className="bg-black/30 p-4 rounded-lg border border-green-500/30">
                      <div className="text-green-400 font-bold text-lg">Tier 5: Grand Mansion</div>
                      <div className="text-green-300">+15.0% Win Boost</div>
                    </div>
                    <div className="bg-black/30 p-4 rounded-lg border border-green-500/30">
                      <div className="text-green-400 font-bold text-lg">Tier 6: Royal Palace</div>
                      <div className="text-green-300">+25.0% Win Boost</div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-6 pt-4">
                    <Link href="/upgrades" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                      → Visit Upgrades Page
                    </Link>
                    <Link href="/house" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                      → View My House
                    </Link>
                  </div>
                </div>
              </section>

            </div>

            {/* Gambling Mechanics & Verification - Full Width */}
            <section id="gambling-verification" className="bg-white/10 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-8 mb-12">
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">🔍</div>
                <h2 className="text-3xl font-bold text-purple-400 mb-4">Gambling Mechanics & Verification</h2>
                <p className="text-gray-300 max-w-3xl mx-auto">
                  Every gambling result is transparent and verifiable on the Solana blockchain
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-black/30 p-6 rounded-lg text-center">
                  <div className="text-2xl mb-3">📊</div>
                  <h3 className="text-lg font-bold text-cyan-400 mb-2">Transparent Results</h3>
                  <p className="text-gray-300 text-sm">Every win is recorded with wallet address, amount, transaction ID, and timestamp</p>
                </div>
                <div className="bg-black/30 p-6 rounded-lg text-center">
                  <div className="text-2xl mb-3">🔗</div>
                  <h3 className="text-lg font-bold text-cyan-400 mb-2">Blockchain Verified</h3>
                  <p className="text-gray-300 text-sm">Independently verify each result on Solana explorers like Solscan</p>
                </div>
                <div className="bg-black/30 p-6 rounded-lg text-center">
                  <div className="text-2xl mb-3">⏱️</div>
                  <h3 className="text-lg font-bold text-cyan-400 mb-2">Real-Time Updates</h3>
                  <p className="text-gray-300 text-sm">Live table showing the most recent gambling outcomes</p>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-2xl font-bold text-cyan-400 mb-6 text-center">Recent Gambling Results</h3>
                <StatsTable 
                  stats={stats} 
                  loading={loading} 
                  error={error}
                  onRetry={fetchStats}
                />
              </div>
            </section>

            {/* Additional Info Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">

              {/* Fairness & Limits */}
              <section id="fairness-limits" className="bg-white/10 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-8 hover:bg-white/15 transition-all">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-4">⚖️</div>
                  <h2 className="text-2xl font-bold text-purple-400 mb-4">Fairness & Limits</h2>
                </div>
                <div className="text-gray-300 leading-relaxed space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-green-400">✓</span>
                      <span>All gambling mechanics use provably fair randomization</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-400">✓</span>
                      <span>Minimum bet: 1,000 $WISH tokens</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-400">✓</span>
                      <span>All transactions are processed on the Solana blockchain</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-400">✓</span>
                      <span>Win rates are transparent and verifiable through transaction history</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-400">✓</span>
                      <span>Housing bonuses stack additively with base win rates</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* FAQ */}
              <section id="faq" className="bg-white/10 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-8 hover:bg-white/15 transition-all">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-4">❓</div>
                  <h2 className="text-2xl font-bold text-purple-400 mb-4">FAQ</h2>
                </div>
                <div className="text-gray-300 leading-relaxed space-y-6">
                  <div className="bg-black/30 p-4 rounded-lg">
                    <h4 className="text-cyan-400 font-bold mb-2">What wallets are supported?</h4>
                    <p>We support all Solana wallets, with Phantom being the recommended choice for the best experience.</p>
                  </div>
                  
                  <div className="bg-black/30 p-4 rounded-lg">
                    <h4 className="text-cyan-400 font-bold mb-2">What if I encounter errors?</h4>
                    <p>Most errors are related to wallet connection or insufficient token balance. Ensure your wallet is connected and you have enough $WISH tokens for transactions.</p>
                  </div>
                  
                  <div className="bg-black/30 p-4 rounded-lg">
                    <h4 className="text-cyan-400 font-bold mb-2">Is my data private and secure?</h4>
                    <p>We only use your wallet address for on-chain transactions. No personal information is collected or stored. All gameplay data is public on the Solana blockchain.</p>
                  </div>
                  
                  <div className="bg-black/30 p-4 rounded-lg">
                    <h4 className="text-cyan-400 font-bold mb-2">How can I verify transactions?</h4>
                    <p>Every transaction has a unique signature that can be viewed on Solscan.io. Click any "VIEW TX" link in the results table above.</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="text-center">
              <Link 
                href="/"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                ← Return to Game
              </Link>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}