import Phaser from 'phaser'
import { MatrixBackground } from './MatrixBackground'

interface HubConfig {
  world: {
    width: number
    height: number
    gridSize: number
    layers: Record<string, number>
  }
  fixedEntities: {
    fountain: any
    houses: any[]
    lamps: any[]
    benches: any[]
    decorations: any[]
  }
  spawnPoints: Array<{x: number, y: number}>
  characterSprites: any[]
}

interface Player extends Phaser.Physics.Arcade.Sprite {
  playerId: string
  walletAddress: string
  characterType: string
}

export class HubWorldScene extends Phaser.Scene {
  private hubConfig!: HubConfig
  private matrixBg!: MatrixBackground
  private layers: Map<string, Phaser.GameObjects.Container> = new Map()
  private player!: Player
  private otherPlayers: Map<string, Player> = new Map()
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: any
  private fountain!: Phaser.Physics.Arcade.Sprite
  private interactKey!: Phaser.Input.Keyboard.Key
  private gameContext: any
  private lastPosition = { x: 0, y: 0 }
  private isNearFountain = false
  private interactPrompt!: Phaser.GameObjects.Text
  private selectedCharacter: string = 'character_1'

  constructor() {
    super({ key: 'HubWorldScene' })
  }

  init(data: any) {
    this.selectedCharacter = data.selectedCharacter || 'character_1'
  }

  preload() {
    // Load hub configuration
    this.load.json('hubConfig', '/hub-config.json')
  }

  create() {
    this.hubConfig = this.cache.json.get('hubConfig')
    this.gameContext = this.registry.get('gameContext')
    
    // Create layered world
    this.createLayers()
    this.createMatrixBackground()
    this.loadFixedEntities()
    this.createPlayer()
    this.createControls()
    this.createUI()
    
    // Setup collisions with fountain
    if (this.fountain) {
      this.physics.add.collider(this.player, this.fountain)
    }
  }

  createLayers() {
    // Create containers for each layer in correct order
    const layerOrder = Object.entries(this.hubConfig.world.layers)
      .sort((a, b) => a[1] - b[1])
    
    layerOrder.forEach(([name, depth]) => {
      const container = this.add.container(0, 0)
      container.setDepth(depth)
      this.layers.set(name, container)
    })
  }

  createMatrixBackground() {
    // Use the temporary village background image
    const bgLayer = this.layers.get('background')
    if (bgLayer) {
      const villageBackground = this.add.image(640, 480, 'village-background')
      villageBackground.setScale(1.2) // Scale to fit screen
      bgLayer.add(villageBackground)
    }
    
    // Still create matrix background for effects (but make it subtle)
    this.matrixBg = new MatrixBackground(this)
  }

  loadFixedEntities() {
    const entities = this.hubConfig.fixedEntities
    
    // Load fountain
    this.loadFountain(entities.fountain)
    
    // Load houses
    entities.houses.forEach(house => this.loadEntity(house))
    
    // Load lamps
    entities.lamps.forEach(lamp => this.loadEntity(lamp))
    
    // Load benches  
    entities.benches.forEach(bench => this.loadEntity(bench))
    
    // Load decorations
    entities.decorations.forEach(deco => this.loadEntity(deco))
  }

  loadFountain(fountainConfig: any) {
    const layer = this.layers.get(fountainConfig.layer)
    if (!layer) return
    
    // Create fountain base
    this.fountain = this.physics.add.sprite(
      fountainConfig.position.x,
      fountainConfig.position.y,
      fountainConfig.sprite
    )
    this.fountain.setScale(fountainConfig.scale)
    this.fountain.setImmovable(true)
    
    if (fountainConfig.collision) {
      this.fountain.body?.setSize(96, 96)
    }
    
    layer.add(this.fountain)
    
    // Add animated water if specified
    if (fountainConfig.animatedSprite) {
      const water = this.add.sprite(
        fountainConfig.position.x,
        fountainConfig.position.y - 20,
        fountainConfig.animatedSprite
      )
      water.setScale(fountainConfig.scale)
      water.play('fountain-flow')
      layer.add(water)
    }
  }

