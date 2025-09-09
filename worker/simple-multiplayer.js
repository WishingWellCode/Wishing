// Simple WebSocket storage
const sessions = new Map()

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // Handle WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket" && url.pathname === "/ws") {
      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair)
      
      // Handle WebSocket session
      server.accept()
      const playerId = crypto.randomUUID()
      console.log(`🎮 New player connected: ${playerId}`)
      
      sessions.set(playerId, {
        websocket: server,
        playerData: null,
        lastSeen: Date.now()
      })
      
      server.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log(`🎮 Message from ${playerId}:`, message.type)
          
          if (message.type === 'join') {
            const walletAddress = message.walletAddress
            const username = walletAddress.length >= 5 ? 
              walletAddress.substring(0, 3) + walletAddress.slice(-2) : 
              walletAddress
            
            const sprites = ['blue', 'default', 'grey', 'lime', 'ping', 'red']
            const sprite = sprites[Math.floor(Math.random() * sprites.length)]
            
            const playerData = {
              id: playerId,
              walletAddress,
              username,
              x: Math.random() * 700 + 100,
              y: Math.random() * 500 + 100,
              sprite
            }
            
            const session = sessions.get(playerId)
            if (session) {
              session.playerData = playerData
            }
            
            // Get all players
            const allPlayers = Array.from(sessions.values())
              .filter(s => s.playerData)
              .map(s => s.playerData)
            
            // Send joined confirmation
            server.send(JSON.stringify({
              type: 'joined',
              playerId,
              player: playerData,
              allPlayers
            }))
            
            // Broadcast to others
            broadcast({
              type: 'playerJoined', 
              player: playerData
            }, playerId)
            
            console.log(`🎮 Player ${username} joined with ${sprite}`)
          } 
          else if (message.type === 'move') {
            const session = sessions.get(playerId)
            if (session && session.playerData) {
              session.playerData.x = message.x
              session.playerData.y = message.y
              session.lastSeen = Date.now()
              
              // Broadcast movement
              broadcast({
                type: 'playerMoved',
                playerId,
                x: message.x,
                y: message.y
              }, playerId)
            }
          }
        } catch (error) {
          console.error('WebSocket message error:', error)
        }
      })
      
      server.addEventListener('close', () => {
        console.log(`🎮 Player ${playerId} disconnected`)
        const session = sessions.get(playerId)
        if (session && session.playerData) {
          broadcast({
            type: 'playerLeft',
            playerId
          }, playerId)
        }
        sessions.delete(playerId)
      })
      
      return new Response(null, {
        status: 101,
        webSocket: client
      })
    }
    
    // Handle other requests
    return new Response('Multiplayer WebSocket Server', { status: 200 })
  }
}

// Broadcast to all players except sender
function broadcast(message, excludePlayerId = null) {
  const messageStr = JSON.stringify(message)
  let sent = 0
  
  for (const [playerId, session] of sessions) {
    if (playerId === excludePlayerId) continue
    
    if (session.websocket.readyState === 1) { // OPEN
      try {
        session.websocket.send(messageStr)
        sent++
      } catch (error) {
        console.error(`Failed to send to ${playerId}:`, error)
        sessions.delete(playerId)
      }
    }
  }
  
  if (sent > 0) {
    console.log(`📡 Broadcast to ${sent} players`)
  }
}