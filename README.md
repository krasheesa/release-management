# Release Management Application

A full-stack web application built with Go (Gin), React, and PostgreSQL, all containerized with Docker.

## Features

- 🔐 **User Authentication**: JWT-based login and registration
- 👤 **Admin Seeding**: Automatic admin user creation on first startup
- 🛡️ **Protected Routes**: Middleware-based route protection
- 📱 **Responsive UI**: Clean React interface with routing
- 🐳 **Dockerized**: Complete containerization with Docker Compose
- 🔄 **CORS Support**: Cross-origin resource sharing enabled

## Quick Start

1. **Clone and navigate to the project**:
   ```bash
   cd /home/kevin.nadhif@accelbyte.net/project/release-management
   ```

2. **Start all services**:
   ```bash
   docker-compose up --build
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Health Check: http://localhost:8080/health

## Default Admin Credentials

- **Email**: admin@admin.test
- **Password**: admin123

## Project Structure

```
├── backend/
│   ├── cmd/
│   │   └── main.go              # Application entry point
│   ├── internal/
│   │   ├── config/              # Configuration management
│   │   ├── database/            # Database connection & seeding
│   │   ├── handlers/            # HTTP request handlers
│   │   ├── middleware/          # Authentication middleware
│   │   ├── models/              # Database models
│   │   └── router/              # Route definitions
│   ├── Dockerfile
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── pages/               # React pages (Login, Register, Dashboard)
│   │   ├── App.js               # Main React component with routing
│   │   └── index.js             # React entry point
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf               # Nginx configuration for production
│   └── package.json
├── .env                         # Environment variables
└── docker-compose.yml           # Multi-container orchestration
```

## API Endpoints

### Public Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /health` - Health check

### Protected Endpoints (Requires JWT Token)
- `GET /api/me` - Get current user info
- `GET /api/dashboard` - Dashboard data

## Environment Variables

The application uses the following environment variables (defined in `.env`):

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=releasemanager
DB_PASSWORD=secretpassword
DB_NAME=releasemanagement
DB_SSLMODE=disable

# Server Configuration
SERVER_PORT=8080
SERVER_HOST=0.0.0.0

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Admin Configuration
ADMIN_EMAIL=admin@admin.test
ADMIN_PASSWORD=admin123
```

## Development

### Backend Development
```bash
cd backend
go mod tidy
go run cmd/main.go
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

### Database
The application uses PostgreSQL with GORM for ORM. Database migrations are handled automatically on startup.

## Docker Services

- **postgres**: PostgreSQL 15 database
- **backend**: Go application (Gin framework)
- **frontend**: React application (served by Nginx)

All services are connected via a custom Docker network for secure internal communication.

## Features in Detail

### Authentication System
- JWT token-based authentication
- Password hashing with bcrypt
- Protected routes with middleware
- Automatic admin user seeding

### Frontend Features
- React Router for navigation
- Context API for state management
- Protected route components
- Responsive design with CSS
- Form validation and error handling

### Backend Features
- Clean architecture with internal packages
- Configuration management with environment variables
- Database connection with health checks
- CORS middleware for cross-origin requests
- Structured logging

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS protection
- SQL injection protection via GORM
- Environment variable-based configuration

## Next Steps

This application provides a solid foundation for further development. Consider adding:

- User roles and permissions
- Password reset functionality
- Email verification
- Rate limiting
- API documentation with Swagger
- Unit and integration tests
- CI/CD pipeline
- Monitoring and logging