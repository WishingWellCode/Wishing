import { createContext, useContext, useState, ReactNode } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

interface Player {
  id: string
  walletAddress: string
  x: number
  y: number
  sprite: string
  nickname?: string
}

interface GameState {
  players: Map<string, Player>
  currentPlayer: Player | null
  fountainPool: number
  lastWinners: Array<{
    address: string
    amount: number
    timestamp: number
  }>
}

interface GameContextType {
  gameState: GameState
  updatePlayerPosition: (x: number, y: number) => void
  throwCoins: (amount: number) => Promise<any>
  connectToGame: () => Promise<void>
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const { publicKey, signTransaction } = useWallet()
  const [gameState, setGameState] = useState<GameState>({
    players: new Map(),
    currentPlayer: null,
    fountainPool: 0,
    lastWinners: []
  })

  // DISABLED: Old multiplayer system - using new LobbyDO system instead
  const connectToGame = async () => {
    console.log('🎮 Old game connection disabled - using new LobbyDO system')
  }

  const updatePlayerPosition = (x: number, y: number) => {
    // DISABLED: Old position updates - using new multiplayer system
  }

  const throwCoins = async (amount: number): Promise<any> => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected')
    }

    const response = await fetch(`https://wish-well-worker.stealthbundlebot.workers.dev/api/gamble`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: publicKey.toString(),
        amount: amount
      })
    })

    return await response.json()
  }

  return (
    <GameContext.Provider value={{
      gameState,
      updatePlayerPosition,
      throwCoins,
      connectToGame
    }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within GameProvider')
  }
  return context
}