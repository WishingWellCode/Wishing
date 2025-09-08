import Phaser from 'phaser'

export class HouseScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: any
  private player!: Phaser.GameObjects.Rectangle
  private houseLevel: number = 1

  constructor() {
    super({ key: 'HouseScene' })
  }

  init(data: { houseLevel: number }) {
    this.houseLevel = data.houseLevel || 1
  }

  preload() {
    // Load tier backgrounds
    for (let i = 1; i <= 6; i++) {
      const textureName = `tier${i}-background`
      if (this.textures.exists(textureName)) {
        this.textures.remove(textureName)
      }
      this.load.image(textureName, `/assets/houses/tier${i}.png`)
    }
  }

  create() {
    // Clean up any existing background
    const existingBg = this.children.getByName('houseBackground') as Phaser.GameObjects.Image
    if (existingBg) {
      existingBg.destroy()
    }
    
    // Set transparent background to allow CSS background to show through
    this.cameras.main.transparent = true
    
    // Add the tier background image
    const backgroundTextureName = `tier${this.houseLevel}-background`
    const background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, backgroundTextureName)
    background.setName('houseBackground')
    background.setDepth(-1000)
    
    // Scale background to cover screen
    const texture = this.textures.get(backgroundTextureName)
    if (texture && texture.source && texture.source.length > 0) {
      const originalWidth = texture.source[0].width
      const originalHeight = texture.source[0].height
      
      const scaleX = this.cameras.main.width / originalWidth
      const scaleY = this.cameras.main.height / originalHeight
      const scale = Math.max(scaleX, scaleY)
      
      background.setScale(scale)
    }
    
    // Listen for resize events
    this.scale.on('resize', this.handleResize, this)
    
    // Create player character - green rectangle like in TestScene
    this.player = this.add.rectangle(
      this.cameras.main.centerX, 
      this.cameras.main.centerY + 100,
      32, 32, 0x00ff00
    )
    this.player.setDepth(1)
    
    // Setup controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
      this.wasd = this.input.keyboard.addKeys('W,A,S,D')
    }
    
    // Camera setup
    this.cameras.main.setZoom(1)
  }

  handleResize(gameSize: any) {
    // Update background position and scale on resize
    const background = this.children.getByName('houseBackground') as Phaser.GameObjects.Image
    if (background) {
      background.setPosition(gameSize.width / 2, gameSize.height / 2)
      
      const backgroundTextureName = `tier${this.houseLevel}-background`
      const texture = this.textures.get(backgroundTextureName)
      if (texture && texture.source && texture.source.length > 0) {
        const originalWidth = texture.source[0].width
        const originalHeight = texture.source[0].height
        
        const scaleX = gameSize.width / originalWidth
        const scaleY = gameSize.height / originalHeight
        const scale = Math.max(scaleX, scaleY)
        
        background.setScale(scale)
      }
    }
    
    // Update camera
    this.cameras.main.setSize(gameSize.width, gameSize.height)
  }

  update() {
    if (!this.player) return
    
    // Simple movement system matching TestScene
    const speed = 5
    
    // Arrow keys
    if (this.cursors) {
      if (this.cursors.left.isDown) {
        this.player.x -= speed
      } else if (this.cursors.right.isDown) {
        this.player.x += speed
      }
      
      if (this.cursors.up.isDown) {
        this.player.y -= speed
      } else if (this.cursors.down.isDown) {
        this.player.y += speed
      }
    }
    
    // WASD keys
    if (this.wasd) {
      if (this.wasd.A.isDown) {
        this.player.x -= speed
      } else if (this.wasd.D.isDown) {
        this.player.x += speed
      }
      
      if (this.wasd.W.isDown) {
        this.player.y -= speed
      } else if (this.wasd.S.isDown) {
        this.player.y += speed
      }
    }
    
    // Keep player on screen
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    this.player.x = Phaser.Math.Clamp(this.player.x, 16, width - 16)
    this.player.y = Phaser.Math.Clamp(this.player.y, 16, height - 16)
  }
}