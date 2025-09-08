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
  private confirmationDialog: Phaser.GameObjects.Container | null = null
  public sceneReady: boolean = false

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
    console.log('🎬 HouseScene create() started for level', this.houseLevel)
    
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
    const spawnX = this.cameras.main.centerX
    const spawnY = this.cameras.main.centerY + 100
    
    this.player = this.add.rectangle(spawnX, spawnY, 32, 32, 0x00ff00)
    this.player.setDepth(1)
    
    // Debug logging for spawn position and screen size
    console.log('🎮 Player spawned at:', { x: spawnX, y: spawnY })
    console.log('📐 Camera dimensions:', { 
      width: this.cameras.main.width, 
      height: this.cameras.main.height,
      centerX: this.cameras.main.centerX,
      centerY: this.cameras.main.centerY
    })
    
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
      
      // Add debug key to show player position
      const debugKey = this.input.keyboard.addKey('P')
      debugKey.on('down', () => {
        console.log('🎮 DEBUG - Player position:', { x: this.player.x, y: this.player.y })
        console.log('🚪 DEBUG - Portal coords:', this.exitPortal.coords)
        console.log('📐 DEBUG - Screen size:', { 
          width: this.cameras.main.width, 
          height: this.cameras.main.height 
        })
      })
    }
    
    // Mark scene as ready
    this.sceneReady = true
    console.log('✅ HouseScene is ready!')
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
    if (this.exitPortal.coords.length === 0) return
    
    const playerPos = { x: this.player.x, y: this.player.y }
    const isInsidePortal = this.isPointInPolygon(playerPos, this.exitPortal.coords)
    
    // Debug logging every 3 seconds
    if (Math.floor(this.game.loop.frame) % 180 === 0) { 
      console.log('🔍 Portal check - Player:', playerPos, 'Inside portal:', isInsidePortal, 'Dialog showing:', this.confirmationShowing)
    }
    
    if (isInsidePortal && !this.confirmationShowing) {
      // Entering portal - show dialog
      this.exitPortal.isActive = true
      this.isNearPortal = true
      console.log('🚪 PORTAL TRIGGERED - Player entered portal area!')
      this.showConfirmationDialog()
    } else if (!isInsidePortal && this.confirmationShowing) {
      // Left portal while dialog is showing - close dialog
      console.log('🚪 Left portal area - closing dialog')
      this.closeConfirmationDialog()
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
    console.log('🚪 Showing exit confirmation dialog')
    
    // Create confirmation dialog container
    this.confirmationDialog = this.add.container(
      this.cameras.main.centerX,
      this.cameras.main.centerY
    )
    this.confirmationDialog.setDepth(2000)
    
    // Dialog background - make it interactive to block clicks behind
    const dialogBg = this.add.rectangle(0, 0, 400, 200, 0x000000, 0.95)
    dialogBg.setStrokeStyle(3, 0xff0000)
    dialogBg.setInteractive() // Block clicks behind dialog
    
    // Title
    const title = this.add.text(0, -60, 'EXIT HOUSE?', {
      fontSize: '24px',
      color: '#ff0000',
      fontFamily: 'monospace',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    
    // Message
    const message = this.add.text(0, -20, 'Return to the main game?', {
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
    
    const yesText = this.add.text(-80, 40, 'YES', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace'
    })
    yesText.setOrigin(0.5)
    yesText.setInteractive({ useHandCursor: true })
    
    // No button
    const noBtn = this.add.rectangle(80, 40, 120, 40, 0xff0000, 0.8)
    noBtn.setStrokeStyle(2, 0xff0000) 
    noBtn.setInteractive({ useHandCursor: true })
    
    const noText = this.add.text(80, 40, 'NO', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace'
    })
    noText.setOrigin(0.5)
    noText.setInteractive({ useHandCursor: true })
    
    this.confirmationDialog.add([dialogBg, title, message, yesBtn, yesText, noBtn, noText])
    
    // Handle button clicks
    const handleYes = () => {
      console.log('✅ User confirmed exit')
      this.closeConfirmationDialog()
      this.returnToMainGame()
    }
    
    const handleNo = () => {
      console.log('❌ User cancelled exit')
      this.closeConfirmationDialog()
    }
    
    // Add event handlers
    yesBtn.on('pointerdown', handleYes)
    yesText.on('pointerdown', handleYes)
    noBtn.on('pointerdown', handleNo)
    noText.on('pointerdown', handleNo)
    
    // Also add keyboard shortcuts
    if (this.input.keyboard) {
      const escKey = this.input.keyboard.addKey('ESC')
      escKey.once('down', handleNo)
      
      const enterKey = this.input.keyboard.addKey('ENTER')
      enterKey.once('down', handleYes)
    }
  }
  
  closeConfirmationDialog() {
    if (this.confirmationDialog) {
      this.confirmationDialog.destroy()
      this.confirmationDialog = null
    }
    this.confirmationShowing = false
    // Reset portal state so it can trigger again
    this.exitPortal.isActive = false
    this.isNearPortal = false
  }

  returnToMainGame() {
    console.log('🏠 Leaving house, returning to main game...')
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  update(time: number, delta: number) {
    if (!this.player) return
    // Allow movement even when dialog is showing
    
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
    this.player.x += deltaX
    this.player.y += deltaY
    
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
    console.log('🚪 Exit portal set with', coords.length, 'coordinates:', coords)
    
    // Draw portal area visualization
    if (this.portalGraphics) {
      this.portalGraphics.destroy()
    }
    
    // Portal area is now invisible - no visual indicators
    console.log('✅ Portal area configured (invisible) with coordinates:', coords)
  }
}