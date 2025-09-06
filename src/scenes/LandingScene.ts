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
  }
}