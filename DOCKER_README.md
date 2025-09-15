# Billder Docker Setup

This guide explains how to run the Billder application using Docker.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. **Clone the repository** (if not already done)
   ```bash
   git clone <your-repo-url>
   cd Billder
   ```

2. **Set up environment variables**
   - Make sure you have a `.env` file in the `backend/` directory
   - The file should contain your Stripe keys and other configuration

3. **Build and run the application**
   ```bash
   cd backend
   docker-compose up --build
   ```

4. **Access the application**
   - Backend API: http://localhost:8000
   - Admin interface: http://localhost:8000/admin
   - Database: SQLite file in backend/db.sqlite3

## Services

### Backend Service
- **Port**: 8000
- **Database**: SQLite (db.sqlite3)
- **Features**: 
  - Automatic migrations
  - Superuser creation (admin@billder.com / admin123)
  - Static file collection

## Development

### Running in Development Mode
```bash
cd backend
docker-compose up --build
```

### Viewing Logs
```bash
cd backend
docker-compose logs -f backend
```

### Accessing the Database
```bash
# Access the container and use Django shell
cd backend
docker-compose exec backend python manage.py shell

# Or access the SQLite file directly
docker-compose exec backend sqlite3 db.sqlite3
```

### Running Django Commands
```bash
cd backend
docker-compose exec backend python manage.py <command>
```

### Creating a Superuser
```bash
cd backend
docker-compose exec backend python manage.py createsuperuser
```

### Running Migrations
```bash
cd backend
docker-compose exec backend python manage.py migrate
```

### Collecting Static Files
```bash
cd backend
docker-compose exec backend python manage.py collectstatic
```

## Environment Variables

Make sure your `backend/.env` file contains:

```env
SECRET_KEY=your-secret-key
DEBUG=True
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

## Troubleshooting

### Database Issues
- SQLite database is created automatically
- Check if db.sqlite3 file exists in the backend directory
- Ensure proper file permissions for the database file

### Permission Issues
- The application runs as a non-root user for security
- If you encounter permission issues, check file ownership

### Port Conflicts
- Make sure port 8000 is not in use
- Change port in docker-compose.yml if needed

### Rebuilding After Changes
```bash
cd backend
docker-compose down
docker-compose up --build
```

## Production Considerations

For production deployment:

1. **Security**
   - Change default database credentials
   - Use strong SECRET_KEY
   - Set DEBUG=False
   - Use environment-specific .env files

2. **Performance**
   - Use production WSGI server (gunicorn)
   - Set up reverse proxy (nginx)
   - Use production database settings

3. **Monitoring**
   - Set up logging
   - Monitor container health
   - Use container orchestration (Docker Swarm/Kubernetes)

## Clean Up

To stop and remove all containers:
```bash
cd backend
docker-compose down
```

To remove everything including volumes:
```bash
cd backend
docker-compose down -v
```
