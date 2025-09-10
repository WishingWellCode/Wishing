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
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100vh',
          position: 'relative'
        }}
      >
        
        {/* Main Box Container with Connect Button at Top */}
        <div 
          style={{
            position: 'relative',
            maxWidth: '650px',
            width: '90%',
            background: 'rgba(20, 10, 30, 0.95)',
            border: '3px solid rgba(147, 51, 234, 0.8)',
            borderRadius: '20px',
            boxShadow: '0 0 50px rgba(147, 51, 234, 0.6), inset 0 0 30px rgba(147, 51, 234, 0.2)',
            fontFamily: '"Times New Roman", serif',
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
                fontSize: '16px', 
                fontFamily: '"Times New Roman", serif',
                boxShadow: '0 8px 25px rgba(147, 51, 234, 0.8)',
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 128 128" 
                fill="none"
                style={{
                  width: '24px',
                  height: '24px'
                }}
              >
                <path d="M37.5 98.5C31.5 90.5 26 77 26 60C26 38 42 20 68 20C94 20 110 38 110 60C110 77 104.5 90.5 98.5 98.5C96 102 93 103 90 102C87 101 85 98 85 94C85 91.5 85.5 88.5 86 85.5C86.3 83.5 86.5 81.5 86.5 79.5C86.5 72 82 66 75 66C68 66 63.5 72 63.5 79.5C63.5 81.5 63.7 83.5 64 85.5C64.5 88.5 65 91.5 65 94C65 98 63 101 60 102C57 103 54 102 51.5 98.5C49 102 46 103 43 102C40 101 38 99.5 37.5 98.5Z" fill="white"/>
                <ellipse cx="50" cy="60" rx="7" ry="10" fill="#AB9FF2"/>
                <ellipse cx="78" cy="60" rx="7" ry="10" fill="#AB9FF2"/>
              </svg>
              Connect Wallet
            </WalletMultiButton>
          </div>

          {/* Box Content */}
          <div>
            
            {/* Welcome message */}
            <p className="text-cyan-400 mb-6 text-center" style={{ fontSize: '16px', lineHeight: '1.8', fontFamily: '"Times New Roman", serif' }}>
              Connect your Phantom wallet to enter the magical realm and play with other users!
            </p>
            
            {/* Content sections */}
            <div className="space-y-4">
              
              {/* How to Play section */}
              <div style={{ fontSize: '15px', lineHeight: '1.8', fontFamily: '"Times New Roman", serif' }}>
                <h3 className="text-green-400 font-bold mb-2" style={{ fontSize: '17px' }}>🎮 How to Play!</h3>
                <div className="text-gray-300 ml-4">
                  <p>• Use WASD or arrow keys to move around</p>
                  <p>• Click the fountain to throw WISH tokens</p>
                  <p>• Win big or lose it all in the magical well!</p>
                </div>
              </div>
              
              {/* Portals section */}
              <div style={{ fontSize: '15px', lineHeight: '1.8', fontFamily: '"Times New Roman", serif' }}>
                <h3 className="text-purple-400 font-bold mb-2" style={{ fontSize: '17px' }}>🚪 Portals!</h3>
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