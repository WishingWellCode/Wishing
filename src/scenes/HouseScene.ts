import Phaser from 'phaser'

export class HouseScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: any
  private player!: Phaser.GameObjects.Rectangle
  private houseLevel: number = 1
  private exitPortal: { coords: { x: number, y: number }[], isActive: boolean } = {
    coords: [],
    isActive: false
  }
  private portalWarning: Phaser.GameObjects.Container | null = null
  private isNearPortal: boolean = false
  private interactKey!: Phaser.Input.Keyboard.Key
  private portalGraphics: Phaser.GameObjects.Graphics | null = null
  private portalGlow: number = 0
  private confirmationShowing: boolean = false

  constructor() {
    super({ key: 'HouseScene' })
  }

  init(data: { houseLevel: number }) {
    this.houseLevel = data.houseLevel || 1
  }

  preload() {
    // Load tier backgrounds
    for (let i = 1; i <= 6; i++) {
      const textureName = `tier${i}-background`
      if (this.textures.exists(textureName)) {
        this.textures.remove(textureName)
      }
      this.load.image(textureName, `/assets/houses/tier${i}.png`)
    }
  }

  create() {
    // Clean up any existing background
    const existingBg = this.children.getByName('houseBackground') as Phaser.GameObjects.Image
    if (existingBg) {
      existingBg.destroy()
    }
    
    // Set transparent background to allow CSS background to show through
    this.cameras.main.transparent = true
    
    // Add the tier background image
    const backgroundTextureName = `tier${this.houseLevel}-background`
    const background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, backgroundTextureName)
    background.setName('houseBackground')
    background.setDepth(-1000)
    
    // Scale background to cover screen
    const texture = this.textures.get(backgroundTextureName)
    if (texture && texture.source && texture.source.length > 0) {
      const originalWidth = texture.source[0].width
      const originalHeight = texture.source[0].height
      
      const scaleX = this.cameras.main.width / originalWidth
      const scaleY = this.cameras.main.height / originalHeight
      const scale = Math.max(scaleX, scaleY)
      
      background.setScale(scale)
    }
    
    // Listen for resize events
    this.scale.on('resize', this.handleResize, this)
    
    // Create player character - green rectangle like in TestScene
    this.player = this.add.rectangle(
      this.cameras.main.centerX, 
      this.cameras.main.centerY + 100,
      32, 32, 0x00ff00
    )
    this.player.setDepth(1)
    
    // Setup controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
      this.wasd = this.input.keyboard.addKeys('W,A,S,D')
    }
    
    // Camera setup
    this.cameras.main.setZoom(1)
    
    // Add interact key for portal confirmation
    if (this.input.keyboard) {
      this.interactKey = this.input.keyboard.addKey('E')
    }
  }

  handleResize(gameSize: any) {
    // Update background position and scale on resize
    const background = this.children.getByName('houseBackground') as Phaser.GameObjects.Image
    if (background) {
      background.setPosition(gameSize.width / 2, gameSize.height / 2)
      
      const backgroundTextureName = `tier${this.houseLevel}-background`
      const texture = this.textures.get(backgroundTextureName)
      if (texture && texture.source && texture.source.length > 0) {
        const originalWidth = texture.source[0].width
        const originalHeight = texture.source[0].height
        
        const scaleX = gameSize.width / originalWidth
        const scaleY = gameSize.height / originalHeight
        const scale = Math.max(scaleX, scaleY)
        
        background.setScale(scale)
      }
    }
    
    // Update camera
    this.cameras.main.setSize(gameSize.width, gameSize.height)
  }

  // Point-in-polygon detection (same as TestScene)
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
    if (this.exitPortal.coords.length === 0) {
      console.log('No portal coords set')
      return
    }
    
    const playerPos = { x: this.player.x, y: this.player.y }
    const isInsidePortal = this.isPointInPolygon(playerPos, this.exitPortal.coords)
    
    // Debug logging
    if (Math.floor(this.game.loop.frame) % 60 === 0) { // Log every second
      console.log('Player pos:', playerPos, 'Inside portal:', isInsidePortal, 'Portal coords:', this.exitPortal.coords.length)
    }
    
    if (isInsidePortal && !this.isNearPortal) {
      this.isNearPortal = true
      console.log('🚪 Player entered portal area')
      this.showPortalWarning()
    } else if (!isInsidePortal && this.isNearPortal) {
      this.isNearPortal = false
      console.log('🚪 Player left portal area')
      this.hidePortalWarning()
    }
    
    // Check for interaction key press when near portal
    if (this.isNearPortal && this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      console.log('🚪 E key pressed near portal')
      this.showConfirmationDialog()
    }
  }
  
  showPortalWarning() {
    if (this.portalWarning) return
    
    // Create warning container
    this.portalWarning = this.add.container(this.player.x, this.player.y - 60)
    this.portalWarning.setDepth(1000)
    
    // Create background for warning
    const bg = this.add.rectangle(0, 0, 220, 40, 0x000000, 0.8)
    bg.setStrokeStyle(2, 0xffff00)
    
    // Create warning text
    const text = this.add.text(0, 0, 'Press E to Exit House', {
      fontSize: '14px',
      color: '#ffff00',
      fontFamily: 'monospace'
    })
    text.setOrigin(0.5)
    
    this.portalWarning.add([bg, text])
    
    // Add floating animation
    this.tweens.add({
      targets: this.portalWarning,
      y: this.player.y - 65,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }
  
  hidePortalWarning() {
    if (this.portalWarning) {
      this.portalWarning.destroy()
      this.portalWarning = null
    }
  }
  
  showConfirmationDialog() {
    if (this.confirmationShowing) return
    this.confirmationShowing = true
    
    // Pause player movement
    const wasMoving = this.player.active
    this.player.setActive(false)
    
    // Create confirmation dialog
    const dialogContainer = this.add.container(
      this.cameras.main.centerX,
      this.cameras.main.centerY
    )
    dialogContainer.setDepth(2000)
    
    // Dialog background
    const dialogBg = this.add.rectangle(0, 0, 400, 200, 0x000000, 0.9)
    dialogBg.setStrokeStyle(3, 0xff0000)
    
    // Title
    const title = this.add.text(0, -60, 'EXIT HOUSE?', {
      fontSize: '24px',
      color: '#ff0000',
      fontFamily: 'monospace',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    
    // Message
    const message = this.add.text(0, -20, 'Are you sure you want to return\nto the main game?', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      align: 'center'
    })
    message.setOrigin(0.5)
    
    // Yes button
    const yesBtn = this.add.rectangle(-80, 40, 120, 40, 0x00ff00, 0.8)
    yesBtn.setStrokeStyle(2, 0x00ff00)
    yesBtn.setInteractive({ useHandCursor: true })
    
    const yesText = this.add.text(-80, 40, 'YES (Y)', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace'
    })
    yesText.setOrigin(0.5)
    
    // No button
    const noBtn = this.add.rectangle(80, 40, 120, 40, 0xff0000, 0.8)
    noBtn.setStrokeStyle(2, 0xff0000)
    noBtn.setInteractive({ useHandCursor: true })
    
    const noText = this.add.text(80, 40, 'NO (N)', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace'
    })
    noText.setOrigin(0.5)
    
    dialogContainer.add([dialogBg, title, message, yesBtn, yesText, noBtn, noText])
    
    // Handle button clicks
    yesBtn.on('pointerdown', () => {
      dialogContainer.destroy()
      this.returnToMainGame()
    })
    
    noBtn.on('pointerdown', () => {
      dialogContainer.destroy()
      this.confirmationShowing = false
      this.player.setActive(true)
    })
    
    // Handle keyboard shortcuts
    const yKey = this.input.keyboard?.addKey('Y')
    const nKey = this.input.keyboard?.addKey('N')
    
    if (yKey) {
      yKey.once('down', () => {
        dialogContainer.destroy()
        this.returnToMainGame()
      })
    }
    
    if (nKey) {
      nKey.once('down', () => {
        dialogContainer.destroy()
        this.confirmationShowing = false
        this.player.setActive(true)
      })
    }
  }

  returnToMainGame() {
    console.log('🏠 Leaving house, returning to main game...')
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  update() {
    if (!this.player || this.confirmationShowing) return
    
    // Simple movement system matching TestScene
    const speed = 5
    
    // Arrow keys
    if (this.cursors) {
      if (this.cursors.left.isDown) {
        this.player.x -= speed
      } else if (this.cursors.right.isDown) {
        this.player.x += speed
      }
      
      if (this.cursors.up.isDown) {
        this.player.y -= speed
      } else if (this.cursors.down.isDown) {
        this.player.y += speed
      }
    }
    
    // WASD keys
    if (this.wasd) {
      if (this.wasd.A.isDown) {
        this.player.x -= speed
      } else if (this.wasd.D.isDown) {
        this.player.x += speed
      }
      
      if (this.wasd.W.isDown) {
        this.player.y -= speed
      } else if (this.wasd.S.isDown) {
        this.player.y += speed
      }
    }
    
    // Check portal proximity
    this.checkPortalProximity()
    
    // Update portal warning position if active
    if (this.portalWarning && this.isNearPortal) {
      this.portalWarning.x = this.player.x
    }
    
    // Keep player on screen
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    this.player.x = Phaser.Math.Clamp(this.player.x, 16, width - 16)
    this.player.y = Phaser.Math.Clamp(this.player.y, 16, height - 16)
  }

  // Method to set exit portal coordinates (called from React component)
  setExitPortal(coords: { x: number, y: number }[]) {
    this.exitPortal.coords = coords
    console.log('🚪 Exit portal set with', coords.length, 'coordinates')
    
    // Draw portal area visualization
    if (this.portalGraphics) {
      this.portalGraphics.destroy()
    }
    
    if (coords.length > 0) {
      this.portalGraphics = this.add.graphics()
      this.portalGraphics.setDepth(0)
      
      // Draw more visible portal area
      this.portalGraphics.lineStyle(3, 0x00ffff, 0.8)
      this.portalGraphics.fillStyle(0x00ffff, 0.2)
      
      this.portalGraphics.beginPath()
      this.portalGraphics.moveTo(coords[0].x, coords[0].y)
      for (let i = 1; i < coords.length; i++) {
        this.portalGraphics.lineTo(coords[i].x, coords[i].y)
      }
      this.portalGraphics.closePath()
      this.portalGraphics.fillPath()
      this.portalGraphics.strokePath()
      
      // Add pulsing effect
      this.tweens.add({
        targets: this.portalGraphics,
        alpha: 0.6,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
      
      console.log('✅ Portal visualization created with coordinates:', coords)
    }
  }
}