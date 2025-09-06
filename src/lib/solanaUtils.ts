import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { 
  createBurnInstruction,
  createTransferInstruction, 
  getAssociatedTokenAddress,
  getMint,
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
    this.connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      wsEndpoint: '', // Explicitly disable websockets
      disableRetryOnRateLimit: false,
      httpHeaders: {
        'Content-Type': 'application/json'
      }
    })
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

    // Get the actual decimals for this token
    const mintInfo = await getMint(this.connection, tokenMint)
    const actualDecimals = mintInfo.decimals
    
    // Create burn instruction with correct decimals
    const burnInstruction = createBurnInstruction(
      userTokenAccount,
      tokenMint,
      userWallet,
      amount * Math.pow(10, actualDecimals), // Use actual token decimals
      [],
      TOKEN_PROGRAM_ID
    )

    transaction.add(burnInstruction)

    // Set recent blockhash and fee payer with retry logic
    let retries = 3
    let lastError = null
    
    while (retries > 0) {
      try {
        const { blockhash } = await this.connection.getLatestBlockhash('finalized')
        transaction.recentBlockhash = blockhash
        transaction.feePayer = userWallet
        return transaction
      } catch (error) {
        console.warn(`RPC error (${retries} retries left):`, error)
        lastError = error
        retries--
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }
    
    throw lastError || new Error('Failed to get blockhash after retries')
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

  async getWinnersData(limit: number = 100): Promise<any[]> {
    try {
      const response = await fetch(`${this.workerUrl}/api/leaderboard?limit=${limit}&includeBreakEven=true`)
      if (!response.ok) {
        throw new Error(`Failed to fetch winners data: ${response.status} ${response.statusText}`)
      }
      const rawData = await response.json()
      console.log('🎯 Raw API Response:', {
        url: `${this.workerUrl}/api/leaderboard?limit=${limit}&includeBreakEven=true`,
        status: response.status,
        rawData: rawData,
        type: typeof rawData,
        isArray: Array.isArray(rawData)
      })
      
      // Handle different response formats
      let data: any[] = []
      if (Array.isArray(rawData)) {
        data = rawData
      } else if (rawData && typeof rawData === 'object') {
        // Check if it's an object with an array property
        if (rawData.winners && Array.isArray(rawData.winners)) {
          data = rawData.winners
        } else if (rawData.results && Array.isArray(rawData.results)) {
          data = rawData.results
        } else if (rawData.data && Array.isArray(rawData.data)) {
          data = rawData.data
        } else {
          // Try to convert object values to array
          data = Object.values(rawData).filter(item => 
            typeof item === 'object' && item !== null
          ) as any[]
        }
      }
      
      console.log('🎯 Processed Winners Data:', {
        dataLength: data.length,
        data: data
      })
      
      // Log break-even entries specifically
      if (Array.isArray(data)) {
        const breakEvenEntries = data.filter((entry: any) => 
          entry.payout !== undefined && entry.payout <= (entry.stake || 1000000000)
        )
        console.log('🎯 Break-even entries found:', breakEvenEntries)
      }
      
      return data
    } catch (error) {
      console.error('Error fetching winners:', error)
      return []
    }
  }
}