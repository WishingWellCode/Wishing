import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Head from 'next/head'
import { useRouter } from 'next/router'

interface HouseLevel {
  level: number
  name: string
  description: string
  cost: number
  boostPercent: number
  burnRequirement: number
  image: string
  interiorDescription: string
}

const HOUSE_LEVELS: HouseLevel[] = [
  {
    level: 1,
    name: "Starter Shack",
    description: "A humble beginning to your housing journey. Basic shelter with minimal amenities.",
    cost: 1000,
    boostPercent: 0.5,
    burnRequirement: 0,
    image: "/assets/houses/house1.png",
    interiorDescription: "A cozy single room with basic furnishings. You can see the potential for growth from here. The walls are simple wood, but they're yours."
  },
  {
    level: 2,
    name: "Cozy Cottage", 
    description: "A comfortable upgrade with a small garden and improved living space.",
    cost: 5000,
    boostPercent: 1.5,
    burnRequirement: 10000,
    image: "/assets/houses/house2.png",
    interiorDescription: "A charming cottage with separate rooms and a small kitchen. Natural light streams through clean windows, and there's a lovely view of your garden."
  },
  {
    level: 3,
    name: "Suburban Home",
    description: "A two-story house with modern amenities and a spacious backyard.",
    cost: 15000,
    boostPercent: 4.0,
    burnRequirement: 25000,
    image: "/assets/houses/house3.png",
    interiorDescription: "A proper two-story home with modern appliances and comfortable furniture. The living room has a fireplace, and upstairs you have a dedicated bedroom and office space."
  },
  {
    level: 4,
    name: "Luxury Villa",
    description: "An elegant villa with premium finishes and multiple bedrooms.",
    cost: 50000,
    boostPercent: 8.0,
    burnRequirement: 75000,
    image: "/assets/houses/house4.png",
    interiorDescription: "An elegant villa with marble countertops and hardwood floors. Multiple bedrooms offer space for guests, and the master suite has its own balcony overlooking manicured grounds."
  },
  {
    level: 5,
    name: "Grand Mansion",
    description: "A magnificent estate with sprawling grounds and luxurious features.",
    cost: 150000,
    boostPercent: 15.0,
    burnRequirement: 150000,
    image: "/assets/houses/house5.png",
    interiorDescription: "A magnificent mansion with soaring ceilings and crystal chandeliers. The grand staircase leads to a second floor library, while the main floor features a ballroom and gourmet kitchen."
  },
  {
    level: 6,
    name: "Royal Palace",
    description: "The ultimate in luxury living - fit for royalty with unmatched grandeur.",
    cost: 500000,
    boostPercent: 25.0,
    burnRequirement: 250000,
    image: "/assets/houses/house6.png",
    interiorDescription: "A royal palace with gold-leafed walls and priceless art. Multiple wings house your extensive collection of treasures, while the throne room showcases your ultimate achievement in the Housing District."
  }
]

