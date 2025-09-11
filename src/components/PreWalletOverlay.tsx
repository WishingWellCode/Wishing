import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

interface PreWalletOverlayProps {
  onClose?: () => void
}

export default function PreWalletOverlay({ onClose }: PreWalletOverlayProps) {
  return (
    <>
      <style jsx>{`
        .pre-wallet-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          background: url('/assets/backgrounds/Realbackground.jpg') center/cover no-repeat fixed;
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
        style={{ 
          zIndex: 50000
        }}
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
            maxWidth: '520px',
            width: '85%',
            maxHeight: '75vh',
            background: 'rgba(20, 10, 30, 0.98)',
            border: '3px solid rgba(147, 51, 234, 0.8)',
            boxShadow: '0 0 50px rgba(147, 51, 234, 0.6), inset 0 0 30px rgba(147, 51, 234, 0.2)',
            fontFamily: '"Times New Roman", serif',
            color: '#fff',
            padding: '70px 25px 25px 25px',
            borderRadius: '12px',
            marginTop: '30px'
          }}
        >
          {/* Connect Wallet Button - positioned at top center of the box */}
          <div 
            style={{
              position: 'absolute',
              top: '15px',
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
              Connect Wallet
            </WalletMultiButton>
          </div>

          {/* Box Content */}
          <div style={{
            maxHeight: 'calc(75vh - 100px)',
            overflowY: 'auto',
            paddingRight: '10px'
          }}>
            
            {/* Welcome message */}
            <div className="mb-6 text-center">
              <p className="text-cyan-400 font-bold" style={{ 
                fontSize: '16px', 
                lineHeight: '1.5', 
                fontFamily: '"Times New Roman", serif', 
                fontWeight: 'bold',
                textShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
                letterSpacing: '0.3px'
              }}>
                Connect your Phantom wallet to enter the magical realm and play with other users!
              </p>
            </div>
            
            {/* Content sections */}
            <div className="space-y-4">
              
              {/* How to Play section */}
              <div className="mb-5" style={{ 
                padding: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px'
              }}>
                <h3 className="text-green-400 font-bold mb-2 flex items-center gap-2" style={{ 
                  fontSize: '17px', 
                  fontWeight: 'bold',
                  fontFamily: '"Times New Roman", serif',
                  textShadow: '0 0 15px rgba(16, 185, 129, 0.5)'
                }}>
                  🎮 How to Play!
                </h3>
                <div className="text-gray-200 space-y-1" style={{ 
                  fontSize: '14px',
                  lineHeight: '1.6',
                  fontFamily: '"Times New Roman", serif',
                  paddingLeft: '16px'
                }}>
                  <p className="flex items-center gap-2">
                    <span style={{ color: '#10b981' }}>▸</span>
                    Use <kbd style={{
                      background: 'rgba(147, 51, 234, 0.3)',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      border: '1px solid rgba(147, 51, 234, 0.5)',
                      fontSize: '12px'
                    }}>WASD</kbd> or arrow keys to move around
                  </p>
                  <p className="flex items-center gap-2">
                    <span style={{ color: '#10b981' }}>▸</span>
                    Click the fountain to throw <span style={{ color: '#a855f7', fontWeight: 'bold' }}>WISH</span> tokens
                  </p>
                  <p className="flex items-center gap-2">
                    <span style={{ color: '#10b981' }}>▸</span>
                    Win big or lose it all in the magical well!
                  </p>
                </div>
              </div>
              
              {/* Portals section */}
              <div className="mb-5" style={{ 
                padding: '12px',
                background: 'rgba(147, 51, 234, 0.1)',
                border: '1px solid rgba(147, 51, 234, 0.3)',
                borderRadius: '8px'
              }}>
                <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2" style={{ 
                  fontSize: '17px', 
                  fontWeight: 'bold',
                  fontFamily: '"Times New Roman", serif',
                  textShadow: '0 0 15px rgba(147, 51, 234, 0.5)'
                }}>
                  🚪 Portals!
                </h3>
                <div className="text-gray-200 space-y-1" style={{ 
                  fontSize: '14px',
                  lineHeight: '1.6',
                  fontFamily: '"Times New Roman", serif',
                  paddingLeft: '16px'
                }}>
                  <p className="flex items-center gap-2">
                    <span style={{ color: '#a855f7' }}>▸</span>
                    <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>Info</span> - Learn about the game
                  </p>
                  <p className="flex items-center gap-2">
                    <span style={{ color: '#a855f7' }}>▸</span>
                    <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>House</span> - Purchase and manage your property
                  </p>
                  <p className="flex items-center gap-2">
                    <span style={{ color: '#a855f7' }}>▸</span>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>Links</span> - Join our community
                  </p>
                  <p className="flex items-center gap-2">
                    <span style={{ color: '#a855f7' }}>▸</span>
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Upgrades</span> - Enhance your house
                  </p>
                  <div className="mt-2 pt-2 border-t border-purple-800/30 flex items-center justify-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1" style={{ fontSize: '13px' }}>
                      <span>🎮</span>
                      <span style={{ color: '#a855f7', fontWeight: 'bold' }}>Multiplayer Gaming</span>
                    </span>
                    <span style={{ color: '#4b5563', fontSize: '12px' }}>•</span>
                    <span className="flex items-center gap-1" style={{ fontSize: '13px' }}>
                      <span>💰</span>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Crypto Rewards</span>
                    </span>
                  </div>
                </div>
              </div>
              
            </div>
            
            {/* Return to Game button - only show if onClose is provided */}
            {onClose && (
              <div className="text-center mt-6">
                <button
                  onClick={onClose}
                  className="relative group"
                  style={{ 
                    fontSize: '16px', 
                    fontFamily: '"Times New Roman", serif',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
                    color: '#ffffff',
                    padding: '12px 28px',
                    border: '2px solid rgba(248, 113, 113, 0.5)',
                    borderRadius: '10px',
                    boxShadow: '0 8px 25px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    const btn = e.currentTarget;
                    btn.style.transform = 'translateY(-2px)';
                    btn.style.boxShadow = '0 15px 40px rgba(239, 68, 68, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    const btn = e.currentTarget;
                    btn.style.transform = 'translateY(0)';
                    btn.style.boxShadow = '0 10px 30px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                  }}
                >
                  <span style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ transform: 'rotate(180deg)' }}
                    >
                      <path 
                        d="M9 18l6-6-6-6" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                    Return to Game
                  </span>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                    transition: 'left 0.5s ease',
                  }} className="group-hover:!left-full" />
                </button>
              </div>
            )}
            
          </div>
        </div>
        
      </div>
    </div>
    </>
  )
}