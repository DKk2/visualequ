/**
 * Sidebar Component
 * Displays list of equations with controls:
 * - Color picker for each equation
 * - Visibility toggle
 * - Equation selection
 * - Delete option
 */

import React from 'react'

function Sidebar({ 
  equations, 
  activeEquationId, 
  onSelectEquation, 
  onToggleVisibility, 
  onUpdateColor,
  onDeleteEquation 
}) {
  return (
    <div className="bg-light border-end" style={{ width: '280px', overflowY: 'auto' }}>
      <div className="p-3">
        <h6 className="text-muted mb-3">Equations</h6>
        
        {equations.length === 0 ? (
          <p className="text-muted small">No equations added yet</p>
        ) : (
          equations.map(eq => (
            <div
              key={eq.id}
              className={`card mb-2 ${eq.id === activeEquationId ? 'border-primary' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectEquation(eq.id)}
            >
              <div className="card-body py-2 px-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <button
                      className="btn btn-sm p-0 me-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleVisibility(eq.id)
                      }}
                      title={eq.visible ? 'Hide' : 'Show'}
                    >
                      {eq.visible ? '👁️' : '👁️‍🗨️'}
                    </button>
                    
                    <div>
                      <div className="fw-bold small">y = {eq.expression}</div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center">
                    <input
                      type="color"
                      value={eq.color}
                      onChange={(e) => {
                        e.stopPropagation()
                        onUpdateColor(eq.id, e.target.value)
                      }}
                      className="form-control form-control-color form-control-sm me-1"
                      style={{ width: '30px', padding: '2px' }}
                      title="Change color"
                    />
                    
                    <button
                      className="btn btn-sm text-danger p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteEquation(eq.id)
                      }}
                      title="Delete equation"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Sidebar
