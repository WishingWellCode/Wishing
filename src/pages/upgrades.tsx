import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
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
  image: string
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
    cost: 1000,
    boostPercent: 0.5,
    burnRequirement: 0,
    image: "/assets/houses/house1.png"
  },
  {
    level: 2,
    name: "Cozy Cottage", 
    description: "A comfortable upgrade with a small garden and improved living space.",
    cost: 5000,
    boostPercent: 1.5,
    burnRequirement: 10000,
    image: "/assets/houses/house2.png"
  },
  {
    level: 3,
    name: "Suburban Home",
    description: "A two-story house with modern amenities and a spacious backyard.",
    cost: 15000,
    boostPercent: 4.0,
    burnRequirement: 25000,
    image: "/assets/houses/house3.png"
  },
  {
    level: 4,
    name: "Luxury Villa",
    description: "An elegant villa with premium finishes and multiple bedrooms.",
    cost: 50000,
    boostPercent: 8.0,
    burnRequirement: 75000,
    image: "/assets/houses/house4.png"
  },
  {
    level: 5,
    name: "Grand Mansion",
    description: "A magnificent estate with sprawling grounds and luxurious features.",
    cost: 150000,
    boostPercent: 15.0,
    burnRequirement: 150000,
    image: "/assets/houses/house5.png"
  },
  {
    level: 6,
    name: "Royal Palace",
    description: "The ultimate in luxury living - fit for royalty with unmatched grandeur.",
    cost: 500000,
    boostPercent: 25.0,
    burnRequirement: 250000,
    image: "/assets/houses/house6.png"
  }
]

