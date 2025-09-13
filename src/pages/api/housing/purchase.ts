import { NextApiRequest, NextApiResponse } from 'next'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { walletAddress, level, cost } = req.body

  if (!walletAddress || !level || !cost) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    // Validate inputs
    const wallet = new PublicKey(walletAddress)
    const houseLevel = parseInt(level)
    const houseCost = parseInt(cost)

    if (houseLevel < 1 || houseLevel > 6) {
      return res.status(400).json({ error: 'Invalid house level' })
    }

    // For now, simulate a successful purchase
    // TODO: Implement actual Solana transaction logic to send tokens to pool wallet
    
    // Pool wallet address (from wrangler.toml)
    const POOL_WALLET = process.env.POOL_WALLET_PUBLIC || "3Vb7GcmDC2uwakUXMeg2PPEiXaGdjUdPywKF6BnGV9Kx"
    const WNDR_TOKEN_MINT = process.env.NEXT_PUBLIC_WNDR_TOKEN_MINT || "ASajWWYDv5QDCjVBQbxT9ThhvGptaTJBZUSAfK5opump"
    
    console.log(`Purchase request: Level ${houseLevel}, Cost: ${houseCost} $WNDR, Wallet: ${walletAddress}`)
    
    // Create the transaction (this is a template - you'll need to sign it on the frontend)
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com')
    
    const transaction = new Transaction()
    
    // Get token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(WNDR_TOKEN_MINT),
      wallet
    )
    
    const toTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(WNDR_TOKEN_MINT),
      new PublicKey(POOL_WALLET)
    )
    
    // Create transfer instruction (send tokens to pool wallet, not burn)
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      wallet,
      houseCost * Math.pow(10, 9), // WNDR has 9 decimal places (pumpfun token)
      [],
      TOKEN_PROGRAM_ID
    )
    
    transaction.add(transferInstruction)
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = wallet
    
    // Serialize transaction for frontend signing
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    }).toString('base64')
    
    // For now, simulate success and return transaction for signing
    // In production, you'd verify the transaction was signed and submitted successfully
    // before updating the user's housing data
    
    res.status(200).json({ 
      success: true,
      message: `Successfully prepared purchase of Level ${houseLevel} house for ${houseCost} $WNDR`,
      transaction: serializedTransaction,
      // TODO: Update user housing data in your database/worker
      newHousingData: {
        currentLevel: houseLevel,
        totalBurned: 0, // Update with actual burned amount from your system
        ownedLevels: [houseLevel] // Add to existing owned levels
      }
    })

  } catch (error) {
    console.error('Error processing house purchase:', error)
    res.status(500).json({ error: 'Failed to process purchase' })
  }
}