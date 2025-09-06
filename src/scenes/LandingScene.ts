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
    // Add vaporwave background - center it properly and scale to fit
    const vaporwaveBackground = this.add.image(
      this.cameras.main.centerX, 
      this.cameras.main.centerY, 
      'vaporwave-background'
    )
    
    // Scale to cover the entire screen properly
    const scaleX = this.cameras.main.width / vaporwaveBackground.width
    const scaleY = this.cameras.main.height / vaporwaveBackground.height
    const scale = Math.max(scaleX, scaleY)
    vaporwaveBackground.setScale(scale)
    vaporwaveBackground.setDepth(0)
    
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