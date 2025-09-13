import Phaser from 'phaser'
import { WishGamblingAPI, GamblingSession, GamblingResult } from '../lib/solanaUtils'
import { PublicKey } from '@solana/web3.js'
import { getPortalConfig, trackPortalEvent } from '../lib/portalHelpers'
import { WorldRenderer } from '../game/WorldRenderer'

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
  private lastPortalDebug: number = 0
  private lastUpdateDebug: number = 0
  private worldRenderer!: WorldRenderer
  private winnersOverlay: {
    background: Phaser.GameObjects.Rectangle
    title: Phaser.GameObjects.Text
    closeText: Phaser.GameObjects.Text
    elements: Phaser.GameObjects.GameObject[]
    keyHandler?: (event: KeyboardEvent) => void
  } | null = null
  
  private portal1Warning: {
    background: Phaser.GameObjects.Rectangle
    title: Phaser.GameObjects.Text
    message: Phaser.GameObjects.Text
    continueButton: Phaser.GameObjects.Rectangle
    continueText: Phaser.GameObjects.Text
    cancelButton: Phaser.GameObjects.Rectangle
    cancelText: Phaser.GameObjects.Text
    elements: Phaser.GameObjects.GameObject[]
    keyHandler?: (event: KeyboardEvent) => void
  } | null = null
  
  private portal2Warning: {
    background: Phaser.GameObjects.Rectangle
    title: Phaser.GameObjects.Text
    message: Phaser.GameObjects.Text
    continueButton: Phaser.GameObjects.Rectangle
    continueText: Phaser.GameObjects.Text
    cancelButton: Phaser.GameObjects.Rectangle
    cancelText: Phaser.GameObjects.Text
    elements: Phaser.GameObjects.GameObject[]
    keyHandler?: (event: KeyboardEvent) => void
  } | null = null
  
  private portal4Warning: {
    background: Phaser.GameObjects.Rectangle
    title: Phaser.GameObjects.Text
    message: Phaser.GameObjects.Text
    continueButton: Phaser.GameObjects.Rectangle
    continueText: Phaser.GameObjects.Text
    cancelButton: Phaser.GameObjects.Rectangle
    cancelText: Phaser.GameObjects.Text
    elements: Phaser.GameObjects.GameObject[]
    keyHandler?: (event: KeyboardEvent) => void
  } | null = null
  
  constructor() {
    super({ key: 'TestScene' })
  }

  preload() {
    // No background loading needed - using CSS background
    
    // Load custom multiplayer sprites for WorldRenderer
    this.load.image('blue', '/assets/sprites/Multiplayer-sprites/blue.png')
    this.load.image('default', '/assets/sprites/Multiplayer-sprites/default.png')
    this.load.image('grey', '/assets/sprites/Multiplayer-sprites/grey.png')
    this.load.image('lime', '/assets/sprites/Multiplayer-sprites/lime.png')
    this.load.image('ping', '/assets/sprites/Multiplayer-sprites/ping.png')
    this.load.image('red', '/assets/sprites/Multiplayer-sprites/red.png')
  }

  create() {
    console.log('🔍 DEBUG: TestScene create() called')
    // Set transparent background to show CSS background - no Phaser background needed
    this.cameras.main.transparent = true
    
    // Listen for resize events to update background
    this.scale.on('resize', this.handleResize, this)
    
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

    // Setup wallet connection listeners for efficient player creation
    this.setupWalletListeners()
    
    // Don't create player immediately - let GameCanvas or multiplayer handle it
    console.log('🎮 TestScene started - waiting for multiplayer connection')
    // Player creation will be triggered by GameCanvas after multiplayer is ready
    
    // Instructions removed - game is now production ready
    
    // Create gambling UI (initially hidden)
    this.createGamblingUI()
    
    // Setup controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
      this.wasd = this.input.keyboard.addKeys('W,A,S,D')
      console.log('✅ Keyboard controls initialized (Arrow keys + WASD)')
    } else {
      console.error('❌ Keyboard input not available!')
    }
    
    // Camera setup
    this.cameras.main.setZoom(1)
    
    // Initialize WorldRenderer for consistent multiplayer rendering
    this.worldRenderer = new WorldRenderer(this)
    console.log('🌍 WorldRenderer initialized in TestScene')
  }

  handleResize(gameSize: any) {
    // Update camera
    this.cameras.main.setSize(gameSize.width, gameSize.height)
    
    // Update UI elements positions if they exist
    if (this.gamblingUI) {
      this.gamblingUI.x = gameSize.width / 2
      this.gamblingUI.y = gameSize.height - 120
    }
    
    // Update overlay if it exists
    if (this.winnersOverlay) {
      this.handleOverlayResize()
    }
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
      fontFamily: '"Times New Roman", serif',
      color: '#ffd700'
    })
    title.setOrigin(0.5)
    
    // Gamble button
    const gambButton = this.add.rectangle(0, 15, 200, 30, 0x4ade80)
    gambButton.setStrokeStyle(2, 0xffffff)
    gambButton.setInteractive()
    
    const gambText = this.add.text(0, 15, 'Throw 1,000 $WNDR', {
      fontSize: '12px',
      fontFamily: '"Times New Roman", serif',
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
    if (!this.testPlayer) {
      console.log('🔍 DEBUG: No testPlayer found for portal detection')
      return
    }
    
    const playerPos = { x: this.testPlayer.x, y: this.testPlayer.y }
    let foundPortal: string | null = null
    
    // Removed excessive debug logging
    
    // Check each portal
    for (const [portalName, portal] of Object.entries(this.portals)) {
      const isInsidePortal = this.isPointInPolygon(playerPos, portal.coords)
      
      if (isInsidePortal) {
        foundPortal = portalName
        if (!portal.isActive) {
          // Entering portal
          portal.isActive = true
          console.log(`🚪 Entered ${portalName} at position:`, playerPos)
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
    
    // Portal 1 - Housing/Upgrades warning modal
    if (portalName === 'Portal 1') {
      this.showPortal1Warning()
    }
    
    // Portal 2 - Links page navigation
    if (portalName === 'Portal 2') {
      this.showPortal2Warning()
    }
    
    // Portal 3 - Winners overlay
    if (portalName === 'Portal 3') {
      this.showWinnersOverlay()
    }
    
    // Portal 4 - Info page navigation
    if (portalName === 'Portal 4') {
      this.showPortal4Warning()
    }
  }

  async showWinnersOverlay() {
    // Prevent multiple overlays
    if (this.winnersOverlay) return

    console.log('📊 Loading winners data...')

    // Create overlay background
    const overlayBg = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      this.cameras.main.width * 0.72,
      this.cameras.main.height * 0.64,
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
        fontFamily: '"Times New Roman", serif',
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
        fontFamily: '"Times New Roman", serif',
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
        fontFamily: '"Times New Roman", serif',
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
      // Fetch real winners data - up to 100 entries
      const winnersData = await this.gamblingAPI.getWinnersData(100)
      
      // Remove loading text
      loadingText.destroy()

      // Filter out losses to check if we have any winners
      const actualWinners = winnersData.filter(w => w.tier !== 'LOSE')
      
      console.log('🎯 Winners data check:', {
        totalData: winnersData.length,
        actualWinners: actualWinners.length,
        sampleEntry: winnersData[0],
        sampleWinner: actualWinners[0]
      })

      if (winnersData.length === 0 || actualWinners.length === 0) {
        const noDataText = this.add.text(
          this.cameras.main.centerX,
          this.cameras.main.centerY,
          actualWinners.length === 0 && winnersData.length > 0 
            ? 'No winners yet! Only losses so far.\nBe the first to win!'
            : 'No winners yet! Be the first to try your luck.\nYour winning transactions will appear here.',
          {
            fontSize: '14px',
            fontFamily: '"Times New Roman", serif',
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

    // Filter out losing transactions (amount = 0 or tier = LOSE)
    const filteredWinners = winnersData.filter(winner => {
      const tier = winner.tier
      // Only show actual wins and break-even
      return tier !== 'LOSE'
    })

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
    this.winnersOverlay?.elements.push(headerBg)

    // Headers
    const headers = ['Winner', 'Won (WISH)', 'Tx Link', 'Date']
    headers.forEach((header, index) => {
      if (!this.winnersOverlay) return
      
      const headerText = this.add.text(
        overlayBg.x - overlayBg.width/2 + 10 + (colWidth * index) + colWidth/2,
        headerY,
        header,
        {
          fontSize: '12px',
          fontFamily: '"Times New Roman", serif',
          color: '#ff00ff',
          align: 'center'
        }
      )
      headerText.setOrigin(0.5)
      headerText.setDepth(2002)
      this.winnersOverlay.elements.push(headerText)
    })

    // Create rows for filtered winners data
    filteredWinners.slice(0, maxVisibleRows).forEach((winner, rowIndex) => {
      if (!this.winnersOverlay) return
      
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

      // Format data with new API format
      const timestamp = winner.timestamp
      const date = timestamp ? new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'N/A'
      
      // Calculate amount based on tier since API returns "0"
      let calculatedAmount = '0'
      const tier = winner.tier
      if (tier === 'JACKPOT') calculatedAmount = '15,000,000' // 15000x
      else if (tier === 'MAJOR WIN') calculatedAmount = '180,000' // 180x
      else if (tier === 'LARGE WIN') calculatedAmount = '25,000' // 25x
      else if (tier === 'MEDIUM WIN') calculatedAmount = '9,000' // 9x
      else if (tier === 'SMALL WIN C') calculatedAmount = '1,650' // 1.65x
      else if (tier === 'SMALL WIN B') calculatedAmount = '1,280' // 1.28x
      else if (tier === 'SMALL WIN A') calculatedAmount = '1,100' // 1.1x
      else if (tier === 'BREAK EVEN') calculatedAmount = '1,000' // 1x
      else if (tier === 'LOSE') calculatedAmount = '0' // 0x
      
      // Use calculated amount or API amount if provided
      const amount = (winner.amount && winner.amount !== '0') ? winner.amount : calculatedAmount
      
      // Transaction ID for Solscan link - use tx field from API
      const txId = winner.tx || winner.burnTx || winner.payoutTx || winner.transactionId
      // Show VIEW link if we have any transaction ID (not PROCESSING_)
      const isValidTx = txId && txId.length > 20 && !txId.startsWith('PROCESSING_')
      const txLink = isValidTx ? 'VIEW TX' : '-'
      
      // Winner address formatting
      const walletAddr = winner.winner
      const address = walletAddr ? 
        `${walletAddr.slice(0, 6)}...${walletAddr.slice(-4)}` : 'N/A'
      

      const rowData = [address, amount, txLink, date]

      rowData.forEach((data, colIndex) => {
        if (!this.winnersOverlay) return
        
        const cellText = this.add.text(
          overlayBg.x - overlayBg.width/2 + 10 + (colWidth * colIndex) + colWidth/2,
          rowY,
          data,
          {
            fontSize: colIndex === 2 && isValidTx ? '10px' : '11px',
            fontFamily: colIndex === 0 ? 'monospace' : '"Press Start 2P"',
            color: colIndex === 1 ? '#00ff00' : (colIndex === 2 && isValidTx) ? '#00ffff' : (colIndex === 2 ? '#666666' : '#ffffff'),
            align: 'center'
          }
        )
        cellText.setOrigin(0.5)
        cellText.setDepth(2002)

        // Make transaction link clickable only if valid
        if (colIndex === 2 && isValidTx) {
          cellText.setInteractive({ useHandCursor: true })
          cellText.on('pointerdown', () => {
            window.open(`https://solscan.io/tx/${txId}`, '_blank')
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
    if (filteredWinners.length > maxVisibleRows && this.winnersOverlay) {
      const scrollText = this.add.text(
        overlayBg.x,
        overlayBg.y + overlayBg.height/2 - 60,
        `Showing ${Math.min(maxVisibleRows, filteredWinners.length)} of ${filteredWinners.length} winners`,
        {
          fontSize: '10px',
          fontFamily: '"Times New Roman", serif',
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

    console.log('🧹 Cleaning up winners overlay...')

    // Clean up all elements in the elements array
    if (this.winnersOverlay.elements && Array.isArray(this.winnersOverlay.elements)) {
      this.winnersOverlay.elements.forEach((element: Phaser.GameObjects.GameObject) => {
        if (element && element.destroy) {
          try {
            element.destroy()
          } catch (e) {
            console.warn('Failed to destroy overlay element:', e)
          }
        }
      })
    }

    // Clean up individual properties that might not be in the elements array
    const individualElements = ['background', 'title', 'closeText', 'loadingText']
    individualElements.forEach(prop => {
      if (this.winnersOverlay[prop] && this.winnersOverlay[prop].destroy) {
        try {
          this.winnersOverlay[prop].destroy()
        } catch (e) {
          console.warn(`Failed to destroy ${prop}:`, e)
        }
      }
    })

    // Remove keyboard handler
    if (this.winnersOverlay.keyHandler) {
      this.input.keyboard?.off('keydown', this.winnersOverlay.keyHandler)
    }

    this.winnersOverlay = null
    
    // Safety cleanup: search for any lingering text objects with "No winners yet" and destroy them
    this.children.list.forEach((child: Phaser.GameObjects.GameObject) => {
      if (child.type === 'Text') {
        const textObj = child as Phaser.GameObjects.Text
        if (textObj.text.includes('No winners yet') || textObj.text.includes('Your winning transactions will appear here')) {
          console.log('🗑️ Found and destroying lingering winners text')
          try {
            textObj.destroy()
          } catch (e) {
            console.warn('Failed to destroy lingering text:', e)
          }
        }
      }
    })
    
    console.log('✅ Winners overlay fully cleaned up')
  }

  showPortal1Warning() {
    // Prevent multiple warning modals
    if (this.portal1Warning) return

    console.log('🏠 Showing Portal 1 housing upgrade warning...')

    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    const modalWidth = Math.min(screenWidth * 0.6, 600)
    const modalHeight = Math.min(screenHeight * 0.5, 400)

    // Create modal background
    const background = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      modalWidth,
      modalHeight,
      0x000000,
      0.95
    )
    background.setDepth(3000)
    background.setStrokeStyle(3, 0x8b5cf6)

    // Create title
    const title = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - modalHeight/2 + 60,
      'Housing District',
      {
        fontSize: '24px',
        color: '#8b5cf6',
        fontFamily: '"Times New Roman", serif',
        fontStyle: 'bold',
        align: 'center'
      }
    )
    title.setOrigin(0.5)
    title.setDepth(3001)

    // Create message
    const message = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 20,
      'Welcome to the Housing District!\n\nTo access this portal, you need to visit\nthe Upgrades page first to purchase\nyour housing upgrades.\n\nWould you like to go there now?',
      {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: '"Times New Roman", serif',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 8
      }
    )
    message.setOrigin(0.5)
    message.setDepth(3001)

    // Continue button
    const continueButton = this.add.rectangle(
      this.cameras.main.centerX - 100,
      this.cameras.main.centerY + modalHeight/2 - 60,
      180,
      40,
      0x22c55e
    )
    continueButton.setDepth(3001)
    continueButton.setStrokeStyle(2, 0x16a34a)

    const continueText = this.add.text(
      continueButton.x,
      continueButton.y,
      'CONTINUE',
      {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'bold "Times New Roman", serif'
      }
    )
    continueText.setOrigin(0.5)
    continueText.setDepth(3002)

    // Cancel button
    const cancelButton = this.add.rectangle(
      this.cameras.main.centerX + 100,
      this.cameras.main.centerY + modalHeight/2 - 60,
      140,
      40,
      0xef4444
    )
    cancelButton.setDepth(3001)
    cancelButton.setStrokeStyle(2, 0xdc2626)

    const cancelText = this.add.text(
      cancelButton.x,
      cancelButton.y,
      'CANCEL',
      {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'bold "Times New Roman", serif'
      }
    )
    cancelText.setOrigin(0.5)
    cancelText.setDepth(3002)

    // Make buttons interactive
    continueButton.setInteractive({ useHandCursor: true })
    continueText.setInteractive({ useHandCursor: true })
    
    cancelButton.setInteractive({ useHandCursor: true })
    cancelText.setInteractive({ useHandCursor: true })

    // Store all elements for cleanup
    const elements = [background, title, message, continueButton, continueText, cancelButton, cancelText]
    
    this.portal1Warning = {
      background,
      title,
      message,
      continueButton,
      continueText,
      cancelButton,
      cancelText,
      elements
    }

    // Handle continue button click
    const handleContinue = () => {
      console.log('🚀 Redirecting to /upgrades...')
      this.closePortal1Warning()
      // Redirect to upgrades page
      if (typeof window !== 'undefined') {
        window.location.href = '/upgrades'
      }
    }

    // Handle cancel button click
    const handleCancel = () => {
      console.log('❌ Portal 1 access cancelled')
      this.closePortal1Warning()
    }

    // Add click handlers
    continueButton.on('pointerdown', handleContinue)
    continueText.on('pointerdown', handleContinue)
    cancelButton.on('pointerdown', handleCancel)
    cancelText.on('pointerdown', handleCancel)

    // Keyboard handling
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel()
      }
    }

    this.input.keyboard?.on('keydown', handleEscKey)
    this.portal1Warning.keyHandler = handleEscKey
  }

  closePortal1Warning() {
    if (!this.portal1Warning) return

    // Clean up all elements
    this.portal1Warning.elements.forEach((element: Phaser.GameObjects.GameObject) => {
      if (element && element.destroy) {
        element.destroy()
      }
    })

    // Remove keyboard handler
    if (this.portal1Warning.keyHandler) {
      this.input.keyboard?.off('keydown', this.portal1Warning.keyHandler)
    }

    this.portal1Warning = null
    console.log('Portal 1 warning closed')
  }

  showPortal2Warning() {
    // Prevent multiple warning modals
    if (this.portal2Warning) return

    console.log('🔗 Showing Portal 2 links page warning...')

    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    const modalWidth = Math.min(screenWidth * 0.6, 600)
    const modalHeight = Math.min(screenHeight * 0.5, 400)

    // Create modal background
    const background = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      modalWidth,
      modalHeight,
      0x000000,
      0.95
    )
    background.setDepth(3000)
    background.setStrokeStyle(3, 0x8b5cf6)

    // Create title
    const title = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - modalHeight/2 + 60,
      'Community Links',
      {
        fontSize: '24px',
        color: '#8b5cf6',
        fontFamily: '"Times New Roman", serif',
        fontStyle: 'bold',
        align: 'center'
      }
    )
    title.setOrigin(0.5)
    title.setDepth(3001)

    // Create message
    const message = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 20,
      'Welcome to the Community Hub!\n\nConnect with the $WNDR community\nthrough our social media channels.\n\nWould you like to visit our\nLinks page now?',
      {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: '"Times New Roman", serif',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 8
      }
    )
    message.setOrigin(0.5)
    message.setDepth(3001)

    // Continue button
    const continueButton = this.add.rectangle(
      this.cameras.main.centerX - 100,
      this.cameras.main.centerY + modalHeight/2 - 60,
      180,
      40,
      0x22c55e
    )
    continueButton.setDepth(3001)
    continueButton.setStrokeStyle(2, 0x16a34a)

    const continueText = this.add.text(
      continueButton.x,
      continueButton.y,
      'CONTINUE',
      {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'bold "Times New Roman", serif'
      }
    )
    continueText.setOrigin(0.5)
    continueText.setDepth(3002)

    // Cancel button
    const cancelButton = this.add.rectangle(
      this.cameras.main.centerX + 100,
      this.cameras.main.centerY + modalHeight/2 - 60,
      140,
      40,
      0xef4444
    )
    cancelButton.setDepth(3001)
    cancelButton.setStrokeStyle(2, 0xdc2626)

    const cancelText = this.add.text(
      cancelButton.x,
      cancelButton.y,
      'CANCEL',
      {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'bold "Times New Roman", serif'
      }
    )
    cancelText.setOrigin(0.5)
    cancelText.setDepth(3002)

    // Make buttons interactive
    continueButton.setInteractive({ useHandCursor: true })
    continueText.setInteractive({ useHandCursor: true })
    
    cancelButton.setInteractive({ useHandCursor: true })
    cancelText.setInteractive({ useHandCursor: true })

    // Store all elements for cleanup
    const elements = [background, title, message, continueButton, continueText, cancelButton, cancelText]
    
    this.portal2Warning = {
      background,
      title,
      message,
      continueButton,
      continueText,
      cancelButton,
      cancelText,
      elements
    }

    // Handle continue button click
    const handleContinue = () => {
      console.log('🔗 Redirecting to /links...')
      this.closePortal2Warning()
      // Redirect to links page
      if (typeof window !== 'undefined') {
        window.location.href = '/links'
      }
    }

    // Handle cancel button click
    const handleCancel = () => {
      console.log('❌ Portal 2 access cancelled')
      this.closePortal2Warning()
    }

    // Add click handlers
    continueButton.on('pointerdown', handleContinue)
    continueText.on('pointerdown', handleContinue)
    cancelButton.on('pointerdown', handleCancel)
    cancelText.on('pointerdown', handleCancel)

    // Keyboard handling
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel()
      }
    }

    this.input.keyboard?.on('keydown', handleEscKey)
    this.portal2Warning.keyHandler = handleEscKey
  }

  closePortal2Warning() {
    if (!this.portal2Warning) return

    // Clean up all elements
    this.portal2Warning.elements.forEach((element: Phaser.GameObjects.GameObject) => {
      if (element && element.destroy) {
        element.destroy()
      }
    })

    // Remove keyboard handler
    if (this.portal2Warning.keyHandler) {
      this.input.keyboard?.off('keydown', this.portal2Warning.keyHandler)
    }

    this.portal2Warning = null
    console.log('Portal 2 warning closed')
  }

  showPortal4Warning() {
    // Prevent multiple warning modals
    if (this.portal4Warning) return

    // Check if Portal 4 is enabled via feature flag
    const portal4Config = getPortalConfig('Portal 4')
    if (!portal4Config) {
      console.log('🚫 Portal 4 is disabled via feature flag')
      return
    }

    console.log('ℹ️ Showing Portal 4 info page warning...')
    trackPortalEvent('Portal 4', 'show')

    const screenWidth = this.cameras.main.width
    const screenHeight = this.cameras.main.height
    const modalWidth = Math.min(screenWidth * 0.6, 600)
    const modalHeight = Math.min(screenHeight * 0.5, 400)

    // Create modal background
    const background = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      modalWidth,
      modalHeight,
      0x000000,
      0.95
    )
    background.setDepth(3000)
    background.setStrokeStyle(3, 0x8b5cf6)

    // Create title
    const title = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - modalHeight/2 + 60,
      portal4Config.title,
      {
        fontSize: '24px',
        color: '#8b5cf6',
        fontFamily: '"Times New Roman", serif',
        fontStyle: 'bold',
        align: 'center'
      }
    )
    title.setOrigin(0.5)
    title.setDepth(3001)

    // Create message
    const message = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 20,
      portal4Config.body,
      {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: '"Times New Roman", serif',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 8
      }
    )
    message.setOrigin(0.5)
    message.setDepth(3001)

    // Continue button
    const continueButton = this.add.rectangle(
      this.cameras.main.centerX - 100,
      this.cameras.main.centerY + modalHeight/2 - 60,
      180,
      40,
      0x22c55e
    )
    continueButton.setDepth(3001)
    continueButton.setStrokeStyle(2, 0x16a34a)

    const continueText = this.add.text(
      continueButton.x,
      continueButton.y,
      portal4Config.confirmLabel,
      {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: '"Times New Roman", serif',
        fontStyle: 'bold'
      }
    )
    continueText.setOrigin(0.5)
    continueText.setDepth(3002)

    // Cancel button
    const cancelButton = this.add.rectangle(
      this.cameras.main.centerX + 100,
      this.cameras.main.centerY + modalHeight/2 - 60,
      140,
      40,
      0xef4444
    )
    cancelButton.setDepth(3001)
    cancelButton.setStrokeStyle(2, 0xdc2626)

    const cancelText = this.add.text(
      cancelButton.x,
      cancelButton.y,
      portal4Config.cancelLabel,
      {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: '"Times New Roman", serif',
        fontStyle: 'bold'
      }
    )
    cancelText.setOrigin(0.5)
    cancelText.setDepth(3002)

    // Make buttons interactive
    continueButton.setInteractive({ useHandCursor: true })
    continueText.setInteractive({ useHandCursor: true })
    
    cancelButton.setInteractive({ useHandCursor: true })
    cancelText.setInteractive({ useHandCursor: true })

    // Store all elements for cleanup
    const elements = [background, title, message, continueButton, continueText, cancelButton, cancelText]
    
    this.portal4Warning = {
      background,
      title,
      message,
      continueButton,
      continueText,
      cancelButton,
      cancelText,
      elements
    }

    // Handle continue button click
    const handleContinue = () => {
      console.log('ℹ️ Redirecting to /info...')
      trackPortalEvent('Portal 4', 'confirm')
      this.closePortal4Warning()
      portal4Config.onConfirm()
    }

    // Handle cancel button click
    const handleCancel = () => {
      console.log('❌ Portal 4 access cancelled')
      trackPortalEvent('Portal 4', 'cancel')
      this.closePortal4Warning()
    }

    // Add click handlers
    continueButton.on('pointerdown', handleContinue)
    continueText.on('pointerdown', handleContinue)
    cancelButton.on('pointerdown', handleCancel)
    cancelText.on('pointerdown', handleCancel)

    // Keyboard handling
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel()
      }
    }

    this.input.keyboard?.on('keydown', handleEscKey)
    this.portal4Warning.keyHandler = handleEscKey
  }

  closePortal4Warning() {
    if (!this.portal4Warning) return

    // Clean up all elements
    this.portal4Warning.elements.forEach((element: Phaser.GameObjects.GameObject) => {
      if (element && element.destroy) {
        element.destroy()
      }
    })

    // Remove keyboard handler
    if (this.portal4Warning.keyHandler) {
      this.input.keyboard?.off('keydown', this.portal4Warning.keyHandler)
    }

    this.portal4Warning = null
    console.log('Portal 4 warning closed')
  }

  // Handle window resize for overlay
  handleOverlayResize() {
    if (this.winnersOverlay) {
      console.log('🔧 Handling overlay resize - NOT recreating to prevent background issues')
      // Don't recreate the overlay on resize to prevent background duplication
      // The overlay will be repositioned by the camera updates
    }
  }

  onPortalLeave(portalName: string) {
    console.log(`👋 Left portal "${portalName}"`)
    
    // Close Portal 1 warning when leaving Portal 1
    if (portalName === 'Portal 1' && this.portal1Warning) {
      this.closePortal1Warning()
    }
    
    // Close Portal 2 warning when leaving Portal 2
    if (portalName === 'Portal 2' && this.portal2Warning) {
      this.closePortal2Warning()
    }
    
    // Close winners overlay when leaving Portal 3
    if (portalName === 'Portal 3' && this.winnersOverlay) {
      this.closeWinnersOverlay()
    }
    
    // Close Portal 4 warning when leaving Portal 4
    if (portalName === 'Portal 4' && this.portal4Warning) {
      this.closePortal4Warning()
    }
  }

  setupWalletListeners() {
    // Listen for multiplayer ready event
    window.addEventListener('multiplayerReady', (event: any) => {
      console.log('🎮 Multiplayer ready event received:', event.detail)
      if (!this.testPlayer) {
        this.createPlayer()
      }
    })
    
    // Listen for multiplayer connection event
    window.addEventListener('multiplayerConnected', (event: any) => {
      console.log('🎮 Multiplayer connected event received:', event.detail)
      if (!this.testPlayer) {
        // Small delay to ensure everything is initialized
        this.time.delayedCall(200, () => {
          this.createPlayer()
        })
      }
    })
    
    // Listen for wallet connection events as backup
    window.addEventListener('walletConnected', () => {
      if (!this.testPlayer) {
        console.log('👛 Wallet connected event - will create player when multiplayer is ready')
        // Don't create immediately - wait for multiplayer
      }
    })
    
    // Listen for custom wallet connection events from React components
    window.addEventListener('solanaWalletConnected', () => {
      if (!this.testPlayer) {
        console.log('👛 Solana wallet connected event - will create player when multiplayer is ready')
        // Don't create immediately - wait for multiplayer
      }
    })
  }

  private playerCreating: boolean = false
  private controlsErrorLogged: boolean = false
  
  createPlayer() {
    if (this.testPlayer) {
      console.log('⚠️ Player already exists, skipping creation')
      return // Already created
    }
    
    if (this.playerCreating) {
      console.log('⚠️ Player creation already in progress, skipping')
      return // Prevent multiple simultaneous creations
    }
    
    this.playerCreating = true
    console.log('🎮 Creating invisible player for movement tracking...')
    
    // Ensure multiplayer is connected first
    const mm = (window as any).multiplayerManager
    if (!mm || !mm.isConnected) {
      console.log('⚠️ Multiplayer not connected yet, deferring player creation')
      this.playerCreating = false
      
      // Retry in a moment
      this.time.delayedCall(500, () => {
        this.createPlayer()
      })
      return
    }
    
    // Use random spawn position to avoid stuck positions
    const spawnX = this.cameras.main.centerX + Phaser.Math.Between(-50, 50)
    const spawnY = this.cameras.main.centerY + 100 + Phaser.Math.Between(-20, 20)
    
    // Create an invisible player for position tracking - visible player handled by multiplayer system
    this.testPlayer = this.add.rectangle(
      spawnX, 
      spawnY,
      32, 32, 0x00ff00
    )
    this.testPlayer.setDepth(1)
    this.testPlayer.setVisible(false) // Hide since multiplayer overlay shows the real sprite
    console.log('✅ Invisible player spawned for portal detection at', this.testPlayer.x, this.testPlayer.y)
    
    // Spawn local player through WorldRenderer
    const localPlayer = this.worldRenderer.spawnLocalPlayer({
      id: 'local-player',
      x: this.testPlayer.x,
      y: this.testPlayer.y,
      sprite: 'default'
    })
    
    if (localPlayer) {
      // WorldRenderer already sets the correct scale (2)
      console.log('🎮 Local player sprite created through WorldRenderer')
    }
    
    // Force multiple position updates to ensure sprite spawns
    this.updateMultiplayerPosition(this.testPlayer.x, this.testPlayer.y)
    console.log('📍 Initial position synced with multiplayer:', this.testPlayer.x, this.testPlayer.y)
    
    // Send multiple updates with small movements to force sprite visibility
    const forceSpawnUpdates = [50, 100, 200, 500, 1000]
    forceSpawnUpdates.forEach((delay) => {
      this.time.delayedCall(delay, () => {
        if (this.testPlayer) {
          // Add tiny movement to force update
          const offsetX = delay === 50 ? 1 : 0
          const offsetY = delay === 100 ? 1 : 0
          this.testPlayer.x += offsetX
          this.testPlayer.y += offsetY
          this.updateMultiplayerPosition(this.testPlayer.x, this.testPlayer.y)
          console.log(`📍 [${delay}ms] Force sync position:`, this.testPlayer.x, this.testPlayer.y)
        }
      })
    })
    
    this.playerCreating = false
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
          text.setText('Throw 1,000 $WNDR')
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
      const tokenMintAddress = 'DgSwxG6JdFn8CZWqkJpRbmeaHZ11UUg2KmJ4btanpump'
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
      text.setText('Throw 1,000 $WNDR')
      button.setInteractive()
      
    } catch (error: any) {
      console.error('Gambling error:', error)
      
      // Show error message
      let errorMessage = 'Error - Try again'
      if (error?.message?.includes('insufficient')) {
        errorMessage = 'Insufficient $WNDR'
      } else if (error?.message?.includes('rejected')) {
        errorMessage = 'Transaction rejected'
      }
      
      button.setFillStyle(0x4ade80)
      text.setText(errorMessage)
      button.setInteractive()
      
      this.time.delayedCall(3000, () => {
        text.setText('Throw 1,000 $WNDR')
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
    
    // Background - made wider to contain text properly
    const bg = this.add.rectangle(0, 0, 600, 220, 0x000000, 0.9)
    bg.setStrokeStyle(4, result.tier === 'JACKPOT' ? 0xffd700 : 0xffffff)
    
    // Result text with tier-specific colors (updated for new tier names)
    let tierColor = '#ffffff' // Default white
    if (result.tier === 'BUST' || result.tier === 'LOSE') tierColor = '#ff4444' // Red
    else if (result.tier === 'BREAK EVEN') tierColor = '#888888' // Gray  
    else if (result.tier === 'WIN') tierColor = '#44ff44' // Green
    else if (result.tier === 'BIG WIN') tierColor = '#00ffff' // Cyan
    else if (result.tier === 'MEGA WIN') tierColor = '#ff00ff' // Magenta
    else if (result.tier === 'JACKPOT') tierColor = '#ffd700' // Gold
    
    const tierText = this.add.text(0, -50, result.tier.toUpperCase(), {
      fontSize: '24px',
      fontFamily: '"Times New Roman", serif',
      color: tierColor,
      fontStyle: 'bold'
    })
    tierText.setOrigin(0.5)
    
    const messageText = this.add.text(0, -10, result.message, {
      fontSize: '14px',
      fontFamily: '"Times New Roman", serif',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 550, useAdvancedWrap: true }
    })
    messageText.setOrigin(0.5)
    
    const payoutText = this.add.text(0, 35, 
      result.multiplier > 0 ? `Won: ${Math.floor(1000 * result.multiplier)} $WNDR` : 'Lost: 1,000 $WNDR', {
      fontSize: '16px',
      fontFamily: '"Times New Roman", serif',
      color: tierColor,
      fontStyle: 'bold'
    })
    payoutText.setOrigin(0.5)
    
    // Close button
    const closeBtn = this.add.rectangle(0, 75, 100, 30, 0x6b7280)
    closeBtn.setStrokeStyle(2, 0xffffff)
    closeBtn.setInteractive()
    
    const closeTxt = this.add.text(0, 75, 'Close', {
      fontSize: '12px',
      fontFamily: '"Times New Roman", serif',
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

  update(time: number, delta: number) {
    // Only proceed if player exists
    if (!this.testPlayer) {
      // Skip - player should be created by scene switching logic
      // Don't try to auto-create here as it causes sync issues
      return
    }
    
    // Check if controls are available
    if (!this.cursors || !this.wasd) {
      if (!this.controlsErrorLogged) {
        console.error('❌ Controls not initialized - cannot move!')
        this.controlsErrorLogged = true
      }
      return
    }
    
    // Removed excessive debug logging
    
    // Smooth movement system with delta time normalization
    // Base speed at 60fps, normalized for any refresh rate
    const baseSpeed = 390 // pixels per second (6.5 * 60)
    const speed = (baseSpeed * delta) / 1000 // Convert to pixels per frame
    
    let deltaX = 0
    let deltaY = 0
    
    // Arrow keys
    if (this.cursors) {
      if (this.cursors.left.isDown) {
        deltaX -= speed
      } else if (this.cursors.right.isDown) {
        deltaX += speed
      }
      
      if (this.cursors.up.isDown) {
        deltaY -= speed
      } else if (this.cursors.down.isDown) {
        deltaY += speed
      }
    }
    
    // WASD keys
    if (this.wasd) {
      if (this.wasd.A.isDown) {
        deltaX -= speed
      } else if (this.wasd.D.isDown) {
        deltaX += speed
      }
      
      if (this.wasd.W.isDown) {
        deltaY -= speed
      } else if (this.wasd.S.isDown) {
        deltaY += speed
      }
    }
    
    // Apply diagonal movement normalization
    if (deltaX !== 0 && deltaY !== 0) {
      // Normalize diagonal movement to maintain consistent speed
      const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      deltaX = (deltaX / length) * speed
      deltaY = (deltaY / length) * speed
    }
    
    // Apply movement
    this.testPlayer.x += deltaX
    this.testPlayer.y += deltaY
    
    // Update local player sprite through WorldRenderer
    const localPlayerSprite = this.worldRenderer.getLocalPlayer()
    if (localPlayerSprite && (deltaX !== 0 || deltaY !== 0)) {
      localPlayerSprite.x = this.testPlayer.x
      localPlayerSprite.y = this.testPlayer.y
    }
    
    // Update multiplayer position so visible sprite follows
    if (deltaX !== 0 || deltaY !== 0) {
      // Only log occasionally to reduce spam
      if (Math.random() < 0.1) {
        console.log('🏃 Movement detected - Position:', Math.round(this.testPlayer.x), Math.round(this.testPlayer.y))
      }
      this.updateMultiplayerPosition(this.testPlayer.x, this.testPlayer.y)
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
    
    // Update local player sprite position after clamping
    const localPlayerSprite2 = this.worldRenderer.getLocalPlayer()
    if (localPlayerSprite2) {
      localPlayerSprite2.x = this.testPlayer.x
      localPlayerSprite2.y = this.testPlayer.y
    }
    
  }
  
  private multiplayerRetryTimer: any = null
  
  private updateMultiplayerPosition(x: number, y: number) {
    // Update via exposed multiplayer manager directly
    try {
      if (typeof window !== 'undefined' && (window as any).multiplayerManager) {
        (window as any).multiplayerManager.updatePosition(x, y)
        // Log every movement for debugging
        console.log('📡 Position synced with multiplayer:', x, y)
      } else {
        // Multiplayer manager not ready yet - retry
        console.log('⚠️ MultiplayerManager not available, retrying...')
        if (!this.multiplayerRetryTimer) {
          this.multiplayerRetryTimer = this.time.delayedCall(1000, () => {
            this.multiplayerRetryTimer = null
            if (this.testPlayer) {
              this.updateMultiplayerPosition(this.testPlayer.x, this.testPlayer.y)
            }
          })
        }
      }
    } catch (error) {
      console.error('❌ Error updating multiplayer position:', error)
    }
  }
  
  // Handle multiplayer messages from remote players
  public handleMultiplayerMessage(data: any) {
    switch (data.type) {
      case 'playerMoved':
        if (data.player && data.player.id !== 'local-player') {
          console.log('🎮 Player moved:', data.player.id, 'username:', data.player.username, 'sprite:', data.player.sprite)
          // Check if player exists, if not add them first
          if (!this.worldRenderer.hasRemotePlayer(data.player.id)) {
            console.log('🆕 Adding missing player during move:', data.player.username)
            this.worldRenderer.addRemotePlayer(data.player.id, {
              x: data.player.x,
              y: data.player.y,
              username: data.player.username,
              sprite: data.player.sprite
            })
          } else {
            // Just update position
            this.worldRenderer.updateRemotePlayer(data.player.id, {
              x: data.player.x,
              y: data.player.y,
              anim: data.player.anim
            })
          }
        }
        break
        
      case 'playerJoined':
        if (data.player && data.player.id !== 'local-player') {
          console.log('🆕 Player joined:', data.player.id, 'username:', data.player.username, 'sprite:', data.player.sprite)
          this.worldRenderer.addRemotePlayer(data.player.id, {
            x: data.player.x,
            y: data.player.y,
            username: data.player.username,
            sprite: data.player.sprite
          })
        }
        break
        
      case 'playerLeft':
        if (data.playerId !== 'local-player') {
          this.worldRenderer.removeRemotePlayer(data.playerId)
        }
        break
        
      case 'stateSnapshot':
        if (data.players) {
          console.log('📸 State snapshot received with', data.players.length, 'players:', data.players.map(p => `${p.username}(${p.sprite})`).join(', '))
          this.worldRenderer.handleStateSnapshot(data.players)
        }
        break
    }
  }
  
  // Get player count for UI
  public getPlayerCount(): number {
    return this.worldRenderer.getPlayerCount()
  }
  
  // Clear all players when scene shuts down
  shutdown() {
    console.log('🔍 DEBUG: TestScene shutdown - cleaning up all players')
    this.worldRenderer.clearAllPlayers()
    
    // Clear local references
    if (this.testPlayer) {
      this.testPlayer = null as any
    }
  }
}