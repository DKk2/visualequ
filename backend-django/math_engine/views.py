"""
Math Engine Views
POST /evaluate/ - Evaluates mathematical expressions using SymPy
  Input: { expression: string, xMin: float, xMax: float, steps: int }
  Output: [{ x: float, y: float|null }] with null for undefined/asymptotes
  
Adaptive sampling handles:
- Asymptotes (null y values)
- Steep slopes
- Trigonometric functions
- Error handling for invalid expressions
"""

import numpy as np
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Equation

class MathEvaluateView(APIView):
    def evaluate_expression(self, expr_str, x_min, x_max, steps):
        """Core evaluation engine using adaptive sampling"""
        try:
            # Parse expression with implicit multiplication support
            transformations = (standard_transformations + (implicit_multiplication_application,))
            x = sp.Symbol('x')
            expr = parse_expr(expr_str, transformations=transformations)
            
            # Create lambda function for numerical evaluation
            f = sp.lambdify(x, expr, modules=['numpy', {'sin': np.sin, 'cos': np.cos, 
                       'tan': np.tan, 'exp': np.exp, 'log': np.log, 'sqrt': np.sqrt,
                       'pi': np.pi, 'abs': np.abs}])
            
            # Generate x values
            x_values = np.linspace(x_min, x_max, steps)
            
            # Evaluate with error handling for each point
            results = []
            for x_val in x_values:
                try:
                    y_val = float(f(x_val))
                    
                    # Check for NaN or Inf
                    if np.isnan(y_val) or np.isinf(y_val) or abs(y_val) > 1e10:
                        results.append({'x': float(x_val), 'y': None})
                    else:
                        results.append({'x': float(x_val), 'y': y_val})
                except (ZeroDivisionError, OverflowError, ValueError):
                    results.append({'x': float(x_val), 'y': None})
                except Exception:
                    # Break at discontinuities
                    results.append({'x': float(x_val), 'y': None})
            
            # Adaptive refinement for steep regions
            results = self.adaptive_refinement(results, f)
            
            return results
        except Exception as e:
            raise ValueError(f"Error evaluating expression: {str(e)}")
    
    def adaptive_refinement(self, points, f, threshold=10.0):
        """Add extra sampling points in regions with rapid changes"""
        if len(points) < 3:
            return points
        
        refined = [points[0]]
        
        for i in range(1, len(points) - 1):
            refined.append(points[i])
            
            # Check if adjacent points have valid y values
            if points[i-1]['y'] is not None and points[i]['y'] is not None and points[i+1]['y'] is not None:
                # Calculate local slope
                dy1 = abs(points[i]['y'] - points[i-1]['y'])
                dy2 = abs(points[i+1]['y'] - points[i]['y'])
                dx = points[i]['x'] - points[i-1]['x']
                
                if dx > 0 and (dy1 > threshold or dy2 > threshold):
                    # Add midpoint for refinement
                    mid_x = (points[i]['x'] + points[i-1]['x']) / 2
                    try:
                        mid_y = float(f(mid_x))
                        if not (np.isnan(mid_y) or np.isinf(mid_y) or abs(mid_y) > 1e10):
                            refined.append({'x': mid_x, 'y': mid_y})
                    except Exception:
                        pass
        
        refined.append(points[-1])
        return refined
    
    def post(self, request):
        expression = request.data.get('expression')
        x_min = request.data.get('xMin', -10)
        x_max = request.data.get('xMax', 10)
        steps = request.data.get('steps', 500)
        
        if not expression:
            return Response(
                {'error': 'Expression is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate ranges
        try:
            x_min = float(x_min)
            x_max = float(x_max)
            steps = int(steps)
            
            if steps < 2 or steps > 5000:
                steps = 500
            if x_min >= x_max:
                return Response(
                    {'error': 'xMin must be less than xMax'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid numeric parameters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            results = self.evaluate_expression(expression, x_min, x_max, steps)
            
            # Cache result in database (optional)
            Equation.objects.create(
                expression=expression,
                x_min=x_min,
                x_max=x_max,
                steps=steps,
                result_data=results
            )
            
            return Response({
                'points': results,
                'metadata': {
                    'expression': expression,
                    'xMin': x_min,
                    'xMax': x_max,
                    'totalPoints': len(results)
                }
            })
            
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Evaluation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
