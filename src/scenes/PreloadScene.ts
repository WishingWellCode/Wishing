import Phaser from 'phaser'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    this.createLoadingScreen()
    
    // Load hub configuration first
    this.load.json('hubConfig', '/hub-config.json')
    
    // Temporary village background
    this.load.image('village-background', '/assets/backgrounds/temp_village.jpg')
    
    // Fountain
    this.load.image('fountain_base', '/assets/sprites/fountain_base.png')
    this.load.spritesheet('fountain_water', '/assets/sprites/fountain_water.png', {
      frameWidth: 96,
      frameHeight: 96
    })
    
    // Houses (4 variants)
    this.load.image('house_variant_1', '/assets/sprites/house_1.png')
    this.load.image('house_variant_2', '/assets/sprites/house_2.png')
    this.load.image('house_variant_3', '/assets/sprites/house_3.png')
    this.load.image('house_variant_4', '/assets/sprites/house_4.png')
    
    // Environment objects
    this.load.image('lamp_post', '/assets/sprites/lamp_post.png')
    this.load.image('bench', '/assets/sprites/bench.png')
    this.load.image('tree_variant_1', '/assets/sprites/tree_1.png')
    this.load.image('tree_variant_2', '/assets/sprites/tree_2.png')
    this.load.image('shrub', '/assets/sprites/shrub.png')
    
    // Load all 7 character sprites
    for (let i = 1; i <= 7; i++) {
      const prefix = `character_${i}`
      
      // Idle animation
      this.load.spritesheet(`${prefix}_idle`, `/assets/sprites/${prefix}_idle.png`, {
        frameWidth: 32,
        frameHeight: 32
      })
      
      // Walking animations
      this.load.spritesheet(`${prefix}_walk_down`, `/assets/sprites/${prefix}_walk_down.png`, {
        frameWidth: 32,
        frameHeight: 32
      })
      this.load.spritesheet(`${prefix}_walk_up`, `/assets/sprites/${prefix}_walk_up.png`, {
        frameWidth: 32,
        frameHeight: 32
      })
      this.load.spritesheet(`${prefix}_walk_left`, `/assets/sprites/${prefix}_walk_left.png`, {
        frameWidth: 32,
        frameHeight: 32
      })
      this.load.spritesheet(`${prefix}_walk_right`, `/assets/sprites/${prefix}_walk_right.png`, {
        frameWidth: 32,
        frameHeight: 32
      })
      
      // Coin throw animation (character specific)
      this.load.spritesheet(`${prefix}_throw`, `/assets/sprites/${prefix}_throw.png`, {
        frameWidth: 32,
        frameHeight: 32
      })
    }
    
    // Coin and effects
    this.load.spritesheet('coin-throw', '/assets/animations/coin_throw.png', {
      frameWidth: 16,
      frameHeight: 16
    })
    this.load.spritesheet('splash-effect', '/assets/animations/splash_effect.png', {
      frameWidth: 64,
      frameHeight: 64
    })
    
    // Win effects for different tiers
    this.load.spritesheet('win-effect-jackpot', '/assets/animations/win_jackpot.png', {
      frameWidth: 128,
      frameHeight: 128
    })
    this.load.spritesheet('win-effect-major', '/assets/animations/win_major.png', {
      frameWidth: 128,
      frameHeight: 128
    })
    this.load.spritesheet('win-effect-large', '/assets/animations/win_large.png', {
      frameWidth: 128,
      frameHeight: 128
    })
    this.load.spritesheet('win-effect-medium', '/assets/animations/win_medium.png', {
      frameWidth: 128,
      frameHeight: 128
    })
    this.load.spritesheet('win-effect-small', '/assets/animations/win_small.png', {
      frameWidth: 128,
      frameHeight: 128
    })
    
    // UI Elements
    this.load.image('ui-panel', '/assets/ui/panel.png')
    this.load.image('ui-button', '/assets/ui/button.png')
    this.load.image('ui-button-hover', '/assets/ui/button_hover.png')
    this.load.image('coin-icon', '/assets/ui/coin_icon.png')
    this.load.image('ui-frame-matrix', '/assets/ui/matrix_frame.png')
  }

  create() {
    this.createAnimations()
    // Start with character selection
    this.scene.start('CharacterSelectScene')
  }

  createLoadingScreen() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Matrix-style loading screen
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 1)
    bg.fillRect(0, 0, width, height)

    const progressBar = this.add.graphics()
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x003300, 0.8)
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50)
    progressBox.lineStyle(2, 0x00ff00, 1)
    progressBox.strokeRect(width / 2 - 160, height / 2 - 25, 320, 50)

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'INITIALIZING MATRIX...',
      style: {
        font: '16px Courier',
        color: '#00ff00'
      }
    })
    loadingText.setOrigin(0.5, 0.5)

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: '0%',
      style: {
        font: '14px Courier',
        color: '#00ff00'
      }
    })
    percentText.setOrigin(0.5, 0.5)

    this.load.on('progress', (value: number) => {
      percentText.setText(Math.floor(value * 100) + '%')
      progressBar.clear()
      progressBar.fillStyle(0x00ff00, 1)
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30)
    })

    this.load.on('complete', () => {
      progressBar.destroy()
      progressBox.destroy()
      loadingText.destroy()
      percentText.destroy()
      bg.destroy()
    })
  }

  createAnimations() {
    // Create animations for all 7 characters
    for (let i = 1; i <= 7; i++) {
      const prefix = `character_${i}`
      
      // Idle animation
      this.anims.create({
        key: `${prefix}-idle`,
        frames: this.anims.generateFrameNumbers(`${prefix}_idle`, { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
      })

      // Walking animations
      this.anims.create({
        key: `${prefix}-walk-down`,
        frames: this.anims.generateFrameNumbers(`${prefix}_walk_down`, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      })

      this.anims.create({
        key: `${prefix}-walk-up`,
        frames: this.anims.generateFrameNumbers(`${prefix}_walk_up`, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      })

      this.anims.create({
        key: `${prefix}-walk-left`,
        frames: this.anims.generateFrameNumbers(`${prefix}_walk_left`, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      })

      this.anims.create({
        key: `${prefix}-walk-right`,
        frames: this.anims.generateFrameNumbers(`${prefix}_walk_right`, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      })
      
      // Throw animation
      this.anims.create({
        key: `${prefix}-throw`,
        frames: this.anims.generateFrameNumbers(`${prefix}_throw`, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: 0
      })
    }

    // Fountain animation
    this.anims.create({
      key: 'fountain-flow',
      frames: this.anims.generateFrameNumbers('fountain_water', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    })

    // Coin animation
    this.anims.create({
      key: 'coin-flip',
      frames: this.anims.generateFrameNumbers('coin-throw', { start: 0, end: 7 }),
      frameRate: 12,
      repeat: 0
    })

    // Splash effect
    this.anims.create({
      key: 'splash',
      frames: this.anims.generateFrameNumbers('splash-effect', { start: 0, end: 7 }),
      frameRate: 16,
      repeat: 0
    })

    // Win effects for different tiers
    const winTiers = ['jackpot', 'major', 'large', 'medium', 'small']
    winTiers.forEach(tier => {
      this.anims.create({
        key: `win-${tier}`,
        frames: this.anims.generateFrameNumbers(`win-effect-${tier}`, { start: 0, end: 15 }),
        frameRate: 12,
        repeat: 0
      })
    })
  }
}