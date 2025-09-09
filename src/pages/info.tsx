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
          position: relative;
        }
        .info-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          background: url('/assets/backgrounds/sixseven.png') center/cover no-repeat fixed;
          z-index: -1;
        }
        .info-bg::after {
          content: '';
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: -1;
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
          background: rgba(15, 15, 25, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.10);
          padding: 32px;
          text-align: center;
          transition: all 0.3s;
          box-shadow: 0 10px 30px rgba(0,0,0,0.45);
          color: #fff;
        }
        .fallback-card h2, .fallback-card h3, .fallback-card p, .fallback-card a,
        .fallback-card div {
          color: #fff !important;
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
          background: rgba(15, 15, 25, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.10);
          padding: 32px;
          margin-bottom: 48px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.45);
          color: #fff;
        }
        
        /* Section Styling */
        .info-section {
          position: relative;
          z-index: 0;
        }
        .info-section .content {
          position: relative;
          z-index: 2;
        }
        .housing-section {
          position: relative;
          z-index: 2;
        }
        .housing-card {
          background: rgba(15, 15, 25, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 16px;
          border: 2px solid transparent;
          background-clip: padding-box;
          padding: 24px;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          color: #fff;
        }
        .housing-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 16px;
          padding: 2px;
          background: linear-gradient(45deg, #00ff00, #ff00ff, #00ffff, #ff0080);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: xor;
          z-index: -1;
        }
        .housing-card:hover {
          transform: scale(1.05);
          box-shadow: 0 0 30px rgba(0,255,255,0.4), 0 0 60px rgba(255,0,255,0.2);
        }
        .housing-card:hover::before {
          background: linear-gradient(45deg, #00ff00, #ff00ff, #00ffff, #ff0080, #00ff00);
          background-size: 400% 400%;
          animation: neonFlow 2s ease-in-out infinite;
        }
        .housing-card-inner {
          position: relative;
          z-index: 1;
        }
        
        /* Verification Section */
        .verification-section {
          position: relative;
          z-index: 2;
        }
        .trust-card, .info-card {
          background: rgba(15, 15, 25, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.10);
          padding: 20px;
          text-align: center;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(0,0,0,0.45);
          color: #fff;
        }
        .info-card h2, .info-card h3, .info-card p, .info-card a, 
        .trust-card h2, .trust-card h3, .trust-card p, .trust-card a {
          color: #fff !important;
        }
        .info-card a, .trust-card a {
          text-decoration: underline;
        }
        .trust-card:hover {
          transform: translateY(-5px);
          border-color: rgba(0,255,255,0.6);
          box-shadow: 0 8px 25px rgba(0,255,255,0.2);
        }
        .trust-icon {
          font-size: 24px;
          margin-bottom: 12px;
          filter: drop-shadow(0 0 10px rgba(0,255,255,0.5));
        }
        .trust-title {
          font-family: "Press Start 2P";
          font-size: 10px;
          color: #00ffff;
          margin-bottom: 8px;
          text-shadow: 0 0 10px rgba(0,255,255,0.5);
        }
        .trust-desc {
          color: #a0a0a0;
          font-size: 12px;
          line-height: 1.4;
        }
        
        .glass-table-container {
          background: rgba(15, 15, 25, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.10);
          padding: 32px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.45);
          color: #fff;
        }
        
        .neon-button {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(45deg, #7c3aed, #3b82f6, #06b6d4);
          color: white;
          padding: 16px 32px;
          border-radius: 12px;
          font-family: "Press Start 2P";
          font-size: 12px;
          font-weight: 600;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(124,58,237,0.4);
        }
        .neon-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }
        .neon-button:hover {
          transform: scale(1.05);
          box-shadow: 
            0 0 30px rgba(124,58,237,0.6),
            0 0 60px rgba(59,130,246,0.4),
            0 0 90px rgba(6,182,212,0.3);
          border-color: rgba(0,255,255,0.5);
        }
        .neon-button:hover::before {
          left: 100%;
        }
        
        @keyframes neonFlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      <div className="info-bg min-h-screen fallback-container">
        <div className="relative z-10 min-h-screen">
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

          {/* Housing Options Section */}
          <div className="housing-section relative mb-16">
            <div className="text-center mb-12">
              <div className="text-6xl mb-6 animate-pulse">🏠</div>
              <h2 className="text-4xl font-bold text-white mb-4" style={{fontFamily: '"Press Start 2P"', textShadow: '0 0 20px rgba(0,255,255,0.8), 0 0 40px rgba(255,0,255,0.6)'}}>
                HOUSING OPTIONS
              </h2>
              <p className="text-pink-300 mb-8" style={{fontFamily: '"Press Start 2P"', fontSize: '14px'}}>
                Unlock gameplay bonuses with premium housing
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              <div className="housing-card group">
                <div className="housing-card-inner">
                  <div className="text-4xl mb-4">🏚️</div>
                  <h3 className="text-lg font-bold text-green-400 mb-2" style={{fontFamily: '"Press Start 2P"', fontSize: '12px'}}>STARTER SHACK</h3>
                  <div className="text-2xl text-green-300 font-bold mb-2">+0.5%</div>
                  <p className="text-gray-300 text-sm mb-4">Basic shelter with minimal bonuses</p>
                  <div className="text-yellow-400 text-sm">Entry Level</div>
                </div>
              </div>
              
              <div className="housing-card group">
                <div className="housing-card-inner">
                  <div className="text-4xl mb-4">🏠</div>
                  <h3 className="text-lg font-bold text-green-400 mb-2" style={{fontFamily: '"Press Start 2P"', fontSize: '12px'}}>COZY COTTAGE</h3>
                  <div className="text-2xl text-green-300 font-bold mb-2">+1.5%</div>
                  <p className="text-gray-300 text-sm mb-4">Comfortable living with decent returns</p>
                  <div className="text-yellow-400 text-sm">Popular Choice</div>
                </div>
              </div>
              
              <div className="housing-card group">
                <div className="housing-card-inner">
                  <div className="text-4xl mb-4">🏡</div>
                  <h3 className="text-lg font-bold text-green-400 mb-2" style={{fontFamily: '"Press Start 2P"', fontSize: '12px'}}>SUBURBAN HOME</h3>
                  <div className="text-2xl text-green-300 font-bold mb-2">+4.0%</div>
                  <p className="text-gray-300 text-sm mb-4">Spacious family home with solid bonuses</p>
                  <div className="text-blue-400 text-sm">Recommended</div>
                </div>
              </div>
              
              <div className="housing-card group">
                <div className="housing-card-inner">
                  <div className="text-4xl mb-4">🏘️</div>
                  <h3 className="text-lg font-bold text-green-400 mb-2" style={{fontFamily: '"Press Start 2P"', fontSize: '12px'}}>LUXURY VILLA</h3>
                  <div className="text-2xl text-green-300 font-bold mb-2">+8.0%</div>
                  <p className="text-gray-300 text-sm mb-4">Premium lifestyle with high returns</p>
                  <div className="text-purple-400 text-sm">Luxury Tier</div>
                </div>
              </div>
              
              <div className="housing-card group">
                <div className="housing-card-inner">
                  <div className="text-4xl mb-4">🏰</div>
                  <h3 className="text-lg font-bold text-green-400 mb-2" style={{fontFamily: '"Press Start 2P"', fontSize: '12px'}}>GRAND MANSION</h3>
                  <div className="text-2xl text-green-300 font-bold mb-2">+15.0%</div>
                  <p className="text-gray-300 text-sm mb-4">Elite residence for serious players</p>
                  <div className="text-pink-400 text-sm">Elite Status</div>
                </div>
              </div>
              
              <div className="housing-card group">
                <div className="housing-card-inner">
                  <div className="text-4xl mb-4">👑</div>
                  <h3 className="text-lg font-bold text-green-400 mb-2" style={{fontFamily: '"Press Start 2P"', fontSize: '12px'}}>ROYAL PALACE</h3>
                  <div className="text-2xl text-green-300 font-bold mb-2">+25.0%</div>
                  <p className="text-gray-300 text-sm mb-4">Ultimate prestige with maximum rewards</p>
                  <div className="text-red-400 text-sm animate-pulse">Legendary</div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Link href="/upgrades" className="neon-button">
                <span>🏠 ENTER HOUSING DISTRICT</span>
              </Link>
            </div>
          </div>

          {/* Gambling Verification Section */}
          <div className="verification-section relative mb-16">
            <div className="text-center mb-12">
              <div className="flex justify-center items-center gap-4 mb-6">
                <div className="text-4xl animate-pulse">🔍</div>
                <div className="text-2xl text-green-400 animate-pulse">✅</div>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4" style={{fontFamily: '"Press Start 2P"', textShadow: '0 0 20px rgba(0,255,0,0.8), 0 0 40px rgba(0,255,255,0.6)'}}>
                GAMBLING VERIFICATION
              </h2>
              <p className="text-green-300 mb-4" style={{fontFamily: '"Press Start 2P"', fontSize: '12px'}}>
                VERIFIED ON-CHAIN • 100% TRANSPARENT • PROVABLY FAIR
              </p>
              <div className="flex justify-center items-center gap-2 mb-8">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm" style={{fontFamily: '"Press Start 2P"'}}>BLOCKCHAIN VERIFIED</span>
              </div>
            </div>
            
            {/* Trust Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="trust-card">
                <div className="trust-icon">👤</div>
                <h4 className="trust-title">WALLET</h4>
                <p className="trust-desc">Anonymous wallet addresses with full transaction history</p>
              </div>
              
              <div className="trust-card">
                <div className="trust-icon">💰</div>
                <h4 className="trust-title">AMOUNT</h4>
                <p className="trust-desc">Exact $WISH amounts won, verified on-chain</p>
              </div>
              
              <div className="trust-card">
                <div className="trust-icon">🔗</div>
                <h4 className="trust-title">TRANSACTION</h4>
                <p className="trust-desc">Direct links to Solana blockchain explorers</p>
              </div>
              
              <div className="trust-card">
                <div className="trust-icon">⏰</div>
                <h4 className="trust-title">TIMESTAMP</h4>
                <p className="trust-desc">Exact time of each verified gambling result</p>
              </div>
            </div>
            
            {/* Results Table */}
            <div className="glass-table-container">
              <div className="flex justify-center items-center gap-3 mb-6">
                <h3 className="text-2xl font-bold text-cyan-400" style={{fontFamily: '"Press Start 2P"', fontSize: '16px'}}>RECENT RESULTS</h3>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              
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
      </div>
    </>
  )
}