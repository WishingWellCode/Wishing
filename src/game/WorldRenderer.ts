import Phaser from 'phaser'

interface RemotePlayer {
  id: string
  sprite: Phaser.GameObjects.Sprite
  nameLabel: Phaser.GameObjects.Text
  username: string
}

export class WorldRenderer {
  private scene: Phaser.Scene
  private playersLayer: Phaser.GameObjects.Container
  private remotePlayersById: Map<string, RemotePlayer> = new Map()
  private localPlayer: Phaser.GameObjects.Sprite | null = null
  private localPlayerId: string | null = null
  public hasLocalPlayer: boolean = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    
    // Create layers for consistent rendering order
    this.playersLayer = scene.add.container(0, 0)
    this.playersLayer.setDepth(100) // Above background, below UI
  }

  // Add or update remote player
  public addRemotePlayer(id: string, data: {
    x: number
    y: number
    username?: string
    sprite?: string
  }) {
    if (this.remotePlayersById.has(id)) {
      this.updateRemotePlayer(id, data)
      return
    }

    // Create sprite for remote player
    const spriteName = data.sprite || 'default'
    const sprite = this.scene.add.sprite(data.x, data.y, spriteName)
    // Scale to match MultiplayerOverlay size (48px)
    sprite.setDisplaySize(48, 48)
    // Hide the Phaser sprite since MultiplayerOverlay handles visual rendering
    sprite.setVisible(false)
    
    // Create username label
    const username = data.username || id.slice(0, 5)
    const nameLabel = this.scene.add.text(data.x, data.y - 30, username, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    })
    nameLabel.setOrigin(0.5)
    // Hide the Phaser username label since MultiplayerOverlay handles visual rendering
    nameLabel.setVisible(false)
    
    // Add to container
    this.playersLayer.add([sprite, nameLabel])
    
    // Store reference
    this.remotePlayersById.set(id, {
      id,
      sprite,
      nameLabel,
      username
    })
    
    console.log(`Added remote player ${username} at (${data.x}, ${data.y})`)
  }

  // Update remote player position
  public updateRemotePlayer(id: string, data: {
    x: number
    y: number
    anim?: string
  }) {
    const player = this.remotePlayersById.get(id)
    if (!player) return
    
    // Smooth movement with tweens
    this.scene.tweens.add({
      targets: player.sprite,
      x: data.x,
      y: data.y,
      duration: 100,
      ease: 'Linear'
    })
    
    // Update label position
    this.scene.tweens.add({
      targets: player.nameLabel,
      x: data.x,
      y: data.y - 30,
      duration: 100,
      ease: 'Linear'
    })
  }

  // Remove remote player
  public removeRemotePlayer(id: string) {
    const player = this.remotePlayersById.get(id)
    if (!player) return
    
    player.sprite.destroy()
    player.nameLabel.destroy()
    this.remotePlayersById.delete(id)
    
    console.log(`Removed remote player ${player.username}`)
  }

  // Spawn local player (only for non-spectators)
  public spawnLocalPlayer(data: {
    id: string
    x: number
    y: number
    sprite?: string
  }) {
    if (this.hasLocalPlayer) return
    
    // Remove from remote players if exists
    if (this.remotePlayersById.has(data.id)) {
      this.removeRemotePlayer(data.id)
    }
    
    // Create local player sprite
    const spriteName = data.sprite || 'default'
    this.localPlayer = this.scene.add.sprite(data.x, data.y, spriteName)
    // Scale to match MultiplayerOverlay size (48px)
    this.localPlayer.setDisplaySize(48, 48)
    this.localPlayer.setDepth(150) // Above remote players
    
    this.localPlayerId = data.id
    this.hasLocalPlayer = true
    
    console.log(`Spawned local player at (${data.x}, ${data.y})`)
    
    return this.localPlayer
  }

  // Clear local player only
  public clearLocalPlayer() {
    if (this.localPlayer) {
      this.localPlayer.destroy()
      this.localPlayer = null
      this.localPlayerId = null
      this.hasLocalPlayer = false
      console.log('🧹 Local player cleared from WorldRenderer')
    }
  }
  
  // Clear all players
  public clearAllPlayers() {
    this.remotePlayersById.forEach(player => {
      player.sprite.destroy()
      player.nameLabel.destroy()
    })
    this.remotePlayersById.clear()
    
    if (this.localPlayer) {
      this.localPlayer.destroy()
      this.localPlayer = null
      this.localPlayerId = null
      this.hasLocalPlayer = false
    }
    
    console.log('🧹 All players cleared from WorldRenderer')
  }

  // Handle state snapshot from server
  public handleStateSnapshot(players: Array<{
    id: string
    x: number
    y: number
    username?: string
    sprite?: string
  }>) {
    // Clear existing remote players
    this.remotePlayersById.forEach(player => {
      player.sprite.destroy()
      player.nameLabel.destroy()
    })
    this.remotePlayersById.clear()
    
    // Add all players from snapshot
    players.forEach(playerData => {
      // Skip local player
      if (playerData.id === this.localPlayerId) return
      
      this.addRemotePlayer(playerData.id, playerData)
    })
    
    console.log(`Loaded ${players.length} players from snapshot`)
  }

  // Get player count
  public getPlayerCount(): number {
    return this.remotePlayersById.size + (this.hasLocalPlayer ? 1 : 0)
  }
  
  // Check if remote player exists
  public hasRemotePlayer(id: string): boolean {
    return this.remotePlayersById.has(id)
  }

  // Get local player sprite
  public getLocalPlayer(): Phaser.GameObjects.Sprite | null {
    return this.localPlayer
  }
}