/**
 * Canvas 2D Rendering Component
 * Handles:
 * - World-to-screen coordinate transformations via viewport
 * - Pan and zoom interactions (mouse wheel + drag)
 * - Grid rendering with axis labels
 * - Equation curve rendering with asymptote / discontinuity detection
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'

function Canvas({ equations, isEvaluating }) {
  const canvasRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  // Viewport in world coordinates
  const [viewport, setViewport] = useState({
    xMin: -10,
    xMax: 10,
    yMin: -7.5,
    yMax: 7.5,
  })

  const viewportRef = useRef(viewport)
  useEffect(() => { viewportRef.current = viewport }, [viewport])

  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const dragViewport = useRef(viewport)

  // ── Coordinate transforms ────────────────────────────────────────────────
  const toScreenX = useCallback((wx, vp, w) =>
    (wx - vp.xMin) / (vp.xMax - vp.xMin) * w,
    []
  )

  const toScreenY = useCallback((wy, vp, h) =>
    (1 - (wy - vp.yMin) / (vp.yMax - vp.yMin)) * h,
    []
  )

  // ── Drawing helpers ──────────────────────────────────────────────────────
  const formatLabel = (val) => {
    const s = parseFloat(val.toFixed(2)).toString()
    return s
  }

  const drawGrid = useCallback((ctx, vp, w, h) => {
    const xRange = vp.xMax - vp.xMin
    const yRange = vp.yMax - vp.yMin

    // Adaptive grid step
    const rawStep = Math.pow(10, Math.floor(Math.log10(xRange / 8)))
    const gridStep = rawStep > 0 ? rawStep : 1

    // ── Grid lines ──
    ctx.setLineDash([1, 3])
    ctx.strokeStyle = '#cccccc'
    ctx.lineWidth = 0.5

    // Vertical grid lines
    const xStart = Math.ceil(vp.xMin / gridStep) * gridStep
    for (let x = xStart; x <= vp.xMax + gridStep * 0.001; x += gridStep) {
      const sx = toScreenX(x, vp, w)
      ctx.beginPath()
      ctx.moveTo(sx, 0)
      ctx.lineTo(sx, h)
      ctx.stroke()
    }

    // Horizontal grid lines
    const yGridStep = Math.pow(10, Math.floor(Math.log10(yRange / 8))) || 1
    const yStart = Math.ceil(vp.yMin / yGridStep) * yGridStep
    for (let y = yStart; y <= vp.yMax + yGridStep * 0.001; y += yGridStep) {
      const sy = toScreenY(y, vp, h)
      ctx.beginPath()
      ctx.moveTo(0, sy)
      ctx.lineTo(w, sy)
      ctx.stroke()
    }

    ctx.setLineDash([])

    // ── Axes ──
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 1.5

    // X-axis (y = 0)
    if (vp.yMin <= 0 && vp.yMax >= 0) {
      const sy = toScreenY(0, vp, h)
      ctx.beginPath()
      ctx.moveTo(0, sy)
      ctx.lineTo(w, sy)
      ctx.stroke()
    }

    // Y-axis (x = 0)
    if (vp.xMin <= 0 && vp.xMax >= 0) {
      const sx = toScreenX(0, vp, w)
      ctx.beginPath()
      ctx.moveTo(sx, 0)
      ctx.lineTo(sx, h)
      ctx.stroke()
    }

    // ── Tick labels ──
    ctx.font = '11px sans-serif'
    ctx.fillStyle = '#555555'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    const originSX = toScreenX(0, vp, w)
    const originSY = toScreenY(0, vp, h)
    const ORIGIN_SKIP = 18 // px radius around origin to skip label

    // X-axis labels
    for (let x = xStart; x <= vp.xMax + gridStep * 0.001; x += gridStep) {
      if (Math.abs(x) < gridStep * 0.001) continue // skip zero on x-axis
      const sx = toScreenX(x, vp, w)
      // Skip if too close to origin label area
      if (Math.abs(sx - originSX) < ORIGIN_SKIP && Math.abs(originSY - h / 2) < ORIGIN_SKIP) continue
      const labelY = Math.min(Math.max(originSY + 3, 3), h - 16)
      ctx.fillText(formatLabel(x), sx, labelY)
    }

    // Y-axis labels
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let y = yStart; y <= vp.yMax + yGridStep * 0.001; y += yGridStep) {
      if (Math.abs(y) < yGridStep * 0.001) continue // skip zero on y-axis
      const sy = toScreenY(y, vp, h)
      const labelX = Math.min(Math.max(originSX - 4, 28), w - 4)
      ctx.fillText(formatLabel(y), labelX, sy)
    }

    // Origin "0" label
    if (vp.xMin <= 0 && vp.xMax >= 0 && vp.yMin <= 0 && vp.yMax >= 0) {
      ctx.textAlign = 'right'
      ctx.textBaseline = 'top'
      ctx.fillText('0', originSX - 4, originSY + 3)
    }

    // Axis name labels
    ctx.fillStyle = '#333333'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText('x', w - 14, Math.min(Math.max(originSY, 12), h - 12))
    ctx.textAlign = 'center'
    ctx.fillText('y', Math.min(Math.max(originSX, 12), w - 12), 10)
  }, [toScreenX, toScreenY])

  const drawEquations = useCallback((ctx, vp, w, h, eqs) => {
    eqs.forEach(eq => {
      if (!eq.visible || !eq.points || eq.points.length < 2) return

      ctx.strokeStyle = eq.color || '#0d6efd'
      ctx.lineWidth = 2
      ctx.setLineDash([])
      ctx.beginPath()

      let penDown = false
      let prevSY = null

      for (let i = 0; i < eq.points.length; i++) {
        const pt = eq.points[i]

        // Skip asymptotes / undefined values
        if (pt.y === null || pt.y === undefined || !isFinite(pt.y) || Math.abs(pt.y) > 1e10) {
          penDown = false
          prevSY = null
          continue
        }

        const sx = toScreenX(pt.x, vp, w)
        const sy = toScreenY(pt.y, vp, h)

        // Large vertical jump → discontinuity, lift pen
        if (penDown && prevSY !== null && Math.abs(sy - prevSY) > (h * 0.5)) {
          penDown = false
        }

        if (!penDown) {
          ctx.moveTo(sx, sy)
          penDown = true
        } else {
          ctx.lineTo(sx, sy)
        }
        prevSY = sy
      }

      ctx.stroke()
    })
  }, [toScreenX, toScreenY])

  // ── Main draw effect ─────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)

    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)

    drawGrid(ctx, viewport, w, h)
    drawEquations(ctx, viewport, w, h, equations)

    if (isEvaluating) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.font = '13px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText('Evaluating…', 10, 10)
    }
  }, [equations, viewport, canvasSize, isEvaluating, drawGrid, drawEquations])

  // ── Resize observer ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      setCanvasSize({ width: canvas.width, height: canvas.height })

      // Keep aspect ratio of viewport centred on same world point
      const cx = (viewportRef.current.xMin + viewportRef.current.xMax) / 2
      const cy = (viewportRef.current.yMin + viewportRef.current.yMax) / 2
      const halfW = (viewportRef.current.xMax - viewportRef.current.xMin) / 2
      const aspect = canvas.height / canvas.width
      setViewport({
        xMin: cx - halfW,
        xMax: cx + halfW,
        yMin: cy - halfW * aspect,
        yMax: cy + halfW * aspect,
      })
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  // ── Pan ──────────────────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    dragViewport.current = viewportRef.current
  }

  const handleMouseMove = (e) => {
    if (!isDragging.current) return
    const canvas = canvasRef.current
    if (!canvas) return

    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    const vp = dragViewport.current
    const xRange = vp.xMax - vp.xMin
    const yRange = vp.yMax - vp.yMin
    const wx = (dx / canvas.width) * xRange
    const wy = (dy / canvas.height) * yRange

    setViewport({
      xMin: vp.xMin - wx,
      xMax: vp.xMax - wx,
      yMin: vp.yMin + wy,
      yMax: vp.yMax + wy,
    })
  }

  const handleMouseUp = () => { isDragging.current = false }

  // ── Zoom ─────────────────────────────────────────────────────────────────
  const handleWheel = (e) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const vp = viewportRef.current
    const w = canvas.width
    const h = canvas.height

    // World coords under cursor
    const wx = vp.xMin + (mx / w) * (vp.xMax - vp.xMin)
    const wy = vp.yMax - (my / h) * (vp.yMax - vp.yMin)

    const factor = e.deltaY > 0 ? 1.1 : 0.9

    setViewport({
      xMin: wx + (vp.xMin - wx) * factor,
      xMax: wx + (vp.xMax - wx) * factor,
      yMin: wy + (vp.yMin - wy) * factor,
      yMax: wy + (vp.yMax - wy) * factor,
    })
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-100 h-100 d-block"
      style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    />
  )
}

export default Canvas
