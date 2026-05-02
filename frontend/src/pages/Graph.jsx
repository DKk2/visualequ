/**
 * Main Graph Visualization Page
 * Orchestrates the Canvas renderer, expression input, and sidebar
 * Manages equations state, evaluation, and graph controls
 * Protected route - requires authentication
 */

import React, { useState, useCallback } from 'react'
import Canvas from '../components/Canvas'
import ExpressionInput from '../components/ExpressionInput'
import Sidebar from '../components/Sidebar'
import { mathAPI } from '../api'

function Graph({ user, onLogout }) {
  const [equations, setEquations] = useState([
    { 
      id: 1, 
      expression: 'sin(x)', 
      color: '#0d6efd', 
      visible: true,
      sliderVars: {}
    }
  ])
  const [activeEquationId, setActiveEquationId] = useState(1)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const getActiveEquation = () => equations.find(eq => eq.id === activeEquationId)

  const evaluateEquation = useCallback(async (equation) => {
    setIsEvaluating(true)
    try {
      const response = await mathAPI.evaluate({
        expression: equation.expression,
        xMin: -10,
        xMax: 10,
        steps: 500
      })
      
      setEquations(prev => prev.map(eq => 
        eq.id === equation.id ? { ...eq, points: response.data.points } : eq
      ))
    } catch (error) {
      console.error('Evaluation failed:', error.message)
    } finally {
      setIsEvaluating(false)
    }
  }, [])

  const addEquation = (expression) => {
    const newId = Math.max(...equations.map(e => e.id), 0) + 1
    const colors = ['#0d6efd', '#dc3545', '#198754', '#ffc107', '#6f42c1', '#fd7e14']
    const newEquation = {
      id: newId,
      expression,
      color: colors[equations.length % colors.length],
      visible: true,
      sliderVars: {}
    }
    setEquations([...equations, newEquation])
    setActiveEquationId(newId)
    evaluateEquation(newEquation)
  }

  const toggleVisibility = (id) => {
    setEquations(prev => prev.map(eq => 
      eq.id === id ? { ...eq, visible: !eq.visible } : eq
    ))
  }

  const updateColor = (id, color) => {
    setEquations(prev => prev.map(eq => 
      eq.id === id ? { ...eq, color } : eq
    ))
  }

  return (
    <div className="vh-100 d-flex flex-column">
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <span className="navbar-brand">
            <span className="text-primary">Visual</span>equ
          </span>
          
          <div className="d-flex align-items-center">
            <span className="text-light me-3">{user?.username}</span>
            <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex">
        {/* Sidebar */}
        <Sidebar
          equations={equations}
          activeEquationId={activeEquationId}
          onSelectEquation={setActiveEquationId}
          onToggleVisibility={toggleVisibility}
          onUpdateColor={updateColor}
          onDeleteEquation={(id) => {
            setEquations(prev => prev.filter(eq => eq.id !== id))
            if (activeEquationId === id) {
              const remaining = equations.filter(eq => eq.id !== id)
              if (remaining.length > 0) {
                setActiveEquationId(remaining[0].id)
              }
            }
          }}
        />

        {/* Graph Area */}
        <div className="flex-grow-1 position-relative bg-white">
          <Canvas 
            equations={equations.filter(eq => eq.visible)}
            isEvaluating={isEvaluating}
          />
          
          <ExpressionInput 
            onAddEquation={addEquation}
            isEvaluating={isEvaluating}
          />
        </div>
      </div>
    </div>
  )
}

export default Graph
