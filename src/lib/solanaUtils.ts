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
      // Add timeout to prevent long waits
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(`${this.workerUrl}/api/leaderboard?limit=${limit}&includeBreakEven=true&includeAll=true`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch winners data: ${response.status} ${response.statusText}`)
      }
      
      const rawData = await response.json()
      console.log('🎯 Winners API Response:', {
        status: response.status,
        dataKeys: rawData && typeof rawData === 'object' ? Object.keys(rawData) : null,
        topWinnersCount: rawData?.topWinners?.length || 0
      })
      
      // Handle different response formats
      let data: any[] = []
      if (Array.isArray(rawData)) {
        data = rawData
        console.log('✅ Using direct array response')
      } else if (rawData && typeof rawData === 'object') {
        
        // Combine all available arrays, checking all possible properties
        const allArrays: any[] = []
        
        // Check all possible array properties
        const arrayProps = ['topWinners', 'mostActive', 'luckiest', 'winners', 'results', 'data', 'leaderboard', 'history', 'transactions']
        
        for (const prop of arrayProps) {
          if (rawData[prop] && Array.isArray(rawData[prop]) && rawData[prop].length > 0) {
            console.log(`✅ Found ${rawData[prop].length} items in ${prop}`)
            allArrays.push(...rawData[prop])
          }
        }
        
        if (allArrays.length > 0) {
          data = allArrays
          console.log('✅ Using combined arrays:', allArrays.length, 'items')
        } else {
          console.log('❌ No data found in any array property:', Object.keys(rawData))
          
          // Try additional endpoints to find where transactions might be stored
          console.log('🔍 Trying additional endpoints...')
          
          const additionalEndpoints = [
            '/api/stats',
            '/api/fountain/history',
            '/api/transactions',
            '/api/results'
          ]
          
          for (const endpoint of additionalEndpoints) {
            try {
              console.log(`🔍 Checking ${endpoint}...`)
              const additionalResponse = await fetch(`${this.workerUrl}${endpoint}`)
              if (additionalResponse.ok) {
                const additionalData = await additionalResponse.json()
                console.log(`📊 ${endpoint} response:`, {
                  keys: typeof additionalData === 'object' ? Object.keys(additionalData) : 'not object',
                  data: additionalData,
                  stringified: JSON.stringify(additionalData, null, 2)
                })
                
                // If this is stats and has data, let's check what's in it
                if (endpoint === '/api/stats' && additionalData && typeof additionalData === 'object') {
                  console.log('🎯 Analyzing stats data for possible transaction arrays...')
                  Object.keys(additionalData).forEach(key => {
                    if (Array.isArray(additionalData[key])) {
                      console.log(`📊 stats.${key} has ${additionalData[key].length} items:`, additionalData[key])
                    } else if (additionalData[key] && typeof additionalData[key] === 'object') {
                      console.log(`📊 stats.${key} is object:`, additionalData[key])
                    } else {
                      console.log(`📊 stats.${key}:`, additionalData[key])
                    }
                  })
                }
              } else {
                console.log(`❌ ${endpoint} returned ${additionalResponse.status}`)
              }
            } catch (e) {
              console.log(`❌ ${endpoint} failed:`, e)
            }
          }
          
          return []
        }
      }
      
      console.log(`✅ Processed ${data.length} winner entries`)
      
      return data
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Winners fetch timed out after 5 seconds')
        // Try to return cached data or empty array
        return []
      } else {
        console.error('Error fetching winners:', error)
      }
      return []
    }
  }
}