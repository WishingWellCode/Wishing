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
      <div className="flex items-center justify-center h-screen">
        
        {/* Main Box Container with Connect Button at Top */}
        <div 
          className="relative max-w-2xl w-full mx-4"
          style={{
            background: 'rgba(20, 10, 30, 0.95)',
            border: '3px solid rgba(147, 51, 234, 0.8)',
            borderRadius: '20px',
            boxShadow: '0 0 50px rgba(147, 51, 234, 0.6), inset 0 0 30px rgba(147, 51, 234, 0.2)',
            fontFamily: '"Press Start 2P"',
            color: '#fff',
            padding: '60px 30px 30px 30px'
          }}
        >
          {/* Connect Wallet Button - positioned at top center of the box */}
          <div 
            style={{
              position: 'absolute',
              top: '-22px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10
            }}
          >
            <WalletMultiButton 
              className="!bg-purple-600 hover:!bg-purple-700 !text-white !font-bold !py-3 !px-8 !rounded-lg !text-base !shadow-2xl !border-2 !border-purple-400"
              style={{ 
                fontSize: '14px', 
                fontFamily: '"Press Start 2P"',
                boxShadow: '0 8px 25px rgba(147, 51, 234, 0.8)',
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <img 
                src="/assets/logos/phantom.svg"
                alt="Phantom"
                style={{
                  width: '24px',
                  height: '24px'
                }}
              />
              Connect Wallet
            </WalletMultiButton>
          </div>

          {/* Box Content */}
          <div>
            
            {/* Welcome message */}
            <p className="text-cyan-400 mb-6 text-center" style={{ fontSize: '12px', lineHeight: '1.6' }}>
              Connect your Phantom wallet to enter the magical realm and play with other users!
            </p>
            
            {/* Content sections */}
            <div className="space-y-4">
              
              {/* How to Play section */}
              <div style={{ fontSize: '11px', lineHeight: '1.8' }}>
                <h3 className="text-green-400 font-bold mb-2">🎮 How to Play!</h3>
                <div className="text-gray-300 ml-4">
                  <p>• Use WASD or arrow keys to move around</p>
                  <p>• Click the fountain to throw WISH tokens</p>
                  <p>• Win big or lose it all in the magical well!</p>
                </div>
              </div>
              
              {/* Portals section */}
              <div style={{ fontSize: '11px', lineHeight: '1.8' }}>
                <h3 className="text-purple-400 font-bold mb-2">🚪 Portals!</h3>
                <div className="text-gray-300 ml-4">
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