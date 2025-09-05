import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { useGame } from '@/lib/GameContext'
import { HubWorldScene } from '@/scenes/HubWorldScene'
import { PreloadScene } from '@/scenes/PreloadScene'
import { CharacterSelectScene } from '@/scenes/CharacterSelectScene'
import { TestScene } from '@/scenes/TestScene'
import { LandingScene } from '@/scenes/LandingScene'

interface GameCanvasProps {
  isWalletConnected?: boolean
  testMode?: boolean
}

export default function GameCanvas({ isWalletConnected = false, testMode = false }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { gameState, updatePlayerPosition, throwCoins } = useGame()

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      pixelArt: true,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: testMode ? [TestScene] : [LandingScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    }

    gameRef.current = new Phaser.Game(config)

    gameRef.current.registry.set('gameContext', {
      gameState,
      updatePlayerPosition,
      throwCoins
    })

    const handleResize = () => {
      if (gameRef.current) {
        gameRef.current.scale.resize(window.innerWidth, window.innerHeight)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.registry.set('gameContext', {
        gameState,
        updatePlayerPosition,
        throwCoins
      })
    }
  }, [gameState, updatePlayerPosition, throwCoins])

  return <div ref={containerRef} className="w-full h-full" />
}