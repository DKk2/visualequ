"""
Math Engine Models
Tracks evaluated equations and saved graphs for caching/auditing purposes.
"""

from django.db import models

class Equation(models.Model):
    expression = models.TextField()
    x_min = models.FloatField()
    x_max = models.FloatField()
    steps = models.IntegerField()
    result_data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.expression} [{self.x_min}, {self.x_max}]"

class SavedGraph(models.Model):
    equation = models.ForeignKey(Equation, on_delete=models.CASCADE, related_name='graphs')
    name = models.CharField(max_length=255)
    settings = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
