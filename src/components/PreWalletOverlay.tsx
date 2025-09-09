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
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        
        {/* Connect Wallet Button - centered above card */}
        <div className="mb-8">
          <WalletMultiButton 
            className="!bg-purple-600 hover:!bg-purple-700 !text-white !font-bold !py-3 !px-8 !rounded-lg !text-lg !shadow-2xl"
            style={{ 
              fontSize: '16px', 
              fontFamily: '"Press Start 2P"',
              boxShadow: '0 10px 30px rgba(0,0,0,0.45)'
            }}
          >
            Connect Wallet
          </WalletMultiButton>
        </div>

        {/* Info-style Card Container - exact match to Info page */}
        <div 
          className="bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-purple-500/30 p-8 text-center transition-all duration-300 hover:scale-105 max-w-4xl w-full"
          style={{
            boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
            fontFamily: '"Press Start 2P"',
            color: '#fff'
          }}
        >
          {/* Main content with Info page styling */}
          <div className="text-white leading-relaxed space-y-6" style={{ fontSize: '12px', lineHeight: '1.8' }}>
            
            {/* Welcome message */}
            <p className="text-cyan-400 mb-8 text-center">
              Connect your Phantom wallet to enter the magical realm and play with other users!
            </p>
            
            {/* How to Play section */}
            <div className="text-left space-y-4">
              <div className="bg-black/30 p-6 rounded-lg border border-green-500/30">
                <h3 className="text-green-400 font-bold mb-4 text-center" style={{ fontSize: '14px' }}>
                  🎮 How to Play:
                </h3>
                <div className="space-y-3 text-gray-300" style={{ fontSize: '11px' }}>
                  <p>• Use WASD or arrow keys to move around</p>
                  <p>• Click the fountain to throw WISH tokens</p>
                  <p>• Win big or lose it all in the magical well!</p>
                </div>
              </div>
              
              {/* Portals section */}
              <div className="bg-black/30 p-6 rounded-lg border border-purple-500/30">
                <h3 className="text-purple-400 font-bold mb-4 text-center" style={{ fontSize: '14px' }}>
                  🚪 Portals:
                </h3>
                <div className="space-y-3 text-gray-300" style={{ fontSize: '11px' }}>
                  <p>• Info - Learn about the game</p>
                  <p>• House - Purchase and manage your property</p>
                  <p>• Links - Join our community</p>
                  <p>• Upgrades - Enhance your house</p>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="pt-6 mt-8 border-t border-purple-500/30 text-center">
              <p className="text-white/80" style={{ fontSize: '10px' }}>
                🎮 Multiplayer Gaming • 💰 Crypto Rewards
              </p>
            </div>
            
          </div>
        </div>
        
      </div>
    </div>
  )
}