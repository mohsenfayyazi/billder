#!/bin/bash

# Change to the Django project directory
cd /app/billder

# Create migrations
echo "Creating migrations..."
python manage.py makemigrations

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Create superuser if it doesn't exist
echo "Creating superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@billder.com').exists():
    User.objects.create_superuser(
        email='admin@billder.com',
        password='admin123',
        first_name='Admin',
        last_name='User',
        role='admin'
    )
    print('Superuser created')
else:
    print('Superuser already exists')
"

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start server
echo "Starting server..."
python manage.py runserver 0.0.0.0:8000
