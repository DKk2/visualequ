"""
URL routing for math engine endpoints.
POST /evaluate/ - Evaluate mathematical expressions
"""

from django.urls import path
from . import views

urlpatterns = [
    path('evaluate/', views.MathEvaluateView.as_view(), name='evaluate-expression'),
]
