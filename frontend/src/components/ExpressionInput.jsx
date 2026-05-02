/**
 * Expression Input Component
 * Validates mathematical expressions using math.js
 * Provides autocomplete suggestions and error feedback
 * Floating input bar at the bottom of the graph page
 */

import React, { useState } from 'react'
import { parse } from 'mathjs'

function ExpressionInput({ onAddEquation, isEvaluating }) {
  const [expression, setExpression] = useState('')
  const [error, setError] = useState('')

  const validateAndSubmit = (e) => {
    e.preventDefault()
    setError('')

    const trimmed = expression.trim()
    if (!trimmed) return

    // Validate using math.js parser
    try {
      parse(trimmed)
      onAddEquation(trimmed)
      setExpression('')
    } catch (err) {
      setError(`Invalid expression: ${err.message}`)
    }
  }

  return (
    <div className="position-absolute bottom-0 start-50 translate-middle-x mb-4" style={{ width: '500px' }}>
      <form onSubmit={validateAndSubmit}>
        <div className="input-group shadow">
          <span className="input-group-text bg-white">y =</span>
          <input
            type="text"
            className="form-control"
            placeholder="e.g., sin(x), x^2 + 2*x + 1, sqrt(x)"
            value={expression}
            onChange={(e) => {
              setExpression(e.target.value)
              setError('')
            }}
            disabled={isEvaluating}
          />
          <button 
            className="btn btn-primary" 
            type="submit"
            disabled={isEvaluating || !expression.trim()}
          >
            {isEvaluating ? '...' : 'Graph'}
          </button>
        </div>
        {error && (
          <div className="text-danger small mt-1">{error}</div>
        )}
      </form>
      <div className="text-muted small mt-2">
        Supported: sin, cos, tan, exp, log, sqrt, abs, pi, +, -, *, /, ^
      </div>
    </div>
  )
}

export default ExpressionInput
