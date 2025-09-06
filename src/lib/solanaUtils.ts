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
      const response = await fetch(`${this.workerUrl}/api/leaderboard?limit=${limit}&includeBreakEven=true&includeAll=true`)
      if (!response.ok) {
        throw new Error(`Failed to fetch winners data: ${response.status} ${response.statusText}`)
      }
      
      const rawData = await response.json()
      console.log('🎯 Raw API Response:', {
        url: `${this.workerUrl}/api/leaderboard?limit=${limit}&includeBreakEven=true&includeAll=true`,
        status: response.status,
        rawData: rawData,
        type: typeof rawData,
        isArray: Array.isArray(rawData),
        keys: rawData && typeof rawData === 'object' ? Object.keys(rawData) : null,
        stringified: JSON.stringify(rawData, null, 2)
      })
      
      // Handle different response formats
      let data: any[] = []
      if (Array.isArray(rawData)) {
        data = rawData
        console.log('✅ Using direct array response')
      } else if (rawData && typeof rawData === 'object') {
        console.log('🔍 API Response Object Keys:', Object.keys(rawData))
        console.log('🔍 API Response Object Values:', Object.values(rawData))
        
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
      
      console.log('🎯 Processed Winners Data:', {
        dataLength: data.length,
        sampleEntry: data[0] || null,
        stringifiedData: JSON.stringify(data.slice(0, 3), null, 2)
      })
      
      // Log break-even entries specifically
      if (Array.isArray(data) && data.length > 0) {
        const breakEvenEntries = data.filter((entry: any) => 
          entry.payout !== undefined && entry.payout <= (entry.stake || 1000000000)
        )
        console.log('🎯 Break-even entries found:', breakEvenEntries)
        
        // Also check for your specific transaction IDs from the logs
        const yourTransactions = data.filter((entry: any) => {
          const txIds = ['wbZZWp4JVi6DUgiFY1ZGVGtzN1xKxdyQuNJFQfQWepaVLWv5mewZxkj7SDEAMxobA2ue7RKB1LHpvJoaoMnpzZa',
                       'qAmBkQnjHoMq1tsecJVKztSENzF3MNwj8jC4hwXeTs2Rzq8PYNP4mmHj19zEB8zaTWQj1fZhHpU3CrWCowQXeqQ',
                       '4AUYCjFuP6aSgiZFxdaCYocKndmZVWFMSDKxRchnu3V5EBQA6NRCM4TUUJ2Qj7sCdjSzwrH8XDWAADrid5ocM8gc',
                       '5GAHDcRtuF8UBpVQjzqwydbzJDE4XJUthtMjvkGSvydfU4NidNzbbj9p9sNP4hUtHxLBaQLfDva7SjjQFA9tnvr3']
          return txIds.some(txId => 
            entry.burnTx === txId || entry.payoutTx === txId || 
            entry.txId === txId || entry.transactionId === txId
          )
        })
        console.log('🔍 Your specific transactions found:', yourTransactions)
      }
      
      return data
    } catch (error) {
      console.error('Error fetching winners:', error)
      return []
    }
  }
}