import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

interface SocialLink {
  name: string
  url: string | null
  icon: string
  color: string
  status?: string
}

export default function Links() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const socialLinks: SocialLink[] = [
    {
      name: 'Twitter',
      url: 'https://x.com/wishdotgl',
      icon: '𝕏',
      color: '#1DA1F2'
    },
    {
      name: 'Telegram',
      url: null,
      icon: '✈️',
      color: '#0088cc',
      status: 'TBD'
    },
    {
      name: 'Discord',
      url: null,
      icon: '💬',
      color: '#5865F2',
      status: 'Coming Soon'
    },
    {
      name: 'Dev Wallet',
      url: null,
      icon: '💰',
      color: '#9945FF',
      status: 'TBD'
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
        <title>$WISH - Links</title>
        <meta name="description" content="Connect with $WISH community" />
      </Head>

      <div 
        className="min-h-screen relative flex items-center justify-center"
        style={{
          backgroundImage: 'url(/assets/backgrounds/Realbackground.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="absolute top-4 left-4 px-4 py-2 bg-black/80 text-white border-2 border-purple-500 rounded-lg hover:bg-purple-900/80 transition-all font-pixel text-sm z-50"
        >
          ← Back to Game
        </button>

        {/* Main Container */}
        <div className="w-full max-w-4xl mx-auto p-4">
          <div className="bg-black/90 rounded-lg border-2 border-purple-500 p-8">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-pixel text-center mb-2 text-white">
              COMMUNITY LINKS
            </h1>
            <p className="text-center text-purple-400 font-pixel text-sm mb-8">
              Connect with the $WISH community
            </p>

            {/* Social Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {socialLinks.map((link) => (
                <div
                  key={link.name}
                  className={`relative bg-black/60 border-2 rounded-lg p-6 transition-all transform hover:scale-105 ${
                    link.url ? 'cursor-pointer hover:shadow-xl' : 'cursor-not-allowed opacity-75'
                  }`}
                  style={{
                    borderColor: hoveredLink === link.name ? link.color : '#666',
                    boxShadow: hoveredLink === link.name ? `0 0 20px ${link.color}40` : 'none'
                  }}
                  onMouseEnter={() => setHoveredLink(link.name)}
                  onMouseLeave={() => setHoveredLink(null)}
                  onClick={() => handleLinkClick(link)}
                >
                  {/* Icon */}
                  <div className="text-4xl mb-3 text-center">
                    {link.icon}
                  </div>

                  {/* Name */}
                  <h3 className="text-xl font-pixel text-white text-center mb-2">
                    {link.name}
                  </h3>

                  {/* Status or Link */}
                  <div className="text-center">
                    {link.url ? (
                      <span className="text-green-400 font-pixel text-xs">
                        Click to Visit →
                      </span>
                    ) : (
                      <span className="text-yellow-400 font-pixel text-xs">
                        {link.status}
                      </span>
                    )}
                  </div>

                  {/* Hover Effect Glow */}
                  {hoveredLink === link.name && link.url && (
                    <div 
                      className="absolute inset-0 rounded-lg opacity-20 pointer-events-none"
                      style={{ backgroundColor: link.color }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="mt-8 text-center">
              <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/50">
                <p className="text-purple-300 font-pixel text-xs">
                  🚀 Join our community to stay updated on the latest $WISH developments
                </p>
                <p className="text-purple-300 font-pixel text-xs mt-2">
                  💎 More links coming soon!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}