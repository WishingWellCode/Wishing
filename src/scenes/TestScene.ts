import Phaser from 'phaser'
import { WishGamblingAPI, GamblingSession, GamblingResult } from '../lib/solanaUtils'
import { PublicKey } from '@solana/web3.js'

export class TestScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: any
  private testPlayer!: Phaser.GameObjects.Rectangle
  private instructions!: Phaser.GameObjects.Text
  private fountainArea!: Phaser.GameObjects.Arc
  private isNearFountain: boolean = false
  private gamblingUI!: Phaser.GameObjects.Container
  private gamblingAPI!: WishGamblingAPI
  private currentSession: GamblingSession | null = null
  private fountainPolygon: { x: number, y: number }[] = []
  private portals: { [key: string]: { coords: { x: number, y: number }[], isActive: boolean } } = {}
  private currentPortal: string | null = null
  private winnersOverlay: {
    background: Phaser.GameObjects.Rectangle
    title: Phaser.GameObjects.Text
    closeText: Phaser.GameObjects.Text
    elements: Phaser.GameObjects.GameObject[]
    keyHandler?: (event: KeyboardEvent) => void
  } | null = null
  
  constructor() {
    super({ key: 'TestScene' })
  }

  preload() {
    // Load the real vaporwave background
    this.load.image('vaporwave-background', '/assets/backgrounds/Realbackground.jpg')
  }

  create() {
    // Set transparent background to show CSS background
    this.cameras.main.transparent = true
    
    // Add the vaporwave background image with proper scaling
    const background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'vaporwave-background')
    
    // Get original texture dimensions for proper scaling
    const originalWidth = background.texture.source[0].width
    const originalHeight = background.texture.source[0].height
    
    // Calculate scale to cover entire screen while maintaining aspect ratio
    const scaleX = this.cameras.main.width / originalWidth
    const scaleY = this.cameras.main.height / originalHeight
    const scale = Math.max(scaleX, scaleY)
    
    background.setScale(scale)
    background.setDepth(-1000)
    background.setName('vaporwaveBackground') // Name for resize handling
    
    // Initialize gambling API with Alchemy RPC for production
    this.gamblingAPI = new WishGamblingAPI(
      'https://wish-well-worker.stealthbundlebot.workers.dev',
      'https://solana-mainnet.g.alchemy.com/v2/SYEG70FAIl_t9bDEkh4ki'
    )
    
    // No background needed - CSS handles it now
    // Removed Phaser background to prevent conflicts
    
    // Define fountain polygon using your coordinates
    const fountainCoords = [
      {x: 670, y: 726}, {x: 736, y: 695}, {x: 831, y: 677}, {x: 921, y: 671},
      {x: 1021, y: 672}, {x: 1103, y: 683}, {x: 1173, y: 696}, {x: 1227, y: 715},
      {x: 1269, y: 749}, {x: 1247, y: 793}, {x: 1174, y: 821}, {x: 1072, y: 840},
      {x: 959, y: 846}, {x: 827, y: 837}, {x: 738, y: 820}, {x: 672, y: 793},
      {x: 646, y: 762}, {x: 654, y: 739}
    ]
    
    // Store fountain coordinates for vicinity detection
    this.fountainPolygon = fountainCoords
    
    // Initialize portal system with all your coordinates
    this.initializePortals()
    
    // Create invisible fountain area for reference (optional visual debug)
    this.fountainArea = this.add.circle(950, 760, 100, 0x00ff00, 0) as Phaser.GameObjects.Arc
    this.fountainArea.setDepth(0)

    // Only create player if wallet is connected
    const wallet = (window as any).solana
    if (wallet?.isConnected) {
      // Create a simple colored rectangle as test player
      this.testPlayer = this.add.rectangle(
        this.cameras.main.centerX, 
        this.cameras.main.centerY + 100, // Start below fountain
        32, 32, 0x00ff00
      )
      this.testPlayer.setDepth(1)
    } else {
      // Create placeholder for player (will be created when wallet connects)
      console.log('⏳ Waiting for wallet connection to spawn player...')
    }
    
    // Instructions removed - game is now production ready
    
    // Create gambling UI (initially hidden)
    this.createGamblingUI()
    
    // Setup controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
      this.wasd = this.input.keyboard.addKeys('W,A,S,D')
    }
    
    // Camera setup
    this.cameras.main.setZoom(1)
    
    // Handle window resize
    this.events.on('resize', (width: number, height: number) => {
      // Ensure we're working with the active scene
      if (!this.scene.isActive()) return
      
      // Force camera update first
      this.cameras.main.setSize(width, height)
      this.cameras.main.setViewport(0, 0, width, height)
      
      // Update existing background (don't create new ones)
      const existingBackground = this.children.getByName('vaporwaveBackground') as Phaser.GameObjects.Image
      if (existingBackground && existingBackground.texture) {
        // Get original texture dimensions safely
        const texture = this.textures.get('vaporwave-background')
        if (texture && texture.source && texture.source.length > 0) {
          const originalWidth = texture.source[0].width
          const originalHeight = texture.source[0].height
          
          // Calculate scale to cover entire screen while maintaining aspect ratio
          const scaleX = width / originalWidth
          const scaleY = height / originalHeight
          const scale = Math.max(scaleX, scaleY)
          
          existingBackground.setScale(scale)
          existingBackground.setPosition(width / 2, height / 2)
        }
      }
      
      // Reposition gambling UI
      if (this.gamblingUI) {
        this.gamblingUI.setPosition(width / 2, height - 120)
      }
    })
  }

  initializePortals() {
    // Define all portal areas with your coordinates
    this.portals = {
      'Portal 1': {
        coords: [
          {x: 219, y: 679}, {x: 214, y: 659}, {x: 204, y: 662}, {x: 197, y: 544},
          {x: 208, y: 542}, {x: 208, y: 534}, {x: 292, y: 527}, {x: 295, y: 536},
          {x: 298, y: 535}, {x: 298, y: 636}, {x: 289, y: 640}, {x: 290, y: 661},
          {x: 223, y: 678}
        ],
        isActive: false
      },
      'Portal 2': {
        coords: [
          {x: 624, y: 435}, {x: 624, y: 486}, {x: 623, y: 544}, {x: 622, y: 572},
          {x: 679, y: 559}, {x: 730, y: 547}, {x: 728, y: 468}, {x: 724, y: 423},
          {x: 680, y: 425}, {x: 628, y: 433}
        ],
        isActive: false
      },
      'Portal 3': {
        coords: [
          {x: 1157, y: 500}, {x: 1173, y: 361}, {x: 1375, y: 379}, {x: 1353, y: 551},
          {x: 1157, y: 501}
        ],
        isActive: false
      },
      'Portal 4': {
        coords: [
          {x: 1616, y: 654}, {x: 1621, y: 629}, {x: 1631, y: 608}, {x: 1649, y: 600},
          {x: 1667, y: 595}, {x: 1682, y: 600}, {x: 1699, y: 608}, {x: 1717, y: 623},
          {x: 1727, y: 640}, {x: 1736, y: 666}, {x: 1736, y: 680}, {x: 1730, y: 703},
          {x: 1720, y: 720}, {x: 1706, y: 725}, {x: 1687, y: 728}, {x: 1669, y: 725},
          {x: 1648, y: 710}, {x: 1632, y: 696}, {x: 1624, y: 682}, {x: 1618, y: 670},
          {x: 1614, y: 652}
        ],
        isActive: false
      }
    }
    
    console.log('🚪 Initialized 4 portals:', Object.keys(this.portals))
  }

  createGamblingUI() {
    // Create gambling UI container
    this.gamblingUI = this.add.container(this.cameras.main.centerX, this.cameras.main.height - 120)
    this.gamblingUI.setScrollFactor(0)
    this.gamblingUI.setDepth(10)
    this.gamblingUI.setVisible(false)

    // Background panel
    const panel = this.add.rectangle(0, 0, 400, 80, 0x000000, 0.8)
    panel.setStrokeStyle(3, 0xffd700) // Gold border
    
    // Title text
    const title = this.add.text(0, -15, '🪙 Wishing Fountain', {
      fontSize: '18px',
      fontFamily: '"Press Start 2P"',
      color: '#ffd700'
    })
    title.setOrigin(0.5)
    
    // Gamble button
    const gambButton = this.add.rectangle(0, 15, 200, 30, 0x4ade80)
    gambButton.setStrokeStyle(2, 0xffffff)
    gambButton.setInteractive()
    
    const gambText = this.add.text(0, 15, 'Throw 1,000 $WISH', {
      fontSize: '12px',
      fontFamily: '"Press Start 2P"',
      color: '#000000'
    })
    gambText.setOrigin(0.5)
    
    // Button hover effects
    gambButton.on('pointerover', () => {
      gambButton.setFillStyle(0x22c55e)
      gambText.setScale(1.05)
    })
    
    gambButton.on('pointerout', () => {
      gambButton.setFillStyle(0x4ade80)
      gambText.setScale(1)
    })
    
    gambButton.on('pointerdown', () => {
      this.startGambling()
    })
    
    // Add all to container
    this.gamblingUI.add([panel, title, gambButton, gambText])
  }


  // Point-in-polygon detection using ray casting algorithm
  isPointInPolygon(point: { x: number, y: number }, polygon: { x: number, y: number }[]): boolean {
    let isInside = false
    const x = point.x
    const y = point.y
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x
      const yi = polygon[i].y
      const xj = polygon[j].x
      const yj = polygon[j].y
      
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
        isInside = !isInside
      }
    }
    
    return isInside
  }

  checkPortalProximity() {
    const playerPos = { x: this.testPlayer.x, y: this.testPlayer.y }
    let foundPortal: string | null = null
    
    // Check each portal
    for (const [portalName, portal] of Object.entries(this.portals)) {
      const isInsidePortal = this.isPointInPolygon(playerPos, portal.coords)
      
      if (isInsidePortal) {
        foundPortal = portalName
        if (!portal.isActive) {
          // Entering portal
          portal.isActive = true
          console.log(`🚪 Entered ${portalName}`)
          this.onPortalEnter(portalName)
        }
        break
      } else if (portal.isActive) {
        // Leaving portal
        portal.isActive = false
        console.log(`🚪 Left ${portalName}`)
        this.onPortalLeave(portalName)
      }
    }
    
    // Update current portal
    this.currentPortal = foundPortal
  }

  onPortalEnter(portalName: string) {
    console.log(`✨ Portal "${portalName}" activated`)
    
    // Portal 3 - Winners overlay
    if (portalName === 'Portal 3') {
      this.showWinnersOverlay()
    }
    // Add other portal functionality here for Portal 1, 2, and 4
  }

  async showWinnersOverlay() {
    // Prevent multiple overlays
    if (this.winnersOverlay) return

    console.log('📊 Loading winners data...')

    // Create overlay background
    const overlayBg = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      this.cameras.main.width * 0.9,
      this.cameras.main.height * 0.8,
      0x000000,
      0.95
    )
    overlayBg.setDepth(2000)
    overlayBg.setStrokeStyle(3, 0xff00ff)

    // Create title
    const title = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - (overlayBg.height / 2) + 40,
      'RECENT WINNERS',
      {
        fontSize: '24px',
        fontFamily: '"Press Start 2P"',
        color: '#ff00ff',
        align: 'center'
      }
    )
    title.setOrigin(0.5)
    title.setDepth(2001)

    // Loading message
    const loadingText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'Loading winners data...',
      {
        fontSize: '16px',
        fontFamily: '"Press Start 2P"',
        color: '#ffffff',
        align: 'center'
      }
    )
    loadingText.setOrigin(0.5)
    loadingText.setDepth(2001)

    // Close instruction
    const closeText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + (overlayBg.height / 2) - 30,
      'Press ESC to close',
      {
        fontSize: '12px',
        fontFamily: '"Press Start 2P"',
        color: '#888888',
        align: 'center'
      }
    )
    closeText.setOrigin(0.5)
    closeText.setDepth(2001)

    // Store overlay elements
    this.winnersOverlay = {
      background: overlayBg,
      title: title,
      closeText: closeText,
      elements: [overlayBg, title, loadingText, closeText]
    }

    try {
      // Fetch real winners data
      const winnersData = await this.gamblingAPI.getWinnersData(100)
      
      // Remove loading text
      loadingText.destroy()

      if (winnersData.length === 0) {
        const noDataText = this.add.text(
          this.cameras.main.centerX,
          this.cameras.main.centerY,
          'No winners data available yet.',
          {
            fontSize: '14px',
            fontFamily: '"Press Start 2P"',
            color: '#888888',
            align: 'center'
          }
        )
        noDataText.setOrigin(0.5)
        noDataText.setDepth(2001)
        this.winnersOverlay.elements.push(noDataText)
      } else {
        // Create scrollable winners table
        this.createWinnersTable(winnersData, overlayBg)
      }

    } catch (error) {
      console.error('Failed to load winners data:', error)
      loadingText.setText('Failed to load winners data')
    }

    // Handle ESC key to close
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.closeWinnersOverlay()
      }
    }

    this.input.keyboard?.on('keydown', handleEscKey)
    this.winnersOverlay.keyHandler = handleEscKey
  }

  createWinnersTable(winnersData: any[], overlayBg: Phaser.GameObjects.Rectangle) {
    if (!this.winnersOverlay) return

    const tableStartY = overlayBg.y - overlayBg.height/2 + 80
    const rowHeight = 25
    const maxVisibleRows = Math.floor((overlayBg.height - 160) / rowHeight)

    // Table headers
    const headerY = tableStartY
    const colWidth = overlayBg.width / 4

    // Header background
    const headerBg = this.add.rectangle(
      overlayBg.x,
      headerY,
      overlayBg.width - 20,
      rowHeight,
      0x330066,
      0.8
    )
    headerBg.setDepth(2001)
    this.winnersOverlay.elements.push(headerBg)

    // Headers
    const headers = ['Date', 'Won (SOL)', 'Tx Link', 'Winner']
    headers.forEach((header, index) => {
      const headerText = this.add.text(
        overlayBg.x - overlayBg.width/2 + 10 + (colWidth * index) + colWidth/2,
        headerY,
        header,
        {
          fontSize: '12px',
          fontFamily: '"Press Start 2P"',
          color: '#ff00ff',
          align: 'center'
        }
      )
      headerText.setOrigin(0.5)
      headerText.setDepth(2002)
      this.winnersOverlay.elements.push(headerText)
    })

    // Create rows for winners data
    winnersData.slice(0, maxVisibleRows).forEach((winner, rowIndex) => {
      const rowY = headerY + ((rowIndex + 1) * rowHeight)
      
      // Row background (alternating colors)
      const rowBg = this.add.rectangle(
        overlayBg.x,
        rowY,
        overlayBg.width - 20,
        rowHeight,
        rowIndex % 2 === 0 ? 0x111111 : 0x222222,
        0.6
      )
      rowBg.setDepth(2001)
      this.winnersOverlay.elements.push(rowBg)

      // Format data
      const date = winner.timestamp ? new Date(winner.timestamp).toLocaleDateString() : 'N/A'
      const amount = winner.payout ? (winner.payout / 1000000000).toFixed(2) : '0.00' // Convert lamports to SOL
      const txLink = winner.payoutTx ? 'VIEW' : 'N/A'
      const address = winner.walletAddress ? 
        `${winner.walletAddress.slice(0, 4)}...${winner.walletAddress.slice(-4)}` : 'N/A'

      const rowData = [date, amount, txLink, address]

      rowData.forEach((data, colIndex) => {
        const cellText = this.add.text(
          overlayBg.x - overlayBg.width/2 + 10 + (colWidth * colIndex) + colWidth/2,
          rowY,
          data,
          {
            fontSize: colIndex === 2 && winner.payoutTx ? '10px' : '11px',
            fontFamily: colIndex === 3 ? 'monospace' : '"Press Start 2P"',
            color: colIndex === 1 ? '#00ff00' : (colIndex === 2 && winner.payoutTx) ? '#00ffff' : '#ffffff',
            align: 'center'
          }
        )
        cellText.setOrigin(0.5)
        cellText.setDepth(2002)

        // Make transaction link clickable
        if (colIndex === 2 && winner.payoutTx) {
          cellText.setInteractive({ useHandCursor: true })
          cellText.on('pointerdown', () => {
            window.open(`https://solscan.io/tx/${winner.payoutTx}`, '_blank')
          })
          cellText.on('pointerover', () => {
            cellText.setColor('#ffffff')
          })
          cellText.on('pointerout', () => {
            cellText.setColor('#00ffff')
          })
        }

        this.winnersOverlay.elements.push(cellText)
      })
    })

    // Scroll indicator if more data exists
    if (winnersData.length > maxVisibleRows) {
      const scrollText = this.add.text(
        overlayBg.x,
        overlayBg.y + overlayBg.height/2 - 60,
        `Showing ${maxVisibleRows} of ${winnersData.length} winners`,
        {
          fontSize: '10px',
          fontFamily: '"Press Start 2P"',
          color: '#888888',
          align: 'center'
        }
      )
      scrollText.setOrigin(0.5)
      scrollText.setDepth(2002)
      this.winnersOverlay.elements.push(scrollText)
    }
  }

  closeWinnersOverlay() {
    if (!this.winnersOverlay) return

    // Clean up all elements
    this.winnersOverlay.elements.forEach((element: Phaser.GameObjects.GameObject) => {
      if (element && element.destroy) {
        element.destroy()
      }
    })

    // Remove keyboard handler
    if (this.winnersOverlay.keyHandler) {
      this.input.keyboard?.off('keydown', this.winnersOverlay.keyHandler)
    }

    this.winnersOverlay = null
    console.log('Winners overlay closed')
  }

  onPortalLeave(portalName: string) {
    console.log(`👋 Left portal "${portalName}"`)
    
    // Close winners overlay when leaving Portal 3
    if (portalName === 'Portal 3' && this.winnersOverlay) {
      this.closeWinnersOverlay()
    }
  }

  createPlayer() {
    if (this.testPlayer) return // Already created
    
    // Create a simple colored rectangle as test player
    this.testPlayer = this.add.rectangle(
      this.cameras.main.centerX, 
      this.cameras.main.centerY + 100, // Start below fountain
      32, 32, 0x00ff00
    )
    this.testPlayer.setDepth(1)
    console.log('✅ Player spawned after wallet connection')
  }

  async startGambling() {
    console.log('🎲 Starting gambling session...')
    
    // Disable button
    const button = this.gamblingUI.list[2] as Phaser.GameObjects.Rectangle
    const text = this.gamblingUI.list[3] as Phaser.GameObjects.Text
    
    button.setFillStyle(0x6b7280) // Gray out
    text.setText('Creating session...')
    button.disableInteractive()

    try {
      // Check if wallet is connected
      const wallet = (window as any).solana
      if (!wallet?.isConnected) {
        text.setText('Connect wallet first!')
        this.time.delayedCall(2000, () => {
          button.setFillStyle(0x4ade80)
          text.setText('Throw 1,000 $WISH')
          button.setInteractive()
        })
        return
      }

      const walletAddress = wallet.publicKey.toString()
      
      // Start gambling session with worker
      text.setText('Starting session...')
      try {
        this.currentSession = await this.gamblingAPI.startGamblingSession(walletAddress)
      } catch (sessionError: any) {
        if (sessionError?.message?.includes('Already have pending session')) {
          // Clear the pending session
          text.setText('Clearing old session...')
          try {
            const clearResponse = await fetch('https://wish-well-worker.stealthbundlebot.workers.dev/api/fountain/clear', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walletAddress })
            })
            await clearResponse.json()
            // Wait a moment then retry
            await new Promise(resolve => setTimeout(resolve, 1000))
            this.currentSession = await this.gamblingAPI.startGamblingSession(walletAddress)
          } catch (clearError) {
            console.error('Failed to clear session:', clearError)
            throw sessionError
          }
        } else {
          throw sessionError
        }
      }
      
      // Create burn transaction
      text.setText('Preparing burn...')
      const tokenMintAddress = '4ijaKXxNvEurES66hFsRqLysz9YK2grAMA1AjtzVpump'
      const tokenMint = new PublicKey(tokenMintAddress)
      
      // Real burn transaction
      const burnTransaction = await this.gamblingAPI.createBurnTransaction(
        wallet.publicKey,
        tokenMint,
        1000
      )
      
      // Sign and send burn transaction
      text.setText('Sign to burn tokens...')
      const signedTx = await wallet.signTransaction(burnTransaction)
      const signature = await this.gamblingAPI.connection.sendRawTransaction(signedTx.serialize())
      
      // Use HTTP polling instead of websocket subscriptions to avoid spam
      text.setText('Confirming burn...')
      let txConfirmed = false
      const maxRetries = 15 // 15 attempts
      const retryDelay = 3000 // 3 seconds between attempts
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          text.setText(`Confirming burn... (${i + 1}/${maxRetries})`)
          const txInfo = await this.gamblingAPI.connection.getTransaction(signature, { 
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
          })
          
          if (txInfo && !txInfo.meta?.err) {
            txConfirmed = true
            console.log('✅ Transaction confirmed via polling:', signature)
            break
          } else if (txInfo && txInfo.meta?.err) {
            console.log('❌ Transaction failed:', signature, txInfo.meta.err)
            throw new Error('Transaction failed on blockchain')
          }
          
          // Transaction not found yet, wait and retry
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelay))
          }
        } catch (error: any) {
          if (error.message?.includes('failed on blockchain')) {
            throw error
          }
          // Network error or transaction not found yet, continue trying
          console.log(`Polling attempt ${i + 1} failed, retrying...`)
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelay))
          }
        }
      }
      
      if (!txConfirmed) {
        console.log('⚠️ Could not confirm transaction after polling, proceeding anyway:', signature)
        txConfirmed = true // Let worker verify instead
      }
      
      // Resolve gambling session
      text.setText('Rolling dice...')
      const result = await this.gamblingAPI.resolveGamblingSession(this.currentSession.sessionId, signature)
      
      // Show result
      this.showGamblingResult({
        tier: result.result.tier,
        multiplier: result.result.multiplier,
        message: result.result.message || this.getResultMessage(result.result.tier)
      })
      
      // Re-enable button
      button.setFillStyle(0x4ade80)
      text.setText('Throw 1,000 $WISH')
      button.setInteractive()
      
    } catch (error: any) {
      console.error('Gambling error:', error)
      
      // Show error message
      let errorMessage = 'Error - Try again'
      if (error?.message?.includes('insufficient')) {
        errorMessage = 'Insufficient $WISH'
      } else if (error?.message?.includes('rejected')) {
        errorMessage = 'Transaction rejected'
      }
      
      button.setFillStyle(0x4ade80)
      text.setText(errorMessage)
      button.setInteractive()
      
      this.time.delayedCall(3000, () => {
        text.setText('Throw 1,000 $WISH')
      })
    }
  }

  getResultMessage(tier: string): string {
    const messages: { [key: string]: string } = {
      'JACKPOT': '🌟 LEGENDARY JACKPOT!!! 🌟',
      'MAJOR WIN': '💎 MAJOR WIN! 💎',
      'LARGE WIN': '🎉 LARGE WIN! 🎉',
      'MEDIUM WIN': '✨ MEDIUM WIN! ✨',
      'SMALL WIN C': 'Nice win!',
      'SMALL WIN B': 'Small profit!',
      'SMALL WIN A': 'Small gain!',
      'BREAK EVEN': 'Your coins return!',
      'LOSE': 'The fountain keeps your wishes...'
    }
    return messages[tier] || 'Unknown result'
  }

  calculateGamblingResult() {
    // Generate random float in [0,1)
    const roll = Math.random()
    
    // Exact probabilities as specified:
    if (roll < 0.00001) {
      // 0.00001% - Jackpot (15,000×)
      return { tier: 'JACKPOT', multiplier: 15000, message: '🌟 LEGENDARY JACKPOT!!! 🌟' }
    } else if (roll < 0.0014999) {
      // 0.14999% - Major (180×)
      return { tier: 'MAJOR WIN', multiplier: 180, message: '💎 MAJOR WIN! 💎' }
    } else if (roll < 0.0049999) {
      // 0.35% - Large (25×)
      return { tier: 'LARGE WIN', multiplier: 25, message: '🎉 LARGE WIN! 🎉' }
    } else if (roll < 0.0099999) {
      // 0.5% - Medium (9×)
      return { tier: 'MEDIUM WIN', multiplier: 9, message: '✨ MEDIUM WIN! ✨' }
    } else if (roll < 0.0119999) {
      // 0.2% - Small gain C (1.65×)
      return { tier: 'SMALL WIN C', multiplier: 1.65, message: 'Nice win!' }
    } else if (roll < 0.0199999) {
      // 0.8% - Small gain B (1.28×)
      return { tier: 'SMALL WIN B', multiplier: 1.28, message: 'Small profit!' }
    } else if (roll < 0.0999999) {
      // 8% - Small gain A (1.10×)
      return { tier: 'SMALL WIN A', multiplier: 1.1, message: 'Small gain!' }
    } else if (roll < 0.3999999) {
      // 30% - Break even (1.0×)
      return { tier: 'BREAK EVEN', multiplier: 1.0, message: 'Your coins return!' }
    } else {
      // 60% - Lose (0.0×)
      return { tier: 'LOSE', multiplier: 0, message: 'The fountain keeps your wishes...' }
    }
  }

  showGamblingResult(result: any) {
    // Create result popup
    const resultPopup = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY)
    resultPopup.setScrollFactor(0)
    resultPopup.setDepth(20)
    
    // Background
    const bg = this.add.rectangle(0, 0, 500, 200, 0x000000, 0.9)
    bg.setStrokeStyle(4, result.tier === 'JACKPOT' ? 0xffd700 : 0xffffff)
    
    // Result text with tier-specific colors
    let tierColor = '#ffffff' // Default white
    if (result.tier === 'LOSE') tierColor = '#ff4444' // Red
    else if (result.tier === 'BREAK EVEN') tierColor = '#888888' // Gray  
    else if (result.tier.includes('SMALL WIN')) tierColor = '#44ff44' // Green
    else if (result.tier === 'MEDIUM WIN') tierColor = '#00ffff' // Cyan
    else if (result.tier === 'LARGE WIN') tierColor = '#ff00ff' // Magenta
    else if (result.tier === 'MAJOR WIN') tierColor = '#ff8800' // Orange
    else if (result.tier === 'JACKPOT') tierColor = '#ffd700' // Gold
    
    const tierText = this.add.text(0, -40, result.tier.toUpperCase(), {
      fontSize: '24px',
      fontFamily: '"Press Start 2P"',
      color: tierColor
    })
    tierText.setOrigin(0.5)
    
    const messageText = this.add.text(0, -5, result.message, {
      fontSize: '14px',
      fontFamily: '"Press Start 2P"',
      color: '#ffffff'
    })
    messageText.setOrigin(0.5)
    
    const payoutText = this.add.text(0, 25, 
      result.multiplier > 0 ? `Won: ${Math.floor(1000 * result.multiplier)} $WISH` : 'Lost: 1,000 $WISH', {
      fontSize: '16px',
      fontFamily: '"Press Start 2P"',
      color: tierColor
    })
    payoutText.setOrigin(0.5)
    
    // Close button
    const closeBtn = this.add.rectangle(0, 65, 100, 30, 0x6b7280)
    closeBtn.setStrokeStyle(2, 0xffffff)
    closeBtn.setInteractive()
    
    const closeTxt = this.add.text(0, 65, 'Close', {
      fontSize: '12px',
      fontFamily: '"Press Start 2P"',
      color: '#ffffff'
    })
    closeTxt.setOrigin(0.5)
    
    closeBtn.on('pointerdown', () => {
      resultPopup.destroy()
    })
    
    resultPopup.add([bg, tierText, messageText, payoutText, closeBtn, closeTxt])
    
    // Auto-close after 5 seconds
    this.time.delayedCall(5000, () => {
      if (resultPopup && resultPopup.scene) {
        resultPopup.destroy()
      }
    })
  }

  update() {
    // Check if player exists before updating
    if (!this.testPlayer) {
      // Check if wallet is now connected and create player
      const wallet = (window as any).solana
      if (wallet?.isConnected) {
        this.createPlayer()
      }
      return
    }
    
    // Simple movement for the test rectangle
    const speed = 5
    
    // Arrow keys
    if (this.cursors) {
      if (this.cursors.left.isDown) {
        this.testPlayer.x -= speed
      } else if (this.cursors.right.isDown) {
        this.testPlayer.x += speed
      }
      
      if (this.cursors.up.isDown) {
        this.testPlayer.y -= speed
      } else if (this.cursors.down.isDown) {
        this.testPlayer.y += speed
      }
    }
    
    // WASD keys
    if (this.wasd) {
      if (this.wasd.A.isDown) {
        this.testPlayer.x -= speed
      } else if (this.wasd.D.isDown) {
        this.testPlayer.x += speed
      }
      
      if (this.wasd.W.isDown) {
        this.testPlayer.y -= speed
      } else if (this.wasd.S.isDown) {
        this.testPlayer.y += speed
      }
    }
    
    // Check fountain proximity using polygon detection
    const wasNearFountain = this.isNearFountain
    this.isNearFountain = this.isPointInPolygon(
      { x: this.testPlayer.x, y: this.testPlayer.y },
      this.fountainPolygon
    )
    
    // Check portal proximity
    this.checkPortalProximity()
    
    // Show/hide gambling UI based on proximity
    if (this.isNearFountain && !wasNearFountain) {
      this.gamblingUI.setVisible(true)
      // Add a gentle slide-up animation
      this.gamblingUI.y = this.cameras.main.height - 50
      this.tweens.add({
        targets: this.gamblingUI,
        y: this.cameras.main.height - 120,
        duration: 300,
        ease: 'Back.easeOut'
      })
    } else if (!this.isNearFountain && wasNearFountain) {
      // Slide down and hide
      this.tweens.add({
        targets: this.gamblingUI,
        y: this.cameras.main.height - 50,
        duration: 200,
        ease: 'Back.easeIn',
        onComplete: () => {
          this.gamblingUI.setVisible(false)
        }
      })
    }
    
    // Keep player on screen - use camera dimensions
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    this.testPlayer.x = Phaser.Math.Clamp(this.testPlayer.x, 16, width - 16)
    this.testPlayer.y = Phaser.Math.Clamp(this.testPlayer.y, 16, height - 16)
    
  }
}