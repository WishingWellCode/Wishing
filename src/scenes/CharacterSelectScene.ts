import Phaser from 'phaser'

export class CharacterSelectScene extends Phaser.Scene {
  private characters: any[] = []
  private selectedIndex: number = 0
  private characterSprites: Phaser.GameObjects.Sprite[] = []
  private nameText!: Phaser.GameObjects.Text
  private selectButton!: Phaser.GameObjects.Rectangle
  private selectButtonText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'CharacterSelectScene' })
  }

  preload() {
    this.load.json('hubConfig', '/hub-config.json')
  }

  create() {
    const hubConfig = this.cache.json.get('hubConfig')
    this.characters = hubConfig.characterSprites

    // Matrix background
    this.createMatrixBackground()
    
    // Title
    this.add.text(this.cameras.main.centerX, 50, 'SELECT YOUR AVATAR', {
      fontSize: '24px',
      fontFamily: 'Courier',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    // Character display area
    this.createCharacterDisplay()
    
    // Controls
    this.createControls()
    
    // Instructions
    this.add.text(this.cameras.main.centerX, this.cameras.main.height - 50, 
      '← → ARROW KEYS TO SELECT | ENTER TO CONFIRM', {
      fontSize: '12px',
      fontFamily: 'Courier',
      color: '#00ff00'
    }).setOrigin(0.5)
  }

  createMatrixBackground() {
    const graphics = this.add.graphics()
    
    // Dark background
    graphics.fillStyle(0x000000, 1)
    graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height)
    
    // Grid lines
    graphics.lineStyle(1, 0x00ff00, 0.2)
    const gridSize = 32
    
    for (let x = 0; x < this.cameras.main.width; x += gridSize) {
      graphics.beginPath()
      graphics.moveTo(x, 0)
      graphics.lineTo(x, this.cameras.main.height)
      graphics.strokePath()
    }
    
    for (let y = 0; y < this.cameras.main.height; y += gridSize) {
      graphics.beginPath()
      graphics.moveTo(0, y)
      graphics.lineTo(this.cameras.main.width, y)
      graphics.strokePath()
    }
  }

  createCharacterDisplay() {
    const centerX = this.cameras.main.centerX
    const centerY = this.cameras.main.centerY
    
    // Character preview area
    const previewBg = this.add.rectangle(centerX, centerY - 50, 200, 200, 0x000000, 0.8)
    previewBg.setStrokeStyle(2, 0x00ff00)
    
    // Display characters in a carousel
    this.characters.forEach((char, index) => {
      const x = centerX + (index - this.selectedIndex) * 150
      const sprite = this.add.sprite(x, centerY - 50, `${char.spritePrefix}_idle`)
      sprite.setScale(4)
      sprite.play(`${char.spritePrefix}-idle`)
      sprite.setAlpha(index === this.selectedIndex ? 1 : 0.3)
      sprite.setVisible(Math.abs(index - this.selectedIndex) <= 2)
      
      this.characterSprites.push(sprite)
    })
    
    // Character name
    this.nameText = this.add.text(centerX, centerY + 80, 
      this.characters[this.selectedIndex].name, {
      fontSize: '18px',
      fontFamily: 'Courier',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3
    })
    this.nameText.setOrigin(0.5)
    
    // Select button
    this.selectButton = this.add.rectangle(centerX, centerY + 150, 200, 50, 0x00ff00, 0.2)
    this.selectButton.setStrokeStyle(2, 0x00ff00)
    this.selectButton.setInteractive()
    
    this.selectButtonText = this.add.text(centerX, centerY + 150, 'ENTER WORLD', {
      fontSize: '16px',
      fontFamily: 'Courier',
      color: '#00ff00'
    })
    this.selectButtonText.setOrigin(0.5)
    
    // Button hover effect
    this.selectButton.on('pointerover', () => {
      this.selectButton.setFillStyle(0x00ff00, 0.4)
      this.selectButtonText.setScale(1.1)
    })
    
    this.selectButton.on('pointerout', () => {
      this.selectButton.setFillStyle(0x00ff00, 0.2)
      this.selectButtonText.setScale(1)
    })
    
    this.selectButton.on('pointerdown', () => {
      this.selectCharacter()
    })
  }

  createControls() {
    const cursors = this.input.keyboard?.createCursorKeys()
    
    if (cursors) {
      // Left arrow
      cursors.left.on('down', () => {
        this.selectedIndex = Math.max(0, this.selectedIndex - 1)
        this.updateCharacterDisplay()
      })
      
      // Right arrow
      cursors.right.on('down', () => {
        this.selectedIndex = Math.min(this.characters.length - 1, this.selectedIndex + 1)
        this.updateCharacterDisplay()
      })
      
      // Enter key
      this.input.keyboard?.addKey('ENTER').on('down', () => {
        this.selectCharacter()
      })
    }
  }

  updateCharacterDisplay() {
    const centerX = this.cameras.main.centerX
    
    // Update sprite positions and visibility
    this.characterSprites.forEach((sprite, index) => {
      const offset = index - this.selectedIndex
      const x = centerX + offset * 150
      
      this.tweens.add({
        targets: sprite,
        x: x,
        alpha: index === this.selectedIndex ? 1 : 0.3,
        duration: 300,
        ease: 'Power2'
      })
      
      sprite.setVisible(Math.abs(offset) <= 2)
    })
    
    // Update character name
    this.nameText.setText(this.characters[this.selectedIndex].name)
    
    // Glitch effect on change
    this.time.delayedCall(50, () => {
      this.nameText.setAlpha(0.5)
      this.time.delayedCall(50, () => {
        this.nameText.setAlpha(1)
      })
    })
  }

  selectCharacter() {
    const selected = this.characters[this.selectedIndex]
    
    // Flash effect
    this.cameras.main.flash(500, 0, 255, 0)
    
    // Store selection and start game
    this.time.delayedCall(500, () => {
      this.scene.start('HubWorldScene', { 
        selectedCharacter: selected.id 
      })
    })
  }
}