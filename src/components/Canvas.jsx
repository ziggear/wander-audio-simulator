import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import './Canvas.css'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const LISTENER_X = CANVAS_WIDTH / 2
const LISTENER_Y = CANVAS_HEIGHT / 2

const Canvas = forwardRef(({ sources, selectedSource, onCanvasClick, onSourceDrag, onSelectSource }, ref) => {
  const { t } = useLanguage()
  const canvasRef = useRef(null)
  const isDraggingRef = useRef(false)
  const dragSourceRef = useRef(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  useImperativeHandle(ref, () => ({
    canvas: canvasRef.current,
    getCanvasSize: () => ({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }),
    getListenerPosition: () => ({ x: LISTENER_X, y: LISTENER_Y })
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    
    const draw = () => {
      // Clear canvas
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Draw grid
      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = 1
      for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, CANVAS_HEIGHT)
        ctx.stroke()
      }
      for (let y = 0; y <= CANVAS_HEIGHT; y += 50) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(CANVAS_WIDTH, y)
        ctx.stroke()
      }

      // Draw listener (center point)
      ctx.fillStyle = '#4a9eff'
      ctx.beginPath()
      ctx.arc(LISTENER_X, LISTENER_Y, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#6bb0ff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw listener direction indicator (forward)
      ctx.strokeStyle = '#6bb0ff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(LISTENER_X, LISTENER_Y)
      ctx.lineTo(LISTENER_X, LISTENER_Y - 25)
      ctx.stroke()

      // Draw sound sources
      sources.forEach(source => {
        const isSelected = source.id === selectedSource
        const distance = Math.sqrt(
          Math.pow(source.x - LISTENER_X, 2) + 
          Math.pow(source.y - LISTENER_Y, 2)
        )

        // Draw connection line (distance indicator)
        if (isSelected) {
          ctx.strokeStyle = '#ff6b6b'
          ctx.lineWidth = 1
          ctx.setLineDash([5, 5])
          ctx.beginPath()
          ctx.moveTo(LISTENER_X, LISTENER_Y)
          ctx.lineTo(source.x, source.y)
          ctx.stroke()
          ctx.setLineDash([])

          // Display distance
          const midX = (LISTENER_X + source.x) / 2
          const midY = (LISTENER_Y + source.y) / 2
          ctx.fillStyle = '#ff6b6b'
          ctx.font = '12px monospace'
          ctx.fillText(`${Math.round(distance)}px`, midX + 10, midY - 10)
        }

        // Draw source icon
        const size = isSelected ? 20 : 16
        ctx.fillStyle = source.audioBuffer ? '#4ade80' : '#fbbf24'
        ctx.beginPath()
        ctx.arc(source.x, source.y, size, 0, Math.PI * 2)
        ctx.fill()

        if (isSelected) {
          ctx.strokeStyle = '#ff6b6b'
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // Draw source name
        ctx.fillStyle = '#fff'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(source.name, source.x, source.y + size + 15)
      })
    }

    draw()
  }, [sources, selectedSource])

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if a source was clicked
    const clickedSource = sources.find(source => {
      const distance = Math.sqrt(
        Math.pow(source.x - x, 2) + Math.pow(source.y - y, 2)
      )
      return distance <= 20
    })

    if (clickedSource) {
      isDraggingRef.current = true
      dragSourceRef.current = clickedSource.id
      dragOffsetRef.current = {
        x: x - clickedSource.x,
        y: y - clickedSource.y
      }
      onSelectSource(clickedSource.id)
    } else {
      // Click on empty space to create new source
      onCanvasClick(x, y)
    }
  }

  const handleMouseMove = (e) => {
    if (isDraggingRef.current && dragSourceRef.current) {
      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()
      const x = Math.max(0, Math.min(CANVAS_WIDTH, e.clientX - rect.left - dragOffsetRef.current.x))
      const y = Math.max(0, Math.min(CANVAS_HEIGHT, e.clientY - rect.top - dragOffsetRef.current.y))
      
      onSourceDrag(dragSourceRef.current, x, y)
    }
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
    dragSourceRef.current = null
  }

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="audio-canvas"
      />
      <div className="canvas-legend">
        <div className="legend-item">
          <div className="legend-icon" style={{ background: '#4a9eff' }}></div>
          <span>{t('canvas.listener')}</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon" style={{ background: '#4ade80' }}></div>
          <span>{t('canvas.loadedAudio')}</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon" style={{ background: '#fbbf24' }}></div>
          <span>{t('canvas.notLoadedAudio')}</span>
        </div>
      </div>
    </div>
  )
})

Canvas.displayName = 'Canvas'

export default Canvas

