import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey } from '@solana/web3.js'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { WishGamblingAPI } from '@/lib/solanaUtils'

interface HouseLevel {
  level: number
  name: string
  description: string
  cost: number
  boostPercent: number
  burnRequirement: number
}

interface UserHousingData {
  currentLevel: number
  totalBurned: number
  ownedLevels: number[]
}

const HOUSE_LEVELS: HouseLevel[] = [
  {
    level: 1,
    name: "Starter Shack",
    description: "A humble beginning to your housing journey. Basic shelter with minimal amenities.",
    cost: 0, // No longer costs WISH tokens
    boostPercent: 0.5,
    burnRequirement: 1000 // Now requires 1000 tokens burned
  },
  {
    level: 2,
    name: "Cozy Cottage", 
    description: "A comfortable upgrade with a small garden and improved living space.",
    cost: 0, // No longer costs WISH tokens
    boostPercent: 1.5,
    burnRequirement: 30000 // Tripled from 10k
  },
  {
    level: 3,
    name: "Suburban Home",
    description: "A two-story house with modern amenities and a spacious backyard.",
    cost: 0, // No longer costs WISH tokens
    boostPercent: 4.0,
    burnRequirement: 75000 // Tripled from 25k
  },
  {
    level: 4,
    name: "Luxury Villa",
    description: "An elegant villa with premium finishes and multiple bedrooms.",
    cost: 0, // No longer costs WISH tokens
    boostPercent: 8.0,
    burnRequirement: 225000 // Tripled from 75k
  },
  {
    level: 5,
    name: "Grand Mansion",
    description: "A magnificent estate with sprawling grounds and luxurious features.",
    cost: 0, // No longer costs WISH tokens
    boostPercent: 15.0,
    burnRequirement: 450000 // Tripled from 150k
  },
  {
    level: 6,
    name: "Royal Palace",
    description: "The ultimate in luxury living - fit for royalty with unmatched grandeur.",
    cost: 0, // No longer costs WISH tokens
    boostPercent: 25.0,
    burnRequirement: 750000 // Tripled from 250k
  }
]

