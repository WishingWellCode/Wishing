import Phaser from 'phaser'
import { WorldRenderer } from '../game/WorldRenderer'

export class LandingScene extends Phaser.Scene {
  private instructions!: Phaser.GameObjects.Text
  private player!: Phaser.GameObjects.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: any
  private lastPosition = { x: 0, y: 0 }
  private positionUpdateTimer = 0
  private isWalletConnected = false
  private worldRenderer!: WorldRenderer
  
  constructor() {
    super({ key: 'LandingScene' })
  }

  preload() {
    // Load the real vaporwave background
    this.load.image('vaporwave-background', '/assets/backgrounds/Realbackground.jpg')
    
    // Load custom multiplayer sprites
    this.load.image('blue', '/assets/sprites/Multiplayer-sprites/blue.png')
    this.load.image('default', '/assets/sprites/Multiplayer-sprites/default.png')
    this.load.image('grey', '/assets/sprites/Multiplayer-sprites/grey.png')
    this.load.image('lime', '/assets/sprites/Multiplayer-sprites/lime.png')
    this.load.image('ping', '/assets/sprites/Multiplayer-sprites/ping.png')
    this.load.image('red', '/assets/sprites/Multiplayer-sprites/red.png')
  }

  create() {
    // Add the vaporwave background image directly
    const background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'vaporwave-background')
    background.setDisplaySize(this.cameras.main.width, this.cameras.main.height)
    background.setDepth(-1000)
    
    // Remove instruction text as requested by user
    // this.instructions = this.add.text(...)
    
    // NEVER auto-create player sprite - only create when explicitly told to via setWalletConnection
    console.log('🔍 DEBUG: LandingScene created - NO player sprite auto-created')
    
    // Set up controls (but they won't work without a player sprite)
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = this.input.keyboard!.addKeys('W,S,A,D')
    
    // Camera setup
    this.cameras.main.setZoom(1)
    
    // Initialize WorldRenderer for consistent multiplayer rendering
    this.worldRenderer = new WorldRenderer(this)
    console.log('🌍 WorldRenderer initialized in LandingScene')
  }
  
  private createPlayer() {
    if (this.player) return // Don't create if already exists
    
    const spawnX = this.cameras.main.centerX
    const spawnY = this.cameras.main.centerY
    
    // Create local player through WorldRenderer for consistency
    const localPlayer = this.worldRenderer.spawnLocalPlayer({
      id: 'local-player',
      x: spawnX,
      y: spawnY,
      sprite: 'default'
    })
    
    if (localPlayer) {
      this.player = localPlayer
      // WorldRenderer already sets the correct scale (2)
      
      // Store initial position
      this.lastPosition.x = this.player.x
      this.lastPosition.y = this.player.y
    }
  }
  
  public setWalletConnection(connected: boolean) {
    this.isWalletConnected = connected
    if (connected && !this.player) {
      this.createPlayer()
    } else if (!connected && this.player) {
      this.player.destroy()
      this.player = null as any
      // Clear local player from WorldRenderer
      this.worldRenderer.clearLocalPlayer()
    }
  }
  
  update(time: number, delta: number) {
    if (!this.player) return
    
    // Smooth movement with delta time scaling - 200px/second
    const baseSpeed = 200 // pixels per second
    const frameSpeed = (baseSpeed * delta) / 1000 // scale by frame time
    
    let moved = false
    
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.x -= frameSpeed
      moved = true
    }
    if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.x += frameSpeed
      moved = true
    }
    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      this.player.y -= frameSpeed
      moved = true
    }
    if (this.cursors.down.isDown || this.wasd.S.isDown) {
      this.player.y += frameSpeed
      moved = true
    }
    
    // Keep player within bounds
    this.player.x = Phaser.Math.Clamp(this.player.x, 32, this.cameras.main.width - 32)
    this.player.y = Phaser.Math.Clamp(this.player.y, 32, this.cameras.main.height - 32)
    
    // Update multiplayer position more frequently when moving
    if (moved && time - this.positionUpdateTimer > 50) { // Update every 50ms when moving
      this.updateMultiplayerPosition(this.player.x, this.player.y)
      this.lastPosition.x = this.player.x
      this.lastPosition.y = this.player.y
      this.positionUpdateTimer = time
    } else if (!moved && time - this.positionUpdateTimer > 1000) { // Update every second when not moving
      this.updateMultiplayerPosition(this.player.x, this.player.y)
      this.lastPosition.x = this.player.x
      this.lastPosition.y = this.player.y
      this.positionUpdateTimer = time
    }
  }
  
  private updateMultiplayerPosition(x: number, y: number) {
    // Send position to multiplayer manager
    if (typeof window !== 'undefined' && (window as any).multiplayerManager) {
      (window as any).multiplayerManager.updatePosition(x, y)
    }
  }
  
  // Handle multiplayer messages from remote players
  public handleMultiplayerMessage(data: any) {
    switch (data.type) {
      case 'playerMoved':
        if (data.player && data.player.id !== 'local-player') {
          this.worldRenderer.updateRemotePlayer(data.player.id, {
            x: data.player.x,
            y: data.player.y,
            anim: data.player.anim
          })
        }
        break
        
      case 'playerJoined':
        if (data.player && data.player.id !== 'local-player') {
          this.worldRenderer.addRemotePlayer(data.player.id, {
            x: data.player.x,
            y: data.player.y,
            username: data.player.username,
            sprite: data.player.sprite
          })
        }
        break
        
      case 'playerLeft':
        if (data.playerId !== 'local-player') {
          this.worldRenderer.removeRemotePlayer(data.playerId)
        }
        break
        
      case 'stateSnapshot':
        if (data.players) {
          this.worldRenderer.handleStateSnapshot(data.players)
        }
        break
    }
  }
  
  // Get player count for UI
  public getPlayerCount(): number {
    return this.worldRenderer.getPlayerCount()
  }
  
  shutdown() {
    console.log('🔍 DEBUG: LandingScene shutdown - cleaning up player sprite')
    // Clear all players through WorldRenderer
    this.worldRenderer.clearAllPlayers()
    
    // Clear local references
    if (this.player) {
      this.player = null as any
    }
  }
}