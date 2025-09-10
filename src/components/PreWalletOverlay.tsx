import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export default function PreWalletOverlay() {
  return (
    <>
      <style jsx>{`
        .pre-wallet-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          background: url('/assets/backgrounds/sixseven.png') center/cover no-repeat fixed;
          z-index: -1;
        }
        .pre-wallet-bg::after {
          content: '';
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: -1;
        }
      `}</style>
      
      <div 
        className="pre-wallet-bg fixed inset-0 z-50"
        style={{ zIndex: 10000 }}
      >
      {/* Centered layout container */}
      <div className="flex items-center justify-center min-h-screen p-4">
        
        {/* Main Box Container with Connect Button at Top */}
        <div 
          className="bg-white/10 backdrop-blur-md rounded-2xl border-2 border-purple-500/40 max-w-3xl w-full relative"
          style={{
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 0 40px rgba(147, 51, 234, 0.1)',
            fontFamily: '"Press Start 2P"',
            color: '#fff'
          }}
        >
          {/* Connect Wallet Button - positioned at top center of the box */}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
            <WalletMultiButton 
              className="!bg-purple-600 hover:!bg-purple-700 !text-white !font-bold !py-3 !px-8 !rounded-lg !text-base !shadow-2xl !border-2 !border-purple-400"
              style={{ 
                fontSize: '14px', 
                fontFamily: '"Press Start 2P"',
                boxShadow: '0 8px 25px rgba(147, 51, 234, 0.5)'
              }}
            >
              Connect Wallet
            </WalletMultiButton>
          </div>

          {/* Box Content */}
          <div className="p-8 pt-10">
            
            {/* Welcome message */}
            <p className="text-cyan-400 mb-6 text-center" style={{ fontSize: '13px' }}>
              Connect your Phantom wallet to enter the magical realm and play with other users!
            </p>
            
            {/* Content sections in a more compact layout */}
            <div className="space-y-4">
              
              {/* How to Play section */}
              <div className="bg-black/40 p-4 rounded-lg border border-green-500/40">
                <h3 className="text-green-400 font-bold mb-3" style={{ fontSize: '13px' }}>
                  🎮 How to Play!
                </h3>
                <div className="space-y-2 text-gray-300" style={{ fontSize: '10px' }}>
                  <p>• Use WASD or arrow keys to move around</p>
                  <p>• Click the fountain to throw WISH tokens</p>
                  <p>• Win big or lose it all in the magical well!</p>
                </div>
              </div>
              
              {/* Portals section */}
              <div className="bg-black/40 p-4 rounded-lg border border-purple-500/40">
                <h3 className="text-purple-400 font-bold mb-3" style={{ fontSize: '13px' }}>
                  🚪 Portals!
                </h3>
                <div className="space-y-2 text-gray-300" style={{ fontSize: '10px' }}>
                  <p>• Info - Learn about the game</p>
                  <p>• House - Purchase and manage your property</p>
                  <p>• Links - Join our community</p>
                  <p>• Upgrades - Enhance your house</p>
                  <p>• Multiplayer Gaming • 💰 Crypto Rewards</p>
                </div>
              </div>
              
            </div>
            
          </div>
        </div>
        
      </div>
    </div>
    </>
  )
}