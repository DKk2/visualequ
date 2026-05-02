"""
Root URL configuration for Visualequ Django math engine.
Routes math evaluation endpoints and admin interface.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/math/', include('math_engine.urls')),
]
