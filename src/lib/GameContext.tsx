import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey } from '@solana/web3.js'

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
  const [ws, setWs] = useState<WebSocket | null>(null)

  useEffect(() => {
    if (publicKey) {
      connectToGame()
    }
    return () => {
      ws?.close()
    }
  }, [publicKey])

  const connectToGame = async () => {
    if (!publicKey) return

    // Hardcode the worker URL since env vars aren't loading in production
    const workerUrl = 'wss://wish-well-worker.stealthbundlebot.workers.dev'
    const socket = new WebSocket(`${workerUrl}/game`)
    
    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'join',
        walletAddress: publicKey.toString()
      }))
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleGameMessage(data)
    }

    setWs(socket)
  }

  const handleGameMessage = (message: any) => {
    switch (message.type) {
      case 'playerJoined':
        setGameState(prev => {
          const newPlayers = new Map(prev.players)
          newPlayers.set(message.player.id, message.player)
          return { ...prev, players: newPlayers }
        })
        break
      case 'playerMoved':
        setGameState(prev => {
          const newPlayers = new Map(prev.players)
          const player = newPlayers.get(message.playerId)
          if (player) {
            player.x = message.x
            player.y = message.y
            newPlayers.set(message.playerId, player)
          }
          return { ...prev, players: newPlayers }
        })
        break
      case 'fountainUpdate':
        setGameState(prev => ({
          ...prev,
          fountainPool: message.pool,
          lastWinners: message.lastWinners || prev.lastWinners
        }))
        break
    }
  }

  const updatePlayerPosition = (x: number, y: number) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'move',
        x,
        y
      }))
    }
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

    const result = await response.json()
    
    if (result.success && ws) {
      ws.send(JSON.stringify({
        type: 'gamble',
        result: result
      }))
    }

    return result
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