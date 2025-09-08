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
      <div style={{ 
        background: 'url(/assets/backgrounds/Realbackground.jpg)', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="text-white text-2xl font-pixel">Loading...</div>
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
        
        <div style={{
          backgroundImage: 'url(/assets/backgrounds/Realbackground.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="text-center bg-black/80 p-8 rounded-lg">
            <h1 className="text-4xl font-pixel text-purple-400 mb-4">Housing Upgrades</h1>
            <p className="text-white mb-6 font-pixel">Connect your wallet to view housing upgrades</p>
            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
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

      <div style={{
        backgroundImage: 'url(/assets/backgrounds/Realbackground.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <button 
            onClick={() => router.push('/')}
            className="text-purple-400 hover:text-purple-300 font-pixel text-lg"
          >
            ← Back to Game
          </button>
          
          <div className="flex items-center gap-4">
            {highestOwnedLevel > 0 && (
              <button
                onClick={visitHouse}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-pixel"
              >
                Visit House
              </button>
            )}
            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-pixel text-purple-400 mb-4">Housing District</h1>
            <p className="text-xl text-white font-pixel mb-6">
              Upgrade your housing to boost your Wishing Well odds!
            </p>
            
            {/* User Stats */}
            <div className="bg-black/80 p-6 rounded-lg inline-block">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-2xl font-pixel text-green-400">{highestOwnedLevel}</div>
                  <div className="text-sm font-pixel text-white">Current Level</div>
                </div>
                <div>
                  <div className="text-2xl font-pixel text-blue-400">+{totalBoost}%</div>
                  <div className="text-sm font-pixel text-white">Total Boost</div>
                </div>
                <div>
                  <div className="text-2xl font-pixel text-yellow-400">{userHousing.totalBurned.toLocaleString()}</div>
                  <div className="text-sm font-pixel text-white">Total Burned</div>
                </div>
              </div>
            </div>
          </div>

          {/* Housing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {HOUSE_LEVELS.map((house) => {
              const status = getHouseStatus(house.level)
              const canPurchase = status === 'available'
              const isOwned = status === 'owned'
              const isLocked = status === 'locked'
              
              return (
                <div
                  key={house.level}
                  className={`bg-black/80 rounded-lg overflow-hidden border-2 ${
                    isOwned ? 'border-green-500' : 
                    canPurchase ? 'border-purple-500' : 
                    'border-gray-500'
                  }`}
                >
                  {/* House Image */}
                  <div className="h-48 bg-gray-700 flex items-center justify-center relative">
                    <div className={`text-6xl ${isLocked ? 'opacity-30' : ''}`}>🏠</div>
                    {isOwned && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm font-pixel">
                        OWNED
                      </div>
                    )}
                    {isLocked && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-pixel">
                        LOCKED
                      </div>
                    )}
                  </div>
                  
                  {/* House Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-pixel text-purple-400 mb-2">
                      Level {house.level}: {house.name}
                    </h3>
                    <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                      {house.description}
                    </p>
                    
                    {/* Stats */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="font-pixel text-green-400">Win Boost:</span>
                        <span className="font-pixel text-white">+{house.boostPercent}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-pixel text-blue-400">Cost:</span>
                        <span className="font-pixel text-white">{house.cost.toLocaleString()} $WISH</span>
                      </div>
                      {house.burnRequirement > 0 && (
                        <div className="flex justify-between">
                          <span className="font-pixel text-yellow-400">Requires:</span>
                          <span className="font-pixel text-white">{house.burnRequirement.toLocaleString()} burned</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Purchase Button */}
                    {isOwned ? (
                      <button 
                        disabled 
                        className="w-full bg-green-600 text-white py-3 rounded font-pixel opacity-75 cursor-not-allowed"
                      >
                        PURCHASED
                      </button>
                    ) : canPurchase ? (
                      <button
                        onClick={() => purchaseHouse(house.level)}
                        disabled={purchasing === house.level}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded font-pixel disabled:opacity-50"
                      >
                        {purchasing === house.level ? 'PURCHASING...' : 'PURCHASE'}
                      </button>
                    ) : (
                      <button 
                        disabled 
                        className="w-full bg-gray-600 text-gray-400 py-3 rounded font-pixel cursor-not-allowed"
                      >
                        {house.level === 1 ? 'REQUIREMENTS NOT MET' : 
                         userHousing.totalBurned < house.burnRequirement ? 
                         `NEED ${(house.burnRequirement - userHousing.totalBurned).toLocaleString()} MORE BURNED` :
                         'BUY PREVIOUS LEVEL FIRST'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Info Section */}
          <div className="mt-12 text-center">
            <div className="bg-black/80 p-8 rounded-lg max-w-4xl mx-auto">
              <h2 className="text-3xl font-pixel text-purple-400 mb-6">How Housing Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div>
                  <h3 className="text-xl font-pixel text-green-400 mb-3">Boost System</h3>
                  <p className="text-white font-pixel text-sm leading-relaxed">
                    Each house level provides a win rate boost that stacks with previous levels.
                    The boost percentage is deducted from your loss chance!
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-pixel text-blue-400 mb-3">Requirements</h3>
                  <p className="text-white font-pixel text-sm leading-relaxed">
                    Houses must be purchased in order, and higher levels require you to have
                    burned a certain amount of $WISH tokens through gambling.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}