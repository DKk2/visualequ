"""
DRF Serializers for math engine models.
Handles validation and transformation of equation data.
"""

from rest_framework import serializers
from .models import Equation, SavedGraph

class EquationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equation
        fields = ['id', 'expression', 'x_min', 'x_max', 'steps', 'result_data', 'created_at']
        read_only_fields = ['result_data', 'created_at']

class SavedGraphSerializer(serializers.ModelSerializer):
    equation = EquationSerializer(read_only=True)
    
    class Meta:
        model = SavedGraph
        fields = ['id', 'equation', 'name', 'settings', 'created_at']