export default function Upgrades() {
  const { publicKey, connected } = useWallet()
  const router = useRouter()
  const [userHousing, setUserHousing] = useState<UserHousingData>({
    currentLevel: 0,
    totalBurned: 0,
    ownedLevels: []
  })
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<number | null>(null)

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
      // TODO: Implement API call to fetch user housing data
      const response = await fetch(`/api/housing/${publicKey.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setUserHousing(data)
      } else {
        // Default data if user doesn't exist yet
        setUserHousing({
          currentLevel: 0,
          totalBurned: 0,
          ownedLevels: []
        })
      }
    } catch (error) {
      console.error('Error fetching housing data:', error)
      setUserHousing({
        currentLevel: 0,
        totalBurned: 0,
        ownedLevels: []
      })
    } finally {
      setLoading(false)
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
      
      // TODO: Implement actual token burning transaction
      const response = await fetch('/api/housing/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          level: level,
          cost: house.cost
        })
      })
      
      if (response.ok) {
        // Refresh user data
        await fetchUserHousingData()
        console.log(`Successfully purchased ${house.name}!`)
      } else {
        const error = await response.json()
        console.error('Purchase failed:', error)
      }
    } catch (error) {
      console.error('Error purchasing house:', error)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-2xl font-bold text-white">Loading Housing District...</div>
        </div>
      </div>
    )
  }

  if (!connected) {
    return (
      <>
        <Head>
          <title>Housing Upgrades - $WISH Wishing Well</title>
          <meta name="description" content="Upgrade your housing to boost your gambling odds!" />
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center bg-black/40 backdrop-blur-sm border border-purple-500/30 p-12 rounded-3xl shadow-2xl max-w-md">
            <div className="text-6xl mb-6">🏠</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
              Housing Upgrades
            </h1>
            <p className="text-slate-300 mb-8 text-lg leading-relaxed">
              Connect your wallet to view and purchase housing upgrades
            </p>
            <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-pink-600 hover:!from-purple-700 hover:!to-pink-700 !rounded-lg !shadow-lg hover:!shadow-xl !transition-all !duration-200 !px-8 !py-3 !font-bold" />
          </div>
        </div>
      </>
    )
  }

  const highestOwnedLevel = Math.max(...userHousing.ownedLevels, 0)
  const totalBoost = userHousing.ownedLevels.reduce((sum, level) => {
    return sum + HOUSE_LEVELS[level - 1].boostPercent
  }, 0)

  return (
    <>
      <Head>
        <title>Housing Upgrades - $WISH Wishing Well</title>
        <meta name="description" content="Upgrade your housing to boost your gambling odds!" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-sm border-b border-purple-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <button 
                onClick={() => router.push('/')}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
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
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    🏠 Visit House
                  </button>
                )}
                <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-pink-600 hover:!from-purple-700 hover:!to-pink-700 !rounded-lg !shadow-lg hover:!shadow-xl !transition-all !duration-200 !px-6 !py-3 !font-semibold" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
              Housing District
            </h1>
            <p className="text-lg md:text-xl text-slate-300 font-medium mb-12 max-w-4xl mx-auto leading-relaxed">
              Upgrade your housing to boost your Wishing Well odds and unlock exclusive benefits!
            </p>
            
            {/* User Stats */}
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 p-6 md:p-8 rounded-2xl max-w-4xl mx-auto shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 text-center">
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 rounded-xl border border-green-500/30">
                  <div className="text-3xl font-bold text-green-400 mb-1">{highestOwnedLevel}</div>
                  <div className="text-sm font-medium text-slate-300">Current Level</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-4 rounded-xl border border-blue-500/30">
                  <div className="text-3xl font-bold text-blue-400 mb-1">+{totalBoost}%</div>
                  <div className="text-sm font-medium text-slate-300">Total Boost</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4 rounded-xl border border-yellow-500/30">
                  <div className="text-3xl font-bold text-yellow-400 mb-1">{userHousing.totalBurned.toLocaleString()}</div>
                  <div className="text-sm font-medium text-slate-300">Total Burned</div>
                </div>
              </div>
            </div>
          </div>

          {/* Housing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full">
            {HOUSE_LEVELS.map((house) => {
              const status = getHouseStatus(house.level)
              const canPurchase = status === 'available'
              const isOwned = status === 'owned'
              const isLocked = status === 'locked'
              
              return (
                <div
                  key={house.level}
                  className={`bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                    isOwned ? 'border-green-500/50 shadow-green-500/20' : 
                    canPurchase ? 'border-purple-500/50 shadow-purple-500/20' : 
                    'border-gray-500/30 opacity-75'
                  } shadow-xl`}
                >
                  {/* House Image */}
                  <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                    <div className={`text-8xl ${isLocked ? 'opacity-30 grayscale' : ''} transition-all duration-300`}>🏠</div>
                    {isOwned && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        ✓ OWNED
                      </div>
                    )}
                    {isLocked && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        🔒 LOCKED
                      </div>
                    )}
                    {canPurchase && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
                        ⭐ AVAILABLE
                      </div>
                    )}
                  </div>
                  
                  {/* House Info */}
                  <div className="p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
                      Level {house.level}: {house.name}
                    </h3>
                    <p className="text-sm text-slate-300 mb-4 md:mb-6 leading-relaxed">
                      {house.description}
                    </p>
                    
                    {/* Stats */}
                    <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                      <div className="flex justify-between items-center p-2 md:p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <span className="text-sm md:text-base font-semibold text-green-400">🚀 Win Boost:</span>
                        <span className="text-sm md:text-base font-bold text-white">+{house.boostPercent}%</span>
                      </div>
                      <div className="flex justify-between items-center p-2 md:p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <span className="text-sm md:text-base font-semibold text-blue-400">💎 Cost:</span>
                        <span className="text-sm md:text-base font-bold text-white">{house.cost.toLocaleString()} $WISH</span>
                      </div>
                      {house.burnRequirement > 0 && (
                        <div className="flex justify-between items-center p-2 md:p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                          <span className="text-sm md:text-base font-semibold text-yellow-400">🔥 Requires:</span>
                          <span className="text-sm md:text-base font-bold text-white">{house.burnRequirement.toLocaleString()} burned</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Purchase Button */}
                    {isOwned ? (
                      <button 
                        disabled 
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 md:py-4 rounded-xl font-bold opacity-75 cursor-not-allowed shadow-lg text-sm md:text-base"
                      >
                        ✅ PURCHASED
                      </button>
                    ) : canPurchase ? (
                      <button
                        onClick={() => purchaseHouse(house.level)}
                        disabled={purchasing === house.level}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 md:py-4 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                      >
                        {purchasing === house.level ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            PURCHASING...
                          </div>
                        ) : (
                          '🏠 PURCHASE NOW'
                        )}
                      </button>
                    ) : (
                      <button 
                        disabled 
                        className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-gray-400 py-3 md:py-4 rounded-xl font-bold cursor-not-allowed shadow-lg text-xs md:text-sm"
                      >
                        {house.level === 1 ? '❌ REQUIREMENTS NOT MET' : 
                         userHousing.totalBurned < house.burnRequirement ? 
                         `🔥 NEED ${(house.burnRequirement - userHousing.totalBurned).toLocaleString()} MORE BURNED` :
                         '⬆️ BUY PREVIOUS LEVEL FIRST'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Info Section */}
          <div className="mt-12 md:mt-16 text-center">
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 p-6 md:p-12 rounded-2xl md:rounded-3xl shadow-2xl">
              <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6 md:mb-8">
                How Housing Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 text-left">
                <div className="bg-green-500/10 p-4 md:p-6 rounded-xl md:rounded-2xl border border-green-500/20">
                  <h3 className="text-lg md:text-2xl font-bold text-green-400 mb-3 md:mb-4 flex items-center gap-2">
                    🚀 Boost System
                  </h3>
                  <p className="text-slate-300 text-base md:text-lg leading-relaxed">
                    Each house level provides a win rate boost that stacks with previous levels.
                    The boost percentage is deducted from your loss chance, giving you better odds!
                  </p>
                </div>
                <div className="bg-blue-500/10 p-4 md:p-6 rounded-xl md:rounded-2xl border border-blue-500/20">
                  <h3 className="text-lg md:text-2xl font-bold text-blue-400 mb-3 md:mb-4 flex items-center gap-2">
                    📋 Requirements
                  </h3>
                  <p className="text-slate-300 text-base md:text-lg leading-relaxed">
                    Houses must be purchased in order, and higher levels require you to have
                    burned a certain amount of $WISH tokens through gambling to unlock.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}