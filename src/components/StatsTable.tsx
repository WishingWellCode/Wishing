interface StatsEntry {
  winner: string
  amount: string
  tx: string
  ts: string
}

interface StatsTableProps {
  stats: StatsEntry[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

export default function StatsTable({ stats, loading, error, onRetry }: StatsTableProps) {
  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 text-center">
        <div className="text-white font-pixel text-sm">Loading verification data...</div>
        <div className="mt-4 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-700/50 h-8 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 text-center">
        <div className="text-red-400 font-pixel text-sm mb-4">Data unavailable</div>
        <div className="text-gray-400 font-pixel text-xs mb-4">{error}</div>
        <button
          onClick={onRetry}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-pixel text-xs transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (stats.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 text-center">
        <div className="text-gray-400 font-pixel text-sm">No recent results available</div>
      </div>
    )
  }

  const formatDate = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'N/A'
    }
  }

  const formatWallet = (address: string) => {
    if (!address || address.length < 8) return 'N/A'
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const isValidTx = (tx: string) => {
    return tx && tx.length > 20 && !tx.startsWith('PROCESSING_')
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{
      background: 'rgba(15, 15, 25, 0.85)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(0, 255, 255, 0.3)',
      boxShadow: '0 0 30px rgba(0, 255, 255, 0.15), inset 0 0 20px rgba(255, 0, 255, 0.05)'
    }}>
      <div className="w-full">
        <table className="w-full" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ 
              background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%)',
              borderBottom: '2px solid rgba(0, 255, 255, 0.5)'
            }}>
              <th className="text-left p-4 font-bold" style={{ color: '#00ffff', textShadow: '0 0 10px rgba(0, 255, 255, 0.5)', width: '25%' }}>👤 WALLET</th>
              <th className="text-center p-4 font-bold" style={{ color: '#00ffff', textShadow: '0 0 10px rgba(0, 255, 255, 0.5)', width: '20%' }}>💰 AMOUNT</th>
              <th className="text-center p-4 font-bold" style={{ color: '#00ffff', textShadow: '0 0 10px rgba(0, 255, 255, 0.5)', width: '25%' }}>🔗 VERIFY</th>
              <th className="text-right p-4 font-bold" style={{ color: '#00ffff', textShadow: '0 0 10px rgba(0, 255, 255, 0.5)', width: '30%' }}>⏰ TIME</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((entry, index) => (
              <tr 
                key={`${entry.tx || 'unknown'}-${index}`}
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  background: index % 2 === 0 ? 'rgba(138, 43, 226, 0.05)' : 'rgba(6, 182, 212, 0.05)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateX(5px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = index % 2 === 0 ? 'rgba(138, 43, 226, 0.05)' : 'rgba(6, 182, 212, 0.05)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <td className="p-4 text-left" style={{ width: '25%' }}>
                  <span 
                    className="cursor-help"
                    style={{ 
                      color: '#fff',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      textShadow: '0 0 5px rgba(255, 255, 255, 0.3)'
                    }}
                    title={entry.winner}
                  >
                    {formatWallet(entry.winner)}
                  </span>
                </td>
                <td className="p-4 text-center" style={{ width: '20%' }}>
                  <span style={{ 
                    color: '#00ff00',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                  }}>
                    {entry.amount || '0'}
                  </span>
                </td>
                <td className="p-4 text-center" style={{ width: '25%' }}>
                  {isValidTx(entry.tx) ? (
                    <a
                      href={`https://solscan.io/tx/${entry.tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        background: 'linear-gradient(45deg, #7c3aed, #06b6d4)',
                        color: 'white',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        boxShadow: '0 0 15px rgba(124, 58, 237, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 0 25px rgba(6, 182, 212, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(124, 58, 237, 0.3)';
                      }}
                    >
                      VIEW TX
                    </a>
                  ) : (
                    <span style={{ color: '#666', fontSize: '12px' }}>-</span>
                  )}
                </td>
                <td className="p-4 text-right" style={{ 
                  color: '#a0a0a0',
                  fontSize: '11px',
                  width: '30%'
                }}>
                  {formatDate(entry.ts)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {stats.length >= 20 && (
        <div style={{
          padding: '16px',
          textAlign: 'center',
          color: '#00ffff',
          fontFamily: '"Press Start 2P"',
          fontSize: '10px',
          borderTop: '1px solid rgba(0, 255, 255, 0.3)',
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          SHOWING MOST RECENT 20 RESULTS
        </div>
      )}
    </div>
  )
}