import Phaser from 'phaser'

export class LandingScene extends Phaser.Scene {
  private instructions!: Phaser.GameObjects.Text
  private player!: Phaser.GameObjects.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: any
  private lastPosition = { x: 0, y: 0 }
  private positionUpdateTimer = 0
  
  constructor() {
    super({ key: 'LandingScene' })
  }

  preload() {
    // Load the real vaporwave background
    this.load.image('vaporwave-background', '/assets/backgrounds/Realbackground.jpg')
    
    // Load player sprites for multiplayer
    this.load.image('sprite1', '/assets/sprites/sprite1.svg')
    this.load.image('sprite2', '/assets/sprites/sprite2.svg')
    this.load.image('sprite3', '/assets/sprites/sprite3.svg')
    this.load.image('sprite4', '/assets/sprites/sprite4.svg')
    this.load.image('sprite5', '/assets/sprites/sprite5.svg')
    this.load.image('sprite6', '/assets/sprites/sprite6.svg')
  }

  create() {
    // Set transparent background to show CSS background
    this.cameras.main.transparent = true
    
    // Add the vaporwave background image
    const background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'vaporwave-background')
    background.setDisplaySize(this.cameras.main.width, this.cameras.main.height)
    background.setDepth(-1000)
    
    // Add overlay text
    this.instructions = this.add.text(
      this.cameras.main.centerX, 
      100, 
      'Welcome to the $WISH Wishing Well\nConnect your Phantom wallet to enter the magical realm\n\nMove around with WASD keys and see other players!', {
      fontSize: '20px',
      fontFamily: '"Press Start 2P"',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 15 },
      align: 'center'
    })
    this.instructions.setOrigin(0.5)
    this.instructions.setDepth(1)
    this.instructions.setScrollFactor(0)
    
    // Create invisible player for position tracking (visible player shown via overlay)
    this.player = this.add.sprite(this.cameras.main.centerX, this.cameras.main.centerY, 'sprite1')
    this.player.setVisible(false) // Hide since we show it in overlay
    this.player.setDepth(0)
    
    // Set up controls
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = this.input.keyboard!.addKeys('W,S,A,D')
    
    // Camera setup
    this.cameras.main.setZoom(1)
    
    // Store initial position
    this.lastPosition.x = this.player.x
    this.lastPosition.y = this.player.y
  }
  
  update(time: number, delta: number) {
    if (!this.player) return
    
    const speed = 300
    const deltaSeconds = delta / 1000
    
    // Handle movement with better performance
    let velocityX = 0
    let velocityY = 0
    
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      velocityX = -speed
    }
    if (this.cursors.right.isDown || this.wasd.D.isDown) {
      velocityX = speed
    }
    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      velocityY = -speed
    }
    if (this.cursors.down.isDown || this.wasd.S.isDown) {
      velocityY = speed
    }
    
    // Apply movement
    const moving = velocityX !== 0 || velocityY !== 0
    if (moving) {
      this.player.x += velocityX * deltaSeconds
      this.player.y += velocityY * deltaSeconds
      
      // Keep player within bounds
      this.player.x = Phaser.Math.Clamp(this.player.x, 32, this.cameras.main.width - 32)
      this.player.y = Phaser.Math.Clamp(this.player.y, 32, this.cameras.main.height - 32)
    }
    
    // Throttle multiplayer position updates for performance
    if (time - this.positionUpdateTimer > 100) { // Update every 100ms max
      const dx = Math.abs(this.player.x - this.lastPosition.x)
      const dy = Math.abs(this.player.y - this.lastPosition.y)
      
      // Only update if moved significantly or been a while
      if (dx > 10 || dy > 10 || time - this.positionUpdateTimer > 2000) {
        this.updateMultiplayerPosition(this.player.x, this.player.y)
        this.lastPosition.x = this.player.x
        this.lastPosition.y = this.player.y
        this.positionUpdateTimer = time
      }
    }
  }
  
  private updateMultiplayerPosition(x: number, y: number) {
    // Send position to multiplayer manager
    if (typeof window !== 'undefined' && (window as any).multiplayerManager) {
      (window as any).multiplayerManager.updatePosition(x, y)
    }
  }
}