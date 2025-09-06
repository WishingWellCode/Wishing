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
    // FORCE transparent background - multiple methods
    this.cameras.main.setBackgroundColor(0x000000)
    this.cameras.main.transparent = true
    
    // Add a completely transparent rectangle to cover any blue background
    const bg = this.add.rectangle(0, 0, this.cameras.main.width * 2, this.cameras.main.height * 2, 0x000000, 0)
    bg.setOrigin(0, 0)
    bg.setDepth(-1000)
    
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
    this.cameras.main.setBackgroundColor(0x000000) // Transparent black
  }
}