  loadEntity(entityConfig: any) {
    const layer = this.layers.get(entityConfig.layer)
    if (!layer) return
    
    const entity = this.add.image(
      entityConfig.position.x,
      entityConfig.position.y,
      entityConfig.sprite
    )
    
    entity.setScale(entityConfig.scale || 1)
    
    if (entityConfig.flipX) {
      entity.setFlipX(true)
    }
    
    if (entityConfig.glowEffect) {
      // Add glow shader or tint
      entity.setTint(0x00ff00)
      entity.setBlendMode(Phaser.BlendModes.ADD)
      entity.setAlpha(0.8)
      
      // Pulsing glow animation
      this.tweens.add({
        targets: entity,
        alpha: 0.4,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }
    
    layer.add(entity)
  }

  createPlayer() {
    // Get random spawn point
    const spawnPoint = Phaser.Math.RND.pick(this.hubConfig.spawnPoints)
    
    // Find character config
    const charConfig = this.hubConfig.characterSprites.find(
      c => c.id === this.selectedCharacter
    )
    
    const spritePrefix = charConfig?.spritePrefix || 'character_1'
    
    // Create player with selected character sprite
    this.player = this.physics.add.sprite(
      spawnPoint.x,
      spawnPoint.y,
      `${spritePrefix}_idle`
    ) as Player
    
    this.player.setScale(2)
    this.player.play(`${spritePrefix}-idle`)
    this.player.setCollideWorldBounds(true)
    this.player.body?.setSize(16, 16)
    this.player.characterType = this.selectedCharacter
    
    // Add to character layer
    const charLayer = this.layers.get('characters')
    if (charLayer) {
      charLayer.add(this.player)
    }
    
    // Camera setup
    this.cameras.main.startFollow(this.player)
    this.cameras.main.setZoom(1.2)
    this.cameras.main.setBackgroundColor(0x000000)
  }

  createControls() {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
      this.wasd = this.input.keyboard.addKeys('W,A,S,D')
      this.interactKey = this.input.keyboard.addKey('E')
      
      this.interactKey.on('down', () => {
        if (this.isNearFountain) {
          this.interactWithFountain()
        }
      })
    }
  }

  createUI() {
    const uiLayer = this.layers.get('ui')
    
    // Interaction prompt
    this.interactPrompt = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 120,
      'Press [E] to throw 1000 $WISH',
      {
        fontSize: '14px',
        fontFamily: 'Courier',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 4,
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
      }
    )
    this.interactPrompt.setOrigin(0.5)
    this.interactPrompt.setVisible(false)
    this.interactPrompt.setScrollFactor(0)
    this.interactPrompt.setDepth(1000)
    
    // Matrix-style HUD
    this.createMatrixHUD()
  }

