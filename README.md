# Release Management System

A comprehensive full-stack release management application built with Go (Gin), React, and PostgreSQL. Features complete CRUD operations for managing software releases, builds, systems, and environments with a modern web interface.

## 🚀 Features

### Core Release Management
- � **Release Management**: Full CRUD operations for software releases
- 🏗️ **Build Management**: Track and manage builds with optional release associations
- 🖥️ **System Management**: Manage different systems and their relationships
- 🌐 **Environment Management**: Handle deployment environments

### Technical Features
- 🐳 **Fully Dockerized**: Complete containerization with Docker Compose
- 🔄 **CORS Support**: Cross-origin resource sharing enabled
- 📊 **RESTful API**: Complete REST API with proper HTTP status codes
- 🗄️ **Database Relations**: Proper foreign key relationships and data integrity
- ⚡ **Fast Performance**: Optimized queries and efficient data loading

## Quick Start

1. **Clone and navigate to the project**:
   ```bash
   cd release-management
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

## 📁 Project Structure

```
release-management/
├── backend/                     # Go API Server
│   ├── cmd/
│   │   └── main.go              # Application entry point
│   ├── internal/
│   │   ├── config/              # Configuration management
│   │   ├── database/            # Database connection & seeding
│   │   ├── handlers/            # HTTP request handlers
│   │   │   ├── auth.go          # Authentication handlers
│   │   │   ├── release.go       # Release CRUD operations
│   │   │   ├── build.go         # Build CRUD operations
│   │   │   ├── system.go        # System CRUD operations
│   │   │   └── environment.go   # Environment CRUD operations
│   │   ├── middleware/          # Authentication & CORS middleware
│   │   ├── models/              # Database models (GORM)
│   │   │   ├── user.go          # User model
│   │   │   ├── release.go       # Release model
│   │   │   ├── build.go         # Build model (with optional release)
│   │   │   ├── system.go        # System model
│   │   │   └── environment.go   # Environment model
│   │   └── router/              # Route definitions
│   ├── Dockerfile               # Multi-stage Docker build
│   ├── go.mod                   # Go dependencies
│   └── go.sum
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── pages/               # React components
│   │   │   ├── Login.js         # Login page
│   │   │   ├── Register.js      # Registration page
│   │   │   ├── Home.js          # Main dashboard with navigation
│   │   │   ├── ReleaseManager.js # Release management interface
│   │   │   └── ReleaseDetail.js # Release create/edit forms
│   │   ├── services/
│   │   │   └── api.js           # API service functions
│   │   ├── App.js               # Main React component with routing
│   │   └── index.js             # React entry point
│   ├── public/                  # Static assets
│   ├── Dockerfile               # Multi-stage build with Nginx
│   ├── nginx.conf               # Production web server config
│   └── package.json             # Node.js dependencies
├── .env                         # Environment configuration
├── docker-compose.yml           # Multi-container orchestration
└── README.md                    # This file
```

## 🔌 API Endpoints

### Authentication Endpoints (Public)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `GET /health` - Health check

### User Endpoints (Protected)
- `GET /api/me` - Get current user information
- `GET /api/dashboard` - Get dashboard data

### Release Management (Protected)
- `GET /api/releases` - Get all releases
- `GET /api/releases/:id` - Get specific release
- `POST /api/releases` - Create new release
- `PUT /api/releases/:id` - Update release
- `DELETE /api/releases/:id` - Delete release
- `GET /api/releases/:id/builds` - Get builds associated with release

### Build Management (Protected)
- `GET /api/builds` - Get all builds
- `GET /api/builds/:id` - Get specific build
- `POST /api/builds` - Create new build (release optional)
- `PUT /api/builds/:id` - Update build (can add/remove release association)
- `DELETE /api/builds/:id` - Delete build

### System Management (Protected)
- `GET /api/systems` - Get all systems
- `GET /api/systems/:id` - Get specific system
- `POST /api/systems` - Create new system
- `PUT /api/systems/:id` - Update system
- `DELETE /api/systems/:id` - Delete system
- `GET /api/systems/:id/subsystems` - Get subsystems

### Environment Management (Protected)
- `GET /api/environments` - Get all environments
- `GET /api/environments/:id` - Get specific environment
- `POST /api/environments` - Create new environment
- `PUT /api/environments/:id` - Update environment
- `DELETE /api/environments/:id` - Delete environment

### Request/Response Format
All API endpoints return JSON. Authentication required endpoints need:
```
Authorization: Bearer <jwt_token>
```

Example Response:
```json
{
  "id": "uuid-string",
  "name": "Release v1.0.0",
  "description": "Major release with new features",
  "release_date": "2025-10-30T10:00:00Z",
  "status": "planned",
  "created_at": "2025-10-26T10:11:44Z",
  "updated_at": "2025-10-26T10:11:44Z"
}
```

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

## 🏗️ Database Schema

### Core Entities

**Users**
- ID (UUID), Email, Password (hashed), IsAdmin, Timestamps

**Releases**
- ID (UUID), Name, Description, ReleaseDate, Status, Type, Timestamps

**Systems** 
- ID (UUID), Name, Description, Type, Status, ParentSystemID (self-referencing), Timestamps

**Builds**
- ID (UUID), SystemID (FK), ReleaseID (FK, optional), Version, BuildDate, Status, Timestamps

**Environments**
- ID (UUID), Name, Description, Type, Status, Timestamps

### Relationships
- Systems can have parent-child relationships (subsystems)
- Builds belong to a System (required)
- Builds can optionally belong to a Release
- Releases can have multiple Builds

## 🎯 Usage Guide

### Getting Started
1. Access the application at `http://localhost:3000`
2. Login with admin credentials: `admin@admin.test` / `admin123`
3. Navigate using the left sidebar menu

