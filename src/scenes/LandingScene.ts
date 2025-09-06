import Phaser from 'phaser'

export class LandingScene extends Phaser.Scene {
  private instructions!: Phaser.GameObjects.Text
  
  constructor() {
    super({ key: 'LandingScene' })
  }

  preload() {
    // Load the real vaporwave background
    this.load.image('vaporwave-background', '/assets/backgrounds/Realbackground.jpg')
  }

  create() {
    // No background needed - CSS handles it now
    // Removed Phaser background to prevent conflicts
    
    // Add overlay text
    this.instructions = this.add.text(
      this.cameras.main.centerX, 
      100, 
      'Welcome to the $WISH Wishing Well\nConnect your Phantom wallet to enter the magical realm', {
      fontSize: '24px',
      fontFamily: '"Press Start 2P"',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 15 },
      align: 'center'
    })
    this.instructions.setOrigin(0.5)
    this.instructions.setDepth(1)
    this.instructions.setScrollFactor(0)
    
    // Camera setup
    this.cameras.main.setZoom(1)
    this.cameras.main.setBackgroundColor(0x87CEEB) // Sky blue fallback
  }
}