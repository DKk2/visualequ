#!/bin/bash
# Wait for database to be ready
echo "Waiting for PostgreSQL..."
sleep 5

# Run migrations
python manage.py makemigrations math_engine
python manage.py migrate

# Start server
python manage.py runserver 0.0.0.0:8000
