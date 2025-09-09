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
    <div className="bg-gray-800/50 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full font-pixel text-xs">
          <thead>
            <tr className="bg-purple-800/50 border-b border-purple-500">
              <th className="text-left p-3 text-purple-400">Winner</th>
              <th className="text-left p-3 text-purple-400">Won (WISH)</th>
              <th className="text-left p-3 text-purple-400">Tx Link</th>
              <th className="text-left p-3 text-purple-400">Date/Time</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((entry, index) => (
              <tr 
                key={`${entry.tx || 'unknown'}-${index}`}
                className={`border-b border-gray-700/50 ${
                  index % 2 === 0 ? 'bg-gray-700/20' : 'bg-gray-700/10'
                } hover:bg-gray-600/30 transition-colors`}
              >
                <td className="p-3">
                  <span 
                    className="text-white font-mono cursor-help"
                    title={entry.winner}
                  >
                    {formatWallet(entry.winner)}
                  </span>
                </td>
                <td className="p-3 text-green-400 font-bold">
                  {entry.amount || '0'}
                </td>
                <td className="p-3">
                  {isValidTx(entry.tx) ? (
                    <a
                      href={`https://solscan.io/tx/${entry.tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
                    >
                      VIEW TX
                    </a>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="p-3 text-gray-300">
                  {formatDate(entry.ts)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {stats.length >= 20 && (
        <div className="p-3 text-center text-gray-400 font-pixel text-xs border-t border-gray-700/50">
          Showing most recent 20 results
        </div>
      )}
    </div>
  )
}