  createMatrixHUD() {
    // Pool display with Matrix styling
    const poolBg = this.add.rectangle(10, 10, 250, 40, 0x000000, 0.8)
    poolBg.setOrigin(0, 0)
    poolBg.setScrollFactor(0)
    poolBg.setDepth(999)
    
    const poolBorder = this.add.rectangle(10, 10, 250, 40)
    poolBorder.setOrigin(0, 0)
    poolBorder.setStrokeStyle(2, 0x00ff00)
    poolBorder.setScrollFactor(0)
    poolBorder.setDepth(1000)
    
    const poolText = this.add.text(20, 30, 'POOL: 0 $WISH', {
      fontSize: '14px',
      fontFamily: 'Courier',
      color: '#00ff00'
    })
    poolText.setOrigin(0, 0.5)
    poolText.setScrollFactor(0)
    poolText.setDepth(1001)
    
    // Update pool display
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.gameContext?.gameState?.fountainPool) {
          poolText.setText(`POOL: ${this.gameContext.gameState.fountainPool} $WISH`)
        }
      },
      loop: true
    })
    
    // Character info
    const charConfig = this.hubConfig.characterSprites.find(
      c => c.id === this.selectedCharacter
    )
    
    const charInfo = this.add.text(20, 60, `[${charConfig?.name || 'Unknown'}]`, {
      fontSize: '12px',
      fontFamily: 'Courier',
      color: '#00ff00'
    })
    charInfo.setScrollFactor(0)
    charInfo.setDepth(1001)
  }

  update() {
    if (!this.player) return
    
    // Handle movement
    const speed = 160
    let velocityX = 0
    let velocityY = 0
    let isMoving = false
    
    const spritePrefix = this.hubConfig.characterSprites.find(
      c => c.id === this.selectedCharacter
    )?.spritePrefix || 'character_1'
    
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      velocityX = -speed
      this.player.play(`${spritePrefix}-walk-left`, true)
      isMoving = true
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      velocityX = speed
      this.player.play(`${spritePrefix}-walk-right`, true)
      isMoving = true
    }
    
    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      velocityY = -speed
      if (!isMoving) this.player.play(`${spritePrefix}-walk-up`, true)
      isMoving = true
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      velocityY = speed
      if (!isMoving) this.player.play(`${spritePrefix}-walk-down`, true)
      isMoving = true
    }
    
    if (!isMoving) {
      this.player.play(`${spritePrefix}-idle`, true)
    }
    
    this.player.setVelocity(velocityX, velocityY)
    
    // Check fountain proximity
    if (this.fountain) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.fountain.x, this.fountain.y
      )
      
      const interactionRadius = this.hubConfig.fixedEntities.fountain.interactionRadius || 100
      this.isNearFountain = distance < interactionRadius
      this.interactPrompt.setVisible(this.isNearFountain)
    }
    
    // Update position to server
    if (Math.abs(this.player.x - this.lastPosition.x) > 5 || 
        Math.abs(this.player.y - this.lastPosition.y) > 5) {
      this.lastPosition = { x: this.player.x, y: this.player.y }
      this.gameContext?.updatePlayerPosition(this.player.x, this.player.y)
    }
    
    // Update other players
    this.updateOtherPlayers()
    
    // Update Matrix background
    this.matrixBg?.update()
  }

  updateOtherPlayers() {
    if (!this.gameContext?.gameState?.players) return
    
    const charLayer = this.layers.get('characters')
    if (!charLayer) return
    
    this.gameContext.gameState.players.forEach((playerData: any, playerId: string) => {
      if (playerData.walletAddress === this.gameContext.gameState.currentPlayer?.walletAddress) {
        return
      }
      
      if (!this.otherPlayers.has(playerId)) {
        // Create new player
        const charType = playerData.characterType || 'character_1'
        const charConfig = this.hubConfig.characterSprites.find(c => c.id === charType)
        const spritePrefix = charConfig?.spritePrefix || 'character_1'
        
        const otherPlayer = this.physics.add.sprite(
          playerData.x,
          playerData.y,
          `${spritePrefix}_idle`
        ) as Player
        
        otherPlayer.setScale(2)
        otherPlayer.playerId = playerId
        otherPlayer.walletAddress = playerData.walletAddress
        otherPlayer.characterType = charType
        
        charLayer.add(otherPlayer)
        this.otherPlayers.set(playerId, otherPlayer)
      } else {
        // Update existing player position
        const otherPlayer = this.otherPlayers.get(playerId)!
        otherPlayer.x = playerData.x
        otherPlayer.y = playerData.y
      }
    })
  }

  async interactWithFountain() {
    try {
      const effectsLayer = this.layers.get('effects')
      if (!effectsLayer) return
      
      // Disable interaction
      this.interactPrompt.setText('EXECUTING TRANSACTION...')
      this.interactPrompt.setColor('#ffff00')
      
      // Play coin throw animation
      const coin = this.add.sprite(this.player.x, this.player.y - 20, 'coin-throw')
      coin.setScale(2)
      coin.play('coin-flip')
      effectsLayer.add(coin)
      
      // Animate coin to fountain
      this.tweens.add({
        targets: coin,
        x: this.fountain.x,
        y: this.fountain.y,
        duration: 600,
        ease: 'Quad.easeIn',
        onComplete: () => {
          coin.destroy()
          
          // Splash effect
          const splash = this.add.sprite(this.fountain.x, this.fountain.y, 'splash-effect')
          splash.setScale(2)
          splash.play('splash')
          splash.on('animationcomplete', () => splash.destroy())
          effectsLayer.add(splash)
        }
      })
      
      // Call gambling function
      const result = await this.gameContext.throwCoins(1000)
      
      if (result.won && result.amount > 0) {
        this.showWinEffect(result.amount, result.tier)
      } else {
        this.showLoseEffect()
      }
      
      // Re-enable interaction
      setTimeout(() => {
        this.interactPrompt.setText('Press [E] to throw 1000 $WISH')
        this.interactPrompt.setColor('#00ff00')
      }, 2000)
      
    } catch (error) {
      console.error('Error:', error)
      this.interactPrompt.setText('ERROR! TRY AGAIN...')
      this.interactPrompt.setColor('#ff0000')
      setTimeout(() => {
        this.interactPrompt.setText('Press [E] to throw 1000 $WISH')
        this.interactPrompt.setColor('#00ff00')
      }, 2000)
    }
  }

  showWinEffect(amount: number, tier: string) {
    const effectsLayer = this.layers.get('effects')
    if (!effectsLayer) return
    
    // Matrix-style win effect
    const winColors = {
      jackpot: 0xffd700,
      major: 0xff00ff,
      large: 0x00ffff,
      medium: 0x00ff00,
      small: 0xffffff
    }
    
    const color = winColors[tier as keyof typeof winColors] || 0x00ff00
    
    // Create digital explosion effect
    for (let i = 0; i < 20; i++) {
      const particle = this.add.text(
        this.fountain.x + Phaser.Math.Between(-50, 50),
        this.fountain.y + Phaser.Math.Between(-50, 50),
        this.getRandomMatrixChar(),
        {
          fontSize: '20px',
          fontFamily: 'Courier',
          color: `#${color.toString(16).padStart(6, '0')}`
        }
      )
      
      effectsLayer.add(particle)
      
      this.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-100, 100),
        y: particle.y - Phaser.Math.Between(50, 150),
        alpha: 0,
        scale: 2,
        duration: 1500,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      })
    }
    
    // Win text
    const winText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 100,
      `+${amount} $WISH`,
      {
        fontSize: '28px',
        fontFamily: 'Courier',
        color: `#${color.toString(16).padStart(6, '0')}`,
        stroke: '#000000',
        strokeThickness: 6
      }
    )
    winText.setOrigin(0.5)
    winText.setScrollFactor(0)
    winText.setDepth(1002)
    
    this.tweens.add({
      targets: winText,
      y: winText.y - 50,
      alpha: 0,
      scale: 1.5,
      duration: 3000,
      ease: 'Power2',
      onComplete: () => winText.destroy()
    })
  }

  showLoseEffect() {
    // Matrix-style lose effect
    const loseText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 100,
      'ACCESS DENIED',
      {
        fontSize: '18px',
        fontFamily: 'Courier',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 4
      }
    )
    loseText.setOrigin(0.5)
    loseText.setScrollFactor(0)
    loseText.setDepth(1002)
    
    // Glitch effect
    const glitchTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        loseText.setX(this.cameras.main.centerX + Phaser.Math.Between(-2, 2))
        loseText.setAlpha(Phaser.Math.FloatBetween(0.5, 1))
      },
      repeat: 10
    })
    
    this.tweens.add({
      targets: loseText,
      alpha: 0,
      duration: 2000,
      delay: 1000,
      ease: 'Power2',
      onComplete: () => {
        glitchTimer.destroy()
        loseText.destroy()
      }
    })
  }

  getRandomMatrixChar(): string {
    const chars = '0123456789ABCDEF'
    return chars[Math.floor(Math.random() * chars.length)]
  }
}