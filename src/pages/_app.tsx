import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { WalletProvider } from '@/components/WalletProvider'
import { GameProvider } from '@/lib/GameContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <GameProvider>
        <Component {...pageProps} />
      </GameProvider>
    </WalletProvider>
  )
}