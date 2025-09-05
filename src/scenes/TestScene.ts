import Phaser from 'phaser'

export class TestScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: any
  private testPlayer!: Phaser.GameObjects.Rectangle
  private instructions!: Phaser.GameObjects.Text
  
  constructor() {
    super({ key: 'TestScene' })
  }

  preload() {
    // Only load the village background - no other assets needed
    this.load.image('village-background', '/assets/backgrounds/tempback.png')
  }

  create() {
    // Add village background - center it properly
    const villageBackground = this.add.image(
      this.cameras.main.centerX, 
      this.cameras.main.centerY, 
      'village-background'
    )
    villageBackground.setScale(1)
    villageBackground.setDepth(0)
    
    // Create a simple colored rectangle as test player
    this.testPlayer = this.add.rectangle(
      this.cameras.main.centerX, 
      this.cameras.main.centerY, 
      32, 32, 0x00ff00
    )
    this.testPlayer.setDepth(1)
    
    // Add instructions
    this.instructions = this.add.text(20, 20, 
      'TEST MODE - Village Background Loaded!\nUse WASD to move green square\nThis confirms the game engine is working', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 10 }
    })
    this.instructions.setDepth(2)
    this.instructions.setScrollFactor(0)
    
    // Setup controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
      this.wasd = this.input.keyboard.addKeys('W,A,S,D')
    }
    
    // Camera setup
    this.cameras.main.setZoom(1)
    this.cameras.main.setBackgroundColor(0x87CEEB) // Sky blue fallback
  }

  update() {
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
    
    // Keep player on screen - use camera dimensions
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    this.testPlayer.x = Phaser.Math.Clamp(this.testPlayer.x, 16, width - 16)
    this.testPlayer.y = Phaser.Math.Clamp(this.testPlayer.y, 16, height - 16)
  }
}