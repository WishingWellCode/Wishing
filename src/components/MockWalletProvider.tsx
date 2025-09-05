// Mock wallet provider for testing without real tokens
import { FC, ReactNode } from 'react'
import { MOCK_WALLET } from '@/lib/config'

interface Props {
  children: ReactNode
}

export const MockWalletProvider: FC<Props> = ({ children }) => {
  // This simulates wallet connection for testing
  const mockWallet = {
    publicKey: { 
      toString: () => MOCK_WALLET.address,
      toBase58: () => MOCK_WALLET.address,
    },
    connected: true,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
    balance: MOCK_WALLET.balance,
  }

  // Override the wallet context
  return (
    <div data-mock-wallet="true">
      {children}
    </div>
  )
}