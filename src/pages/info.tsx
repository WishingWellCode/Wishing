import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import StatsTable from '@/components/StatsTable'

interface StatsEntry {
  winner: string
  amount: string
  tx: string
  ts: string
}

interface InfoSection {
  id: string
  title: string
  icon: string
  content: React.ReactNode
}

export default function InfoPage() {
  const router = useRouter()
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
      const response = await fetch('https://wish-well-worker.stealthbundlebot.workers.dev/api/stats/latest?limit=20')
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

  const infoSections: InfoSection[] = [
    {
      id: 'what-is-wishing',
      title: 'What is Wishing?',
      icon: '🎮',
      content: (
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
      )
    },
    {
      id: 'how-to-play',
      title: 'How to Play',
      icon: '🕹️',
      content: (
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
      )
    },
    {
      id: 'fairness-limits',
      title: 'Fairness & Limits',
      icon: '⚖️',
      content: (
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
      )
    },
    {
      id: 'faq',
      title: 'FAQ',
      icon: '❓',
      content: (
        <div className="text-gray-300 leading-relaxed space-y-4">
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
      )
    }
  ]

  return (
    <>
      <Head>
        <title>Information Center - $WISH Wishing Well</title>
        <meta name="description" content="Learn about Wishing gameplay, housing system, and verifiable gambling mechanics!" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </Head>

      {/* Fallback CSS - Ensures page always renders correctly even if Tailwind fails */}
      <style jsx global>{`
        /* Override global body overflow hidden for info page */
        body {
          overflow: auto !important;
          overflow-x: hidden !important;
        }
        .fallback-container {
          min-height: 100vh;
          background: 
            radial-gradient(2px 2px at 20% 30%, #fff, transparent),
            radial-gradient(2px 2px at 40% 70%, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 90% 40%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.4), transparent),
            radial-gradient(2px 2px at 80% 10%, rgba(255,255,255,0.7), transparent),
            radial-gradient(1px 1px at 10% 80%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 30% 20%, rgba(255,255,255,0.3), transparent),
            radial-gradient(2px 2px at 70% 80%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 60% 30%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 25% 60%, rgba(255,255,255,0.3), transparent),
            radial-gradient(2px 2px at 85% 60%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 15% 40%, rgba(255,255,255,0.4), transparent),
            linear-gradient(135deg, #1a0b2e 0%, #16213e 20%, #0f3460 40%, #533b7d 60%, #7209b7 80%, #2d1b69 100%),
            radial-gradient(ellipse at center, rgba(138, 43, 226, 0.15) 0%, transparent 50%);
          background-size: 
            400px 400px, 300px 300px, 200px 200px, 250px 250px, 350px 350px,
            180px 180px, 220px 220px, 320px 320px, 280px 280px, 240px 240px,
            360px 360px, 160px 160px, 100% 100%, 100% 100%;
        }
        .fallback-header {
          background: rgba(0,0,0,0.2);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .fallback-header-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .fallback-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(to right, #7c3aed, #3b82f6);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .fallback-btn:hover {
          background: linear-gradient(to right, #6d28d9, #2563eb);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .fallback-main {
          max-width: 1152px;
          margin: 0 auto;
          padding: 48px 24px;
        }
        .fallback-title {
          font-size: 48px;
          font-weight: bold;
          color: white;
          text-align: center;
          margin-bottom: 16px;
        }
        .fallback-subtitle {
          font-size: 20px;
          color: #d1d5db;
          text-align: center;
          margin-bottom: 32px;
          max-width: 768px;
          margin-left: auto;
          margin-right: auto;
        }
        .fallback-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          max-width: 1024px;
          margin: 0 auto 64px;
        }
        @media (max-width: 768px) {
          .fallback-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
        .fallback-card {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          border: 2px solid rgba(139, 92, 246, 0.3);
          padding: 32px;
          text-align: center;
          transition: all 0.3s;
        }
        .fallback-card:hover {
          transform: scale(1.05);
          background: rgba(255,255,255,0.15);
        }
        .fallback-section-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }
        .fallback-section-title {
          font-size: 24px;
          font-weight: bold;
          color: #8b5cf6;
          margin-bottom: 16px;
        }
        .fallback-section-desc {
          color: #d1d5db;
          margin-bottom: 32px;
          line-height: 1.6;
        }
        .fallback-verification-section {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          border: 2px solid rgba(139, 92, 246, 0.3);
          padding: 32px;
          margin-bottom: 48px;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 fallback-container">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-sm border-b border-purple-500/20 fallback-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 fallback-header-content">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl fallback-btn"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Game
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-6 py-12 fallback-main">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-4 fallback-title">
              Information Center
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto fallback-subtitle">
              Learn everything about how Wishing works: gameplay, housing, and verifiable gambling mechanics.
            </p>
          </div>

          {/* 2x2 Grid of Info Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16 fallback-grid">
            {infoSections.map((section) => (
              <div key={section.id} className="bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-purple-500/30 p-8 text-center transition-all duration-300 hover:scale-105 fallback-card">
                <div className="mb-6">
                  <div className="text-6xl mb-6 fallback-section-icon">{section.icon}</div>
                </div>
                
                <h2 className="text-3xl font-bold text-purple-400 mb-6 fallback-section-title">
                  {section.title}
                </h2>
                
                <div className="fallback-section-desc">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          {/* Housing System - Full Width */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-purple-500/30 p-8 mb-16 fallback-verification-section">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🏠</div>
              <h2 className="text-3xl font-bold text-purple-400 mb-4">Housing System</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Houses provide gameplay bonuses and can be purchased with burned $WISH tokens.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-black/30 p-6 rounded-lg text-center border border-green-500/30">
                <h3 className="text-lg font-bold text-green-400 mb-2">Tier 1: Starter Shack</h3>
                <p className="text-green-300">+0.5% Win Boost</p>
              </div>
              <div className="bg-black/30 p-6 rounded-lg text-center border border-green-500/30">
                <h3 className="text-lg font-bold text-green-400 mb-2">Tier 2: Cozy Cottage</h3>
                <p className="text-green-300">+1.5% Win Boost</p>
              </div>
              <div className="bg-black/30 p-6 rounded-lg text-center border border-green-500/30">
                <h3 className="text-lg font-bold text-green-400 mb-2">Tier 3: Suburban Home</h3>
                <p className="text-green-300">+4.0% Win Boost</p>
              </div>
              <div className="bg-black/30 p-6 rounded-lg text-center border border-green-500/30">
                <h3 className="text-lg font-bold text-green-400 mb-2">Tier 4: Luxury Villa</h3>
                <p className="text-green-300">+8.0% Win Boost</p>
              </div>
              <div className="bg-black/30 p-6 rounded-lg text-center border border-green-500/30">
                <h3 className="text-lg font-bold text-green-400 mb-2">Tier 5: Grand Mansion</h3>
                <p className="text-green-300">+15.0% Win Boost</p>
              </div>
              <div className="bg-black/30 p-6 rounded-lg text-center border border-green-500/30">
                <h3 className="text-lg font-bold text-green-400 mb-2">Tier 6: Royal Palace</h3>
                <p className="text-green-300">+25.0% Win Boost</p>
              </div>
            </div>
            
            <div className="text-center">
              <Link href="/upgrades" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold text-lg mr-4 transition-colors">
                🏠 View Housing District
              </Link>
            </div>
          </div>

          {/* Gambling Verification - Full Width */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-purple-500/30 p-8 mb-16 fallback-verification-section">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-3xl font-bold text-purple-400 mb-4">Gambling Verification</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Every gambling result is transparent and verifiable on the Solana blockchain
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-black/30 p-6 rounded-lg text-center">
                <div className="text-2xl mb-3">📊</div>
                <h3 className="text-lg font-bold text-cyan-400 mb-2">Transparent Results</h3>
                <p className="text-gray-300 text-sm">Every win recorded with wallet, amount, transaction, and timestamp</p>
              </div>
              <div className="bg-black/30 p-6 rounded-lg text-center">
                <div className="text-2xl mb-3">🔗</div>
                <h3 className="text-lg font-bold text-cyan-400 mb-2">Blockchain Verified</h3>
                <p className="text-gray-300 text-sm">Verify each result on Solana explorers like Solscan</p>
              </div>
              <div className="bg-black/30 p-6 rounded-lg text-center">
                <div className="text-2xl mb-3">⏱️</div>
                <h3 className="text-lg font-bold text-cyan-400 mb-2">Real-Time Updates</h3>
                <p className="text-gray-300 text-sm">Live table of recent gambling outcomes</p>
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
          </div>

          {/* Return to Game */}
          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-16 py-6 rounded-2xl font-bold text-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              🎮 Return to Game
            </button>
          </div>
        </main>
      </div>
    </>
  )
}