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
    
    // Load custom multiplayer sprites
    this.load.image('blue', '/assets/sprites/Multiplayer-sprites/blue.png')
    this.load.image('default', '/assets/sprites/Multiplayer-sprites/default.png')
    this.load.image('grey', '/assets/sprites/Multiplayer-sprites/grey.png')
    this.load.image('lime', '/assets/sprites/Multiplayer-sprites/lime.png')
    this.load.image('ping', '/assets/sprites/Multiplayer-sprites/ping.png')
    this.load.image('red', '/assets/sprites/Multiplayer-sprites/red.png')
  }

  create() {
    // Add the vaporwave background image directly
    const background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'vaporwave-background')
    background.setDisplaySize(this.cameras.main.width, this.cameras.main.height)
    background.setDepth(-1000)
    
    // Remove instruction text as requested by user
    // this.instructions = this.add.text(...)
    
    // Create visible player sprite
    this.player = this.add.sprite(this.cameras.main.centerX, this.cameras.main.centerY, 'default')
    this.player.setVisible(true) // Make player visible
    this.player.setDepth(100) // High depth to show above background
    this.player.setScale(0.13) // Small size like the green placeholder
    
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
    
    // Smooth movement with delta time scaling - 200px/second
    const baseSpeed = 200 // pixels per second
    const frameSpeed = (baseSpeed * delta) / 1000 // scale by frame time
    
    let moved = false
    
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.x -= frameSpeed
      moved = true
    }
    if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.x += frameSpeed
      moved = true
    }
    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      this.player.y -= frameSpeed
      moved = true
    }
    if (this.cursors.down.isDown || this.wasd.S.isDown) {
      this.player.y += frameSpeed
      moved = true
    }
    
    // Keep player within bounds
    this.player.x = Phaser.Math.Clamp(this.player.x, 32, this.cameras.main.width - 32)
    this.player.y = Phaser.Math.Clamp(this.player.y, 32, this.cameras.main.height - 32)
    
    // Update multiplayer position more frequently when moving
    if (moved && time - this.positionUpdateTimer > 50) { // Update every 50ms when moving
      this.updateMultiplayerPosition(this.player.x, this.player.y)
      this.lastPosition.x = this.player.x
      this.lastPosition.y = this.player.y
      this.positionUpdateTimer = time
    } else if (!moved && time - this.positionUpdateTimer > 1000) { // Update every second when not moving
      this.updateMultiplayerPosition(this.player.x, this.player.y)
      this.lastPosition.x = this.player.x
      this.lastPosition.y = this.player.y
      this.positionUpdateTimer = time
    }
  }
  
  private updateMultiplayerPosition(x: number, y: number) {
    // Send position to multiplayer manager
    if (typeof window !== 'undefined' && (window as any).multiplayerManager) {
      (window as any).multiplayerManager.updatePosition(x, y)
    }
  }
  
  shutdown() {
    console.log('🔍 DEBUG: LandingScene shutdown - cleaning up player sprite')
    // Properly destroy the player sprite to prevent duplicate sprites
    if (this.player) {
      this.player.destroy()
      this.player = null as any
    }
  }
}