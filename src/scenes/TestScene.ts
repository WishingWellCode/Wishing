import Phaser from 'phaser'

export class TestScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: any
  private testPlayer!: Phaser.GameObjects.Rectangle
  private instructions!: Phaser.GameObjects.Text
  private fountainArea!: Phaser.GameObjects.Circle
  private isNearFountain: boolean = false
  private gamblingUI!: Phaser.GameObjects.Container
  
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
    
    // Create fountain interaction area (invisible)
    this.fountainArea = this.add.circle(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 50, // Fountain is slightly above center
      120, // 120px radius for interaction
      0xff0000,
      0 // Invisible
    )
    this.fountainArea.setDepth(0)

    // Create a simple colored rectangle as test player
    this.testPlayer = this.add.rectangle(
      this.cameras.main.centerX, 
      this.cameras.main.centerY + 100, // Start below fountain
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
    
    // Create gambling UI (initially hidden)
    this.createGamblingUI()
    
    // Setup controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
      this.wasd = this.input.keyboard.addKeys('W,A,S,D')
    }
    
    // Camera setup
    this.cameras.main.setZoom(1)
    this.cameras.main.setBackgroundColor(0x87CEEB) // Sky blue fallback
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
      fontFamily: '"Press Start 2P"',
      color: '#ffd700'
    })
    title.setOrigin(0.5)
    
    // Gamble button
    const gambButton = this.add.rectangle(0, 15, 200, 30, 0x4ade80)
    gambButton.setStrokeStyle(2, 0xffffff)
    gambButton.setInteractive()
    
    const gambText = this.add.text(0, 15, 'Throw 1,000 $WISH', {
      fontSize: '12px',
      fontFamily: '"Press Start 2P"',
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

  async startGambling() {
    console.log('🎲 Starting gambling session...')
    
    // Disable button
    const button = this.gamblingUI.list[2] as Phaser.GameObjects.Rectangle
    const text = this.gamblingUI.list[3] as Phaser.GameObjects.Text
    
    button.setFillStyle(0x6b7280) // Gray out
    text.setText('Processing...')
    button.disableInteractive()
    
    // TODO: Implement actual gambling logic
    // For now, just simulate a result after 2 seconds
    this.time.delayedCall(2000, () => {
      const outcomes = [
        { tier: 'Lose', multiplier: 0, message: 'Better luck next time!' },
        { tier: 'Break Even', multiplier: 1, message: 'Your coins return!' },
        { tier: 'Small Win', multiplier: 1.1, message: 'Small fortune!' },
        { tier: 'JACKPOT', multiplier: 15000, message: '🌟 LEGENDARY JACKPOT! 🌟' }
      ]
      
      const result = Phaser.Math.RND.pick(outcomes)
      this.showGamblingResult(result)
      
      // Re-enable button
      button.setFillStyle(0x4ade80)
      text.setText('Throw 1,000 $WISH')
      button.setInteractive()
    })
  }

  showGamblingResult(result: any) {
    // Create result popup
    const resultPopup = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY)
    resultPopup.setScrollFactor(0)
    resultPopup.setDepth(20)
    
    // Background
    const bg = this.add.rectangle(0, 0, 500, 200, 0x000000, 0.9)
    bg.setStrokeStyle(4, result.tier === 'JACKPOT' ? 0xffd700 : 0xffffff)
    
    // Result text
    const tierColor = result.tier === 'Lose' ? '#ff4444' : 
                     result.tier === 'JACKPOT' ? '#ffd700' : '#44ff44'
    
    const tierText = this.add.text(0, -40, result.tier.toUpperCase(), {
      fontSize: '24px',
      fontFamily: '"Press Start 2P"',
      color: tierColor
    })
    tierText.setOrigin(0.5)
    
    const messageText = this.add.text(0, -5, result.message, {
      fontSize: '14px',
      fontFamily: '"Press Start 2P"',
      color: '#ffffff'
    })
    messageText.setOrigin(0.5)
    
    const payoutText = this.add.text(0, 25, 
      result.multiplier > 0 ? `Won: ${Math.floor(1000 * result.multiplier)} $WISH` : 'Lost: 1,000 $WISH', {
      fontSize: '16px',
      fontFamily: '"Press Start 2P"',
      color: tierColor
    })
    payoutText.setOrigin(0.5)
    
    // Close button
    const closeBtn = this.add.rectangle(0, 65, 100, 30, 0x6b7280)
    closeBtn.setStrokeStyle(2, 0xffffff)
    closeBtn.setInteractive()
    
    const closeTxt = this.add.text(0, 65, 'Close', {
      fontSize: '12px',
      fontFamily: '"Press Start 2P"',
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
    
    // Check fountain proximity
    const distance = Phaser.Math.Distance.Between(
      this.testPlayer.x, this.testPlayer.y,
      this.fountainArea.x, this.fountainArea.y
    )
    
    const wasNearFountain = this.isNearFountain
    this.isNearFountain = distance < 120 // Within fountain radius
    
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
  }
}