### Managing Releases
1. Click **"Release > Manager"** in the left navigation
2. **View releases**: See all releases with search and sorting
3. **Create release**: Click "Create New Release" button
4. **Edit release**: Click the ✏️ edit icon on any release
5. **Expand release**: Click anywhere on a release card to see associated builds
6. **Manage builds**: In release detail, add/remove builds using the modal

### Managing Builds
- Builds can be created independently without assigning to a release
- Use the build management interface to assign builds to releases later
- Remove build-release associations as needed

### Search & Filter
- **Search**: Type in the search box to filter releases by name, description
- **Sort**: Use the dropdown to sort by name, release date, created date, or status
- **Status filtering**: Visual status badges help identify release states

## 🔧 Technical Details

### Architecture
- **Backend**: Go 1.24 with Gin framework
- **Frontend**: React 18 with functional components and hooks
- **Database**: PostgreSQL 15 with GORM ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Containerization**: Docker with multi-stage builds

### Key Features
- **Embedded UI**: Release management integrated within main dashboard
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: UI updates immediately after data changes
- **Error Handling**: Comprehensive error handling with user feedback
- **Data Validation**: Both frontend and backend validation

### Security
- JWT token-based authentication
- Password hashing with bcrypt
- CORS protection
- SQL injection protection via GORM
- Environment variable-based secrets management

## 🚀 Future Enhancements

This application provides a solid foundation for enterprise release management. Consider adding:

### Features
- **User Management**: Role-based access control
- **Deployment Tracking**: Track deployments to different environments
- **Release Pipeline**: Workflow management for release processes
- **Notifications**: Email/Slack notifications for release events
- **Audit Logging**: Track all changes with user attribution
- **Reporting**: Analytics and reports on release metrics

### Technical Improvements
- **API Documentation**: Swagger/OpenAPI documentation
- **Testing**: Unit and integration test suites
- **CI/CD**: Automated testing and deployment pipeline
- **Monitoring**: Application performance monitoring
- **Caching**: Redis for improved performance
- **File Upload**: Support for release artifacts and documentation