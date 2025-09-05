import Phaser from 'phaser'

export class MatrixBackground {
  private scene: Phaser.Scene
  private graphics: Phaser.GameObjects.Graphics
  private gridLines: Phaser.GameObjects.Graphics
  private matrixRain: Phaser.GameObjects.Text[] = []
  private gridSize: number = 32
  private perspectiveY: number = 0.7

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.graphics = scene.add.graphics()
    this.gridLines = scene.add.graphics()
    this.createMatrixGrid()
    this.createMatrixRain()
  }

  createMatrixGrid() {
    const width = this.scene.cameras.main.width
    const height = this.scene.cameras.main.height
    
    // No solid background - let the village image show through
    
    // Very subtle grid lines 
    this.gridLines.lineStyle(1, 0x00ff00, 0.05)
    
    // Horizon line
    const horizon = height * this.perspectiveY
    
    // Vertical lines with perspective
    const centerX = width / 2
    const vanishingPoint = { x: centerX, y: horizon }
    
    for (let x = 0; x <= width; x += this.gridSize) {
      // Bottom to vanishing point
      this.gridLines.beginPath()
      this.gridLines.moveTo(x, height)
      
      // Calculate perspective convergence
      const distFromCenter = (x - centerX) / width
      const topX = centerX + (distFromCenter * width * 0.3)
      
      this.gridLines.lineTo(topX, vanishingPoint.y)
      this.gridLines.strokePath()
    }
    
    // Horizontal lines with perspective
    const maxDistance = 20
    for (let i = 0; i < maxDistance; i++) {
      const y = horizon + (Math.pow(i / maxDistance, 2) * (height - horizon))
      const alpha = 0.3 * (1 - i / maxDistance)
      
      this.gridLines.lineStyle(1, 0x00ff00, alpha)
      this.gridLines.beginPath()
      
      // Calculate perspective width
      const perspectiveFactor = (y - horizon) / (height - horizon)
      const lineWidth = width * (0.3 + 0.7 * perspectiveFactor)
      const startX = centerX - lineWidth / 2
      const endX = centerX + lineWidth / 2
      
      this.gridLines.moveTo(startX, y)
      this.gridLines.lineTo(endX, y)
      this.gridLines.strokePath()
    }
    
    // Add glow effect
    this.gridLines.setBlendMode(Phaser.BlendModes.ADD)
  }

  createMatrixRain() {
    const columns = Math.floor(this.scene.cameras.main.width / 20)
    
    for (let i = 0; i < columns; i++) {
      const x = i * 20 + 10
      const y = Phaser.Math.Between(-500, 0)
      const speed = Phaser.Math.Between(50, 150)
      
      const matrixChar = this.scene.add.text(x, y, this.getRandomMatrixChar(), {
        fontFamily: 'Courier',
        fontSize: '14px',
        color: '#00ff00'
      })
      
      matrixChar.setAlpha(Phaser.Math.FloatBetween(0.1, 0.5))
      matrixChar.setDepth(-1)
      
      this.matrixRain.push(matrixChar)
      
      // Animate falling
      this.scene.tweens.add({
        targets: matrixChar,
        y: this.scene.cameras.main.height + 20,
        duration: speed * 100,
        repeat: -1,
        onRepeat: () => {
          matrixChar.y = Phaser.Math.Between(-100, -20)
          matrixChar.setText(this.getRandomMatrixChar())
          matrixChar.setAlpha(Phaser.Math.FloatBetween(0.1, 0.5))
        }
      })
    }
  }

  getRandomMatrixChar(): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ'
    return chars[Math.floor(Math.random() * chars.length)]
  }

  update() {
    // Optional: Add pulsing or animation effects
  }
}