export default function House() {
  const { publicKey, connected } = useWallet()
  const router = useRouter()
  const [currentHouseLevel, setCurrentHouseLevel] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [ownedLevels, setOwnedLevels] = useState<number[]>([])

  useEffect(() => {
    // Get house level from URL params or default to highest owned
    const levelFromQuery = router.query.level
    if (levelFromQuery && !isNaN(Number(levelFromQuery))) {
      setCurrentHouseLevel(Number(levelFromQuery))
    }
  }, [router.query.level])

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
        setOwnedLevels(data.ownedLevels || [])
        
        // Set to highest owned level if not specified in query
        if (!router.query.level && data.ownedLevels?.length > 0) {
          const highestLevel = Math.max(...data.ownedLevels)
          setCurrentHouseLevel(highestLevel)
        }
      } else {
        setOwnedLevels([])
      }
    } catch (error) {
      console.error('Error fetching housing data:', error)
      setOwnedLevels([])
    } finally {
      setLoading(false)
    }
  }

  const currentHouse = HOUSE_LEVELS[currentHouseLevel - 1]
  const isOwned = ownedLevels.includes(currentHouseLevel)

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
        <div className="text-white text-2xl font-pixel">Loading your house...</div>
      </div>
    )
  }

  if (!connected) {
    return (
      <>
        <Head>
          <title>Your House - $WISH Wishing Well</title>
          <meta name="description" content="Visit your house in the Housing District!" />
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
            <h1 className="text-4xl font-pixel text-purple-400 mb-4">Your House</h1>
            <p className="text-white mb-6 font-pixel">Connect your wallet to visit your house</p>
            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
          </div>
        </div>
      </>
    )
  }

  if (ownedLevels.length === 0) {
    return (
      <>
        <Head>
          <title>No House Owned - $WISH Wishing Well</title>
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
          <div className="text-center bg-black/80 p-8 rounded-lg max-w-md">
            <h1 className="text-3xl font-pixel text-red-400 mb-4">No House Owned</h1>
            <p className="text-white mb-6 font-pixel text-sm leading-relaxed">
              You don't own any houses yet! Visit the Upgrades page to purchase your first home.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => router.push('/upgrades')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded font-pixel"
              >
                Go to Upgrades
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded font-pixel"
              >
                Back to Game
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!isOwned) {
    return (
      <>
        <Head>
          <title>House Not Owned - $WISH Wishing Well</title>
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
          <div className="text-center bg-black/80 p-8 rounded-lg max-w-md">
            <h1 className="text-3xl font-pixel text-red-400 mb-4">House Not Owned</h1>
            <p className="text-white mb-6 font-pixel text-sm leading-relaxed">
              You don't own this house level. Visit the Upgrades page to purchase it.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => router.push('/upgrades')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded font-pixel"
              >
                Go to Upgrades
              </button>
              <button
                onClick={() => {
                  const highestLevel = Math.max(...ownedLevels)
                  router.push(`/house?level=${highestLevel}`)
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded font-pixel"
              >
                Visit Your House
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{currentHouse.name} - Your House</title>
        <meta name="description" content={`Welcome to your ${currentHouse.name}!`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </Head>

      <div style={{
        backgroundImage: 'url(/assets/backgrounds/house-interior.jpg), url(/assets/backgrounds/Realbackground.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        backgroundColor: '#1a0b2e' // Fallback color
      }}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-black/60">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="text-purple-400 hover:text-purple-300 font-pixel"
            >
              ← Back to Game
            </button>
            <button 
              onClick={() => router.push('/upgrades')}
              className="text-green-400 hover:text-green-300 font-pixel"
            >
              → Upgrades
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8">
          {/* House Display */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-black/80 rounded-lg overflow-hidden border-2 border-purple-500">
              {/* House Image/Display */}
              <div className="h-96 bg-gradient-to-b from-purple-900/50 to-black/50 flex items-center justify-center relative">
                <div className="text-center">
                  <div className="text-8xl mb-4">🏠</div>
                  <h1 className="text-4xl font-pixel text-purple-400 mb-2">
                    {currentHouse.name}
                  </h1>
                  <div className="text-lg font-pixel text-green-400">
                    Level {currentHouse.level} • +{currentHouse.boostPercent}% Win Boost
                  </div>
                </div>
                
                {/* Level Selector */}
                {ownedLevels.length > 1 && (
                  <div className="absolute top-4 right-4">
                    <select
                      value={currentHouseLevel}
                      onChange={(e) => {
                        const newLevel = Number(e.target.value)
                        setCurrentHouseLevel(newLevel)
                        router.push(`/house?level=${newLevel}`, undefined, { shallow: true })
                      }}
                      className="bg-black/80 text-white font-pixel p-2 rounded border border-purple-500"
                    >
                      {ownedLevels.sort((a, b) => b - a).map(level => (
                        <option key={level} value={level}>
                          Level {level}: {HOUSE_LEVELS[level - 1].name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              {/* House Interior Description */}
              <div className="p-8">
                <h2 className="text-2xl font-pixel text-purple-400 mb-4">Your Home Interior</h2>
                <p className="text-white font-pixel text-sm leading-relaxed mb-6">
                  {currentHouse.interiorDescription}
                </p>
                
                {/* House Stats */}
                <div className="bg-purple-900/30 p-6 rounded-lg">
                  <h3 className="text-xl font-pixel text-purple-400 mb-4">House Benefits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-black/50 p-4 rounded">
                      <div className="text-2xl font-pixel text-green-400 mb-2">+{currentHouse.boostPercent}%</div>
                      <div className="text-sm font-pixel text-white">Win Rate Boost</div>
                    </div>
                    <div className="bg-black/50 p-4 rounded">
                      <div className="text-2xl font-pixel text-blue-400 mb-2">{currentHouse.cost.toLocaleString()}</div>
                      <div className="text-sm font-pixel text-white">$WISH Invested</div>
                    </div>
                    <div className="bg-black/50 p-4 rounded">
                      <div className="text-2xl font-pixel text-purple-400 mb-2">Level {currentHouse.level}</div>
                      <div className="text-sm font-pixel text-white">House Level</div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-8 text-center space-y-4">
                  <div className="space-x-4">
                    <button
                      onClick={() => router.push('/')}
                      className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded font-pixel"
                    >
                      Return to Game
                    </button>
                    <button
                      onClick={() => router.push('/upgrades')}
                      className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded font-pixel"
                    >
                      Upgrade House
                    </button>
                  </div>
                  
                  <p className="text-gray-400 font-pixel text-xs">
                    More interactive features coming soon! For now, enjoy your +{currentHouse.boostPercent}% win boost when gambling.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Additional Info */}
            <div className="mt-8 bg-black/80 p-6 rounded-lg border border-gray-600">
              <h3 className="text-xl font-pixel text-purple-400 mb-4">About Your Housing Benefits</h3>
              <p className="text-white font-pixel text-sm leading-relaxed mb-4">
                Your house provides a permanent boost to your gambling odds at the Wishing Well. 
                The {currentHouse.boostPercent}% boost from your {currentHouse.name} is applied automatically 
                to every gambling session.
              </p>
              
              {ownedLevels.length > 1 && (
                <p className="text-green-400 font-pixel text-sm">
                  You own {ownedLevels.length} house{ownedLevels.length > 1 ? 's' : ''}! 
                  Total boost from all houses: +{ownedLevels.reduce((sum, level) => sum + HOUSE_LEVELS[level - 1].boostPercent, 0)}%
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}