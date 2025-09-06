'use client'

import { ReactNode, useMemo } from 'react'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { clusterApiUrl } from '@solana/web3.js'

require('@solana/wallet-adapter-react-ui/styles.css')

interface Props {
  children: ReactNode
}

const WalletProviderComponent = ({ children }: Props) => {
  const endpoint = useMemo(() => {
    return process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl('mainnet-beta')
  }, [])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  )

  const ConnectionProviderAny = ConnectionProvider as any
  const SolanaWalletProviderAny = SolanaWalletProvider as any
  const WalletModalProviderAny = WalletModalProvider as any

  return (
    <ConnectionProviderAny endpoint={endpoint}>
      <SolanaWalletProviderAny wallets={wallets} autoConnect>
        <WalletModalProviderAny>
          {children}
        </WalletModalProviderAny>
      </SolanaWalletProviderAny>
    </ConnectionProviderAny>
  )
}

export { WalletProviderComponent as WalletProvider }