export default function Upgrades() {
  const { publicKey, connected, signTransaction, sendTransaction } = useWallet()
  const router = useRouter()
  const [userHousing, setUserHousing] = useState<UserHousingData>({
    currentLevel: 0,
    totalBurned: 0,
    ownedLevels: []
  })
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<number | null>(null)

  // Initialize Solana API
  const gamblingAPI = new WishGamblingAPI(
    'https://wish-well-worker.stealthbundlebot.workers.dev',
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/SYEG70FAIl_t9bDEkh4ki'
  )

  useEffect(() => {
    if (connected && publicKey) {
      fetchUserHousingData()
    } else {
      setLoading(false)
    }
  }, [connected, publicKey])

  const fetchUserHousingData = async () => {
    if (!publicKey) return
    
    try {
      setLoading(true)
      
      // Clear any old localStorage data from testing
      const localStorageKey = `housing_${publicKey.toString()}`
      if (localStorage.getItem(localStorageKey)) {
        console.log('Clearing old localStorage data from testing')
        localStorage.removeItem(localStorageKey)
      }
      
      // Fetch housing data and gambling stats separately
      let housingData = null
      let gamblingStats = null
      
      try {
        // Get housing data (owned levels) - only if API endpoint exists
        const housingResponse = await fetch(`https://wish-well-worker.stealthbundlebot.workers.dev/api/housing/${publicKey.toString()}`)
        if (housingResponse.ok) {
          housingData = await housingResponse.json()
          console.log('Housing data from API:', housingData)
          console.log('Owned levels from API:', housingData?.ownedLevels)
          
          // TEMPORARY: Clear test data if it includes Level 1 without a real purchase
          // Remove this after testing is complete
          if (housingData?.ownedLevels?.includes(1) && !housingData?.purchaseTransactions?.['1']) {
            console.log('Clearing test data - Level 1 was marked as owned without real purchase')
            housingData.ownedLevels = []
          }
        } else if (housingResponse.status === 404) {
          console.log('No housing data found for user (expected for new users)')
          housingData = { ownedLevels: [] }
        }
      } catch (e) {
        console.log('Housing API not available yet')
        housingData = { ownedLevels: [] }
      }
      
      try {
        // Get gambling stats for totalBurned
        const statsResponse = await fetch(`https://wish-well-worker.stealthbundlebot.workers.dev/api/user/${publicKey.toString()}/stats`)
        if (statsResponse.ok) {
          gamblingStats = await statsResponse.json()
          console.log('Gambling stats from API:', gamblingStats)
        }
      } catch (e) {
        console.log('Stats API not available')
      }
      
      const userData = {
        currentLevel: 0,
        totalBurned: gamblingStats?.totalBurned || 0, // Only from gambling, not purchases
        ownedLevels: Array.isArray(housingData?.ownedLevels) ? housingData.ownedLevels : []
      }
      
      // Validate ownedLevels - must be an array of numbers between 1-6
      userData.ownedLevels = userData.ownedLevels.filter(level => 
        typeof level === 'number' && level >= 1 && level <= 6
      )
      
      if (userData.ownedLevels.length > 0) {
        userData.currentLevel = Math.max(...userData.ownedLevels)
      }
      
      console.log('Final user housing data:', userData)
      setUserHousing(userData)
    } catch (error) {
      console.error('Error fetching housing data:', error)
      // Clean fallback - no owned houses by default
      setUserHousing({
        currentLevel: 0,
        totalBurned: 0,
        ownedLevels: []
      })
    } finally {
      setLoading(false)
    }
  }

  const resetHousingData = async () => {
    if (!publicKey) return
    
    try {
      console.log('Attempting to reset housing data for wallet:', publicKey.toString())
      const response = await fetch(`https://wish-well-worker.stealthbundlebot.workers.dev/api/housing/${publicKey.toString()}/reset`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        console.log('Successfully reset housing data on server')
      } else {
        console.log('Reset API endpoint not available yet, clearing only client-side')
      }
    } catch (error) {
      console.log('Reset API not available yet:', error)
    }
  }

  const canPurchaseHouse = (level: number): boolean => {
    const house = HOUSE_LEVELS[level - 1]
    
    // Check if previous level is owned (except for level 1)
    if (level > 1) {
      const previousLevelOwned = userHousing.ownedLevels.includes(level - 1)
      if (!previousLevelOwned) return false
    }
    
    // Check if already owned
    if (userHousing.ownedLevels.includes(level)) return false
    
    // Check burn requirement
    if (userHousing.totalBurned < house.burnRequirement) return false
    
    return true
  }

  const getHouseStatus = (level: number): 'owned' | 'available' | 'locked' => {
    if (userHousing.ownedLevels.includes(level)) return 'owned'
    if (canPurchaseHouse(level)) return 'available'
    return 'locked'
  }

  const purchaseHouse = async (level: number) => {
    if (!publicKey || !canPurchaseHouse(level)) return
    
    try {
      setPurchasing(level)
      const house = HOUSE_LEVELS[level - 1]
      
      console.log(`Purchasing ${house.name} (Level ${level}) - requires ${house.burnRequirement.toLocaleString()} tokens burned`)
      
      // No token transfer needed - just update server with level purchase
      // The server should verify the user has enough tokens burned
      const response = await fetch('https://wish-well-worker.stealthbundlebot.workers.dev/api/housing/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          level: level,
          burnRequirement: house.burnRequirement
          // No transaction signature since there's no blockchain transaction
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to purchase house')
      }
      
      // Refresh the UI with latest data
      await fetchUserHousingData()
      
      console.log(`Successfully purchased ${house.name}!`)
      alert(`🎉 Successfully purchased ${house.name}!\\n\\nYou now have ${house.boostPercent}% increased win odds!`)
      
    } catch (error: any) {
      console.error('Error purchasing house:', error)
      
      let errorMessage = 'Purchase failed. '
      if (error.message.includes('insufficient')) {
        const house = HOUSE_LEVELS[level - 1]
        errorMessage += `You need ${house.burnRequirement.toLocaleString()} tokens burned, but you only have ${userHousing.totalBurned.toLocaleString()} burned.`
      } else {
        errorMessage += error.message || 'Unknown error occurred.'
      }
      
      alert(errorMessage)
    } finally {
      setPurchasing(null)
    }
  }

  const visitHouse = () => {
    const highestLevel = Math.max(...userHousing.ownedLevels, 0)
    if (highestLevel > 0) {
      router.push(`/house?level=${highestLevel}`)
    }
  }

  const highestOwnedLevel = Math.max(...userHousing.ownedLevels, 0)
  const totalBoost = userHousing.ownedLevels.reduce((sum, level) => {
    return sum + HOUSE_LEVELS[level - 1].boostPercent
  }, 0)

  if (loading) {
    return (
      <>
        <style jsx global>{`
          body {
            overflow: auto !important;
            overflow-x: hidden !important;
          }
        `}</style>
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #581c87, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ animation: 'spin 1s linear infinite', borderRadius: '50%', height: '64px', width: '64px', border: '4px solid #8b5cf6', borderTopColor: 'transparent', margin: '0 auto 16px' }}></div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>Loading Housing District...</div>
          </div>
        </div>
      </>
    )
  }

  if (!connected) {
    return (
      <>
        <Head>
          <title>Housing Upgrades - $WISH Wishing Well</title>
          <meta name="description" content="Upgrade your housing to boost your gambling odds!" />
        </Head>
        
        <style jsx global>{`
          body {
            overflow: auto !important;
            overflow-x: hidden !important;
          }
        `}</style>
        
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #581c87, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '48px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '400px' }}>
            <div style={{ fontSize: '48px', marginBottom: '24px' }}>🏠</div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', background: 'linear-gradient(to right, #a855f7, #ec4899, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px' }}>
              Housing Upgrades
            </h1>
            <p style={{ color: '#cbd5e1', marginBottom: '32px', fontSize: '18px', lineHeight: '1.6' }}>
              Connect your wallet to view and purchase housing upgrades
            </p>
            <WalletMultiButton />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Housing Upgrades - $WISH Wishing Well</title>
        <meta name="description" content="Upgrade your housing to boost your gambling odds!" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </Head>

      {/* Fallback CSS - Ensures page always renders correctly even if Tailwind fails */}
      <style jsx global>{`
        /* Override global body overflow hidden for upgrades page */
        body {
          overflow: auto !important;
          overflow-x: hidden !important;
        }
      `}</style>
      <style jsx>{`
        .fallback-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a, #581c87, #0f172a);
          font-family: system-ui, -apple-system, sans-serif;
          color: white;
        }
        .fallback-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(0,0,0,0.2);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          padding: 16px 24px;
        }
        .fallback-header-content {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .fallback-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(to right, #7c3aed, #2563eb);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .fallback-btn:hover {
          background: linear-gradient(to right, #6d28d9, #1d4ed8);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .fallback-main {
          max-width: 1200px;
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
        .fallback-stats {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin-bottom: 64px;
          flex-wrap: wrap;
        }
        .fallback-stat {
          text-align: center;
          background: rgba(0,0,0,0.5);
          padding: 24px;
          border-radius: 8px;
        }
        .fallback-stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #10b981;
          margin-bottom: 4px;
        }
        .fallback-stat-label {
          font-size: 14px;
          color: #d1d5db;
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
          .fallback-stats {
            gap: 16px;
          }
        }
        .fallback-card {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          border: 2px solid;
          padding: 32px;
          text-align: center;
          transition: all 0.3s;
        }
        .fallback-card:hover {
          transform: scale(1.05);
        }
        .fallback-card.owned {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.05);
        }
        .fallback-card.available {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
        }
        .fallback-card.locked {
          border-color: #6b7280;
          opacity: 0.7;
        }
        .fallback-house-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }
        .fallback-house-title {
          font-size: 24px;
          font-weight: bold;
          color: white;
          margin-bottom: 8px;
        }
        .fallback-house-name {
          font-size: 20px;
          color: #c084fc;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .fallback-house-desc {
          color: #d1d5db;
          margin-bottom: 32px;
          line-height: 1.6;
        }
        .fallback-stats-grid {
          margin-bottom: 32px;
        }
        .fallback-stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0,0,0,0.3);
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 12px;
        }
        .fallback-stat-row:last-child {
          margin-bottom: 0;
        }
        .fallback-purchase-btn {
          width: 100%;
          padding: 16px 24px;
          border-radius: 12px;
          font-weight: bold;
          font-size: 18px;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
        }
        .fallback-purchase-btn.owned {
          background: #10b981;
          color: white;
          opacity: 0.75;
          cursor: not-allowed;
        }
        .fallback-purchase-btn.available {
          background: #8b5cf6;
          color: white;
        }
        .fallback-purchase-btn.available:hover {
          background: #7c3aed;
        }
        .fallback-purchase-btn.locked {
          background: #6b7280;
          color: #9ca3af;
          cursor: not-allowed;
          font-size: 14px;
        }
        .fallback-visit-btn {
          display: inline-block;
          background: linear-gradient(to right, #059669, #047857);
          color: white;
          padding: 24px 64px;
          border-radius: 16px;
          font-weight: bold;
          font-size: 20px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s;
        }
        .fallback-visit-btn:hover {
          background: linear-gradient(to right, #047857, #065f46);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .fallback-center {
          text-align: center;
          margin-bottom: 64px;
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
            
            <div className="flex items-center gap-4">
              {highestOwnedLevel > 0 && (
                <button
                  onClick={visitHouse}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl fallback-btn"
                >
                  🏠 Visit House
                </button>
              )}
              <WalletMultiButton />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-6 py-12 fallback-main">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-4 fallback-title">
              Housing District
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto fallback-subtitle">
              Choose your house level to boost your Wishing Well odds. Houses must be purchased in order.
            </p>
            
            {/* User Stats Row */}
            <div className="flex justify-center gap-8 mb-16 flex-wrap fallback-stats">
              <div className="text-center bg-black/50 px-6 py-4 rounded-lg fallback-stat">
                <div className="text-2xl font-bold text-green-400 fallback-stat-value">{highestOwnedLevel}</div>
                <div className="text-sm text-gray-300 fallback-stat-label">Current Level</div>
              </div>
              <div className="text-center bg-black/50 px-6 py-4 rounded-lg fallback-stat">
                <div className="text-2xl font-bold text-blue-400 fallback-stat-value">+{totalBoost}%</div>
                <div className="text-sm text-gray-300 fallback-stat-label">Total Boost</div>
              </div>
              <div className="text-center bg-black/50 px-6 py-4 rounded-lg fallback-stat">
                <div className="text-2xl font-bold text-yellow-400 fallback-stat-value">{userHousing.totalBurned.toLocaleString()}</div>
                <div className="text-sm text-gray-300 fallback-stat-label">Total Burned</div>
              </div>
            </div>
          </div>

          {/* 2x3 Grid of Houses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16 fallback-grid">
            {HOUSE_LEVELS.map((house) => {
              const status = getHouseStatus(house.level)
              const canPurchase = status === 'available'
              const isOwned = status === 'owned'
              const isLocked = status === 'locked'
              
              return (
                <div key={house.level} className={`bg-white/10 backdrop-blur-sm rounded-2xl border-2 p-8 text-center transition-all duration-300 hover:scale-105 fallback-card ${
                  isOwned ? 'border-green-500 bg-green-500/5 owned' : 
                  canPurchase ? 'border-purple-500 bg-purple-500/5 available' : 
                  'border-gray-600 opacity-70 locked'
                }`}>
                  <div className="mb-6">
                    <img 
                      src={`/assets/houses/tier${house.level}.png`} 
                      alt={house.name}
                      style={{ width: '336px', height: '336px', margin: '0 auto', objectFit: 'contain' }}
                    />
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-2 fallback-house-title">
                    Level {house.level}
                  </h2>
                  
                  <h3 className="text-2xl text-purple-300 font-semibold mb-4 fallback-house-name">
                    {house.name}
                  </h3>
                  
                  <p className="text-gray-300 mb-8 leading-relaxed fallback-house-desc">
                    {house.description}
                  </p>
                  
                  <div className="space-y-4 mb-8 fallback-stats-grid">
                    <div className="bg-black/30 p-4 rounded-lg flex justify-between items-center fallback-stat-row">
                      <span className="text-green-400 font-semibold">🚀 Win Boost:</span>
                      <span className="text-white font-bold text-xl">+{house.boostPercent}%</span>
                    </div>
                    
                    <div className="bg-black/30 p-4 rounded-lg flex justify-between items-center fallback-stat-row">
                      <span className="text-yellow-400 font-semibold">🔥 Requires:</span>
                      <span className="text-white font-bold">{house.burnRequirement.toLocaleString()} burned</span>
                    </div>
                  </div>
                  
                  {isOwned ? (
                    <button disabled className="w-full bg-green-500 text-white py-4 px-6 rounded-xl font-bold text-lg opacity-75 cursor-not-allowed fallback-purchase-btn owned">
                      ✅ UNLOCKED
                    </button>
                  ) : canPurchase ? (
                    <button
                      onClick={() => purchaseHouse(house.level)}
                      disabled={purchasing === house.level}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 fallback-purchase-btn available"
                    >
                      {purchasing === house.level ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          UNLOCKING...
                        </div>
                      ) : (
                        '🏠 UNLOCK HOUSE'
                      )}
                    </button>
                  ) : (
                    <button disabled className="w-full bg-gray-600 text-gray-400 py-4 px-6 rounded-xl font-bold cursor-not-allowed text-sm fallback-purchase-btn locked">
                      {house.level === 1 ? '❌ REQUIREMENTS NOT MET' : 
                       userHousing.totalBurned < house.burnRequirement ? 
                       `NEED ${(house.burnRequirement - userHousing.totalBurned).toLocaleString()} MORE BURNED` :
                       'BUY PREVIOUS LEVEL FIRST'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* View My Current House Button - At Bottom as Requested */}
          {highestOwnedLevel > 0 && (
            <div className="text-center mb-16 fallback-center">
              <button
                onClick={visitHouse}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-16 py-6 rounded-2xl font-bold text-2xl shadow-xl hover:shadow-2xl transition-all duration-300 fallback-visit-btn"
              >
                🏠 View My Current House
              </button>
            </div>
          )}

          {/* How It Works */}
          <div className="bg-black/50 p-8 rounded-xl text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">How Housing Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div>
                <h3 className="text-xl font-bold text-green-400 mb-3 flex items-center gap-2">
                  🚀 Boost System
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Each house level provides a win rate boost that stacks with previous levels.
                  The boost percentage is applied to your wins, deducted from your losses, giving you better odds!
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-400 mb-3 flex items-center gap-2">
                  📋 Requirements
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Houses must be purchased in order, and higher levels require you to have
                  burned a certain amount of $WISH tokens through gambling to unlock.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}