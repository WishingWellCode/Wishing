import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { walletAddress } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!walletAddress || typeof walletAddress !== 'string') {
    return res.status(400).json({ error: 'Invalid wallet address' })
  }

  try {
    // For now, return default data that allows Level 1 purchase - this will be connected to your worker/database later
    // You can integrate this with your Cloudflare Worker housing system
    const userData = {
      currentLevel: 0,
      totalBurned: 1000000, // Set high enough to allow all purchases for testing
      ownedLevels: [] // Array of house levels owned by user
    }

    // TODO: Integrate with your Cloudflare Worker to get real data
    // const response = await fetch(`${process.env.WORKER_URL}/api/housing/${walletAddress}`)
    // if (response.ok) {
    //   const data = await response.json()
    //   return res.status(200).json(data)
    // }

    res.status(200).json(userData)
  } catch (error) {
    console.error('Error fetching housing data:', error)
    res.status(500).json({ error: 'Failed to fetch housing data' })
  }
}