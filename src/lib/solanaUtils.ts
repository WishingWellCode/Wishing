import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { 
  createBurnInstruction,
  createTransferInstruction, 
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token'

export interface GamblingSession {
  sessionId: string
  serverCommit: string
  clientSeed: string
  burnAddress: string
  exactStake: number
}

export interface GamblingResult {
  success: boolean
  sessionId: string
  serverSeed: string
  clientSeed: string
  burnTx: string
  payoutTx: string | null
  result: {
    tier: string
    multiplier: number
    payout: number
    message: string
  }
}

export class WishGamblingAPI {
  private workerUrl: string
  public connection: Connection

  constructor(workerUrl: string, rpcUrl: string) {
    this.workerUrl = workerUrl
    this.connection = new Connection(rpcUrl, 'confirmed')
  }

  async startGamblingSession(walletAddress: string, clientSeed?: string): Promise<GamblingSession> {
    const response = await fetch(`${this.workerUrl}/api/fountain/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        walletAddress,
        clientSeed 
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to start gambling session')
    }

    return await response.json()
  }

  async createBurnTransaction(
    userWallet: PublicKey,
    tokenMint: PublicKey,
    amount: number
  ): Promise<Transaction> {
    const userTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      userWallet
    )

    const transaction = new Transaction()

    // Create burn instruction
    const burnInstruction = createBurnInstruction(
      userTokenAccount,
      tokenMint,
      userWallet,
      amount * Math.pow(10, 9), // Assuming 9 decimals
      [],
      TOKEN_PROGRAM_ID
    )

    transaction.add(burnInstruction)

    // Set recent blockhash and fee payer
    const { blockhash } = await this.connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = userWallet

    return transaction
  }

  async resolveGamblingSession(sessionId: string, txSignature: string): Promise<GamblingResult> {
    const response = await fetch(`${this.workerUrl}/api/fountain/resolve`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sessionId,
        txSignature 
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to resolve gambling session')
    }

    return await response.json()
  }

  async verifyTransaction(txSignature: string): Promise<boolean> {
    try {
      const tx = await this.connection.getTransaction(txSignature, {
        commitment: 'confirmed'
      })
      return tx !== null && !tx.meta?.err
    } catch (error) {
      console.error('Error verifying transaction:', error)
      return false
    }
  }
}