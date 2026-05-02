/**
 * Canvas 2D Rendering Component
 * Handles:
 * - World-to-screen coordinate transformations
 * - Pan and zoom interactions (mouse wheel + drag)
 * - Adaptive sampling for smooth curves
 * - Proper handling of undefined y-values (asymptotes)
 * - Grid rendering with axis labels
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'

function Canvas({ equations, isEvaluating }) {
  const canvasRef = useRef(null)
  const [transform, setTransform] = useState({
    offsetX: 0,
    offsetY: 0,
    scale: 50, // pixels per unit
  })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const transformRef = useRef(transform)

  // Keep transformRef in sync
  useEffect(() => {
    transformRef.current = transform
  }, [transform])

  const worldToScreen = useCallback((wx, wy) => {
    const { offsetX, offsetY, scale } = transformRef.current
    const canvas = canvasRef.current
    if (!canvas) return [0, 0]
    
    return [
      (wx * scale) + canvas.width / 2 + offsetX,
      canvas.height / 2 - (wy * scale) + offsetY
    ]
  }, [])

  const screenToWorld = useCallback((sx, sy) => {
    const { offsetX, offsetY, scale } = transformRef.current
    const canvas = canvasRef.current
    if (!canvas) return [0, 0]
    
    return [
      (sx - canvas.width / 2 - offsetX) / scale,
      (canvas.height / 2 + offsetY - sy) / scale
    ]
  }, [])

  // Draw everything
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const { width, height } = canvas

    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    drawGrid(ctx, width, height, transform)

    // Draw each equation
    equations.forEach(eq => {
      if (eq.visible && eq.points) {
        drawEquation(ctx, eq, width, height, worldToScreen)
      }
    })

    // Draw loading indicator
    if (isEvaluating) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.font = '14px Arial'
      ctx.fillText('Evaluating...', 10, 20)
    }
  }, [equations, transform, isEvaluating, worldToScreen])

  const drawGrid = (ctx, width, height, transform) => {
    const { offsetX, offsetY, scale } = transform
    const centerX = width / 2 + offsetX
    const centerY = height / 2 + offsetY

    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 0.5

    // Vertical grid lines
    const gridSpacing = scale >= 20 ? 1 : scale >= 10 ? 2 : 5
    const startX = -Math.ceil(centerX / (scale * gridSpacing)) * gridSpacing
    const endX = Math.ceil((width - centerX) / (scale * gridSpacing)) * gridSpacing

    for (let x = startX; x <= endX; x += gridSpacing) {
      const [sx] = worldToScreen(x, 0)
      ctx.beginPath()
      ctx.moveTo(sx, 0)
      ctx.lineTo(sx, height)
      ctx.stroke()
    }

    // Horizontal grid lines
    const startY = -Math.ceil((height - centerY) / (scale * gridSpacing)) * gridSpacing
    const endY = Math.ceil(centerY / (scale * gridSpacing)) * gridSpacing

    for (let y = startY; y <= endY; y += gridSpacing) {
      const [, sy] = worldToScreen(0, y)
      ctx.beginPath()
      ctx.moveTo(0, sy)
      ctx.lineTo(width, sy)
      ctx.stroke()
    }

    // Draw axes
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, centerY)
    ctx.lineTo(width, centerY)
    ctx.moveTo(centerX, 0)
    ctx.lineTo(centerX, height)
    ctx.stroke()

    // Axis labels
    ctx.fillStyle = '#666666'
    ctx.font = '10px Arial'
    ctx.fillText('x', width - 15, centerY - 5)
    ctx.fillText('y', centerX + 5, 15)
  }

  const drawEquation = (ctx, equation, width, height, worldToScreen) => {
    const points = equation.points
    if (!points || points.length < 2) return

    ctx.strokeStyle = equation.color || '#0d6efd'
    ctx.lineWidth = 2
    ctx.beginPath()

    let isFirstPoint = true
    let previousPoint = null

    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      
      // Skip undefined points (asymptotes)
      if (point.y === null || point.y === undefined) {
        isFirstPoint = true
        continue
      }

      const [sx, sy] = worldToScreen(point.x, point.y)

      // Don't draw if off-screen
      if (sx < -100 || sx > width + 100 || sy < -100 || sy > height + 100) {
        isFirstPoint = true
        continue
      }

      if (isFirstPoint) {
        ctx.moveTo(sx, sy)
        isFirstPoint = false
      } else {
        // Check for large jumps (discontinuities)
        if (previousPoint) {
          const dx = Math.abs(sx - previousPoint.x)
          const dy = Math.abs(sy - previousPoint.y)
          if (dy > height * 0.8) {
            ctx.moveTo(sx, sy)
            previousPoint = { x: sx, y: sy }
            continue
          }
        }
        ctx.lineTo(sx, sy)
      }
      
      previousPoint = { x: sx, y: sy }
    }

    ctx.stroke()
  }

  // Mouse handlers
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    setIsDragging(true)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const rect = canvasRef.current.getBoundingClientRect()
    const dx = e.clientX - rect.left - dragStartRef.current.x
    const dy = e.clientY - rect.top - dragStartRef.current.y
    
    setTransform(prev => ({
      ...prev,
      offsetX: prev.offsetX + dx,
      offsetY: prev.offsetY + dy
    }))
    
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleWheel = (e) => {
    e.preventDefault()
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    setTransform(prev => ({
      ...prev,
      scale: Math.max(5, Math.min(200, prev.scale * zoomFactor))
    }))
  }

  // Resize handler
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
        // Force re-render
        setTransform(prev => ({ ...prev }))
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-100 h-100 d-block"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    />
  )
}

export default Canvas
