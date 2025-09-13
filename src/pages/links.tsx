import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

interface SocialLink {
  name: string
  url: string | null
  icon: string
  color: string
  status?: string
  description: string
}

export default function Links() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Track page view
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'links.view')
    } else {
      console.log('Analytics: links.view')
    }
  }, [])

  const socialLinks: SocialLink[] = [
    {
      name: 'Twitter',
      url: 'https://x.com/wndrSOL',
      icon: '𝕏',
      color: '#1DA1F2',
      description: 'Follow us for the latest updates, announcements, and community highlights'
    },
    {
      name: 'Documentation',
      url: 'https://medium.com/@wndrsol/wndr-brings-progressive-multiplayer-on-chain-gaming-to-solana-475a14fcd215',
      icon: '📖',
      color: '#00D084',
      description: 'Read our comprehensive documentation and learn about WNDR gaming'
    },
    {
      name: 'Discord',
      url: null,
      icon: '💬',
      color: '#5865F2',
      status: 'Coming Soon',
      description: 'Connect with players, share strategies, and participate in events'
    },
    {
      name: 'Dev Wallet',
      url: null,
      icon: '💰',
      color: '#9945FF',
      status: 'TBD',
      description: 'View developer wallet address for transparency and verification'
    }
  ]

  const handleLinkClick = (link: SocialLink) => {
    if (link.url) {
      window.open(link.url, '_blank', 'noopener,noreferrer')
    }
  }

  if (!mounted) return null

  return (
    <>
      <Head>
        <title>Community Links - $WNDR Wishing Well</title>
        <meta name="description" content="Connect with the $WNDR community through our social media channels" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </Head>

      {/* Fallback CSS - Ensures page always renders correctly even if Tailwind fails */}
      <style jsx global>{`
        /* Override global body overflow hidden for links page */
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          overflow: auto !important;
          overflow-x: hidden !important;
        }
        .fallback-container {
          min-height: 100vh;
          position: relative;
        }
        .links-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          background: url('/assets/backgrounds/sixseven.png') center/cover no-repeat fixed;
          z-index: -1;
        }
        .links-bg::after {
          content: '';
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
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
          position: relative;
          overflow: hidden;
        }
        .fallback-card h2, .fallback-card h3, .fallback-card p, .fallback-card a,
        .fallback-card div, .fallback-card span {
          color: #fff !important;
        }
        .fallback-card:hover {
          transform: scale(1.05);
          background: rgba(255,255,255,0.15);
        }
        .fallback-card.clickable {
          cursor: pointer;
        }
        .fallback-card.clickable:hover {
          border-color: rgba(0,255,255,0.5);
          box-shadow: 0 0 30px rgba(0,255,255,0.3);
        }
        .fallback-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .fallback-card.disabled:hover {
          transform: none;
          background: rgba(15, 15, 25, 0.72);
          border-color: rgba(255,255,255,0.10);
          box-shadow: 0 10px 30px rgba(0,0,0,0.45);
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
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          margin-top: 8px;
        }
        .status-available {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .status-pending {
          background: rgba(234, 179, 8, 0.2);
          color: #eab308;
          border: 1px solid rgba(234, 179, 8, 0.3);
        }
      `}</style>

      <div className="links-bg min-h-screen fallback-container">
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
              Community Links
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto fallback-subtitle">
              Connect with the $WNDR community through our social media channels and stay updated on the latest developments.
            </p>
          </div>

          {/* Social Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16 fallback-grid">
            {socialLinks.map((link) => (
              <div 
                key={link.name} 
                className={`fallback-card ${link.url ? 'clickable' : 'disabled'}`}
                onClick={() => handleLinkClick(link)}
              >
                <div className="mb-6">
                  <div className="text-6xl mb-6 fallback-section-icon">{link.icon}</div>
                </div>
                
                <h2 className="text-3xl font-bold text-purple-400 mb-6 fallback-section-title">
                  {link.name}
                </h2>
                
                <div className="fallback-section-desc">
                  <p className="text-gray-300 leading-relaxed mb-4">
                    {link.description}
                  </p>
                  
                  {link.url ? (
                    <div className="status-badge status-available">
                      Click to Visit →
                    </div>
                  ) : (
                    <div className="status-badge status-pending">
                      {link.status}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>


        </main>
        </div>
      </div>
    </>
  )
}