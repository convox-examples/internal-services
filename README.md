# Convox Internal Routing Test App

A Node.js microservices application designed to test Convox internal service routing and communication between services.

## Architecture

This application consists of three services:

- **Frontend** (`frontend/`) - External service, publicly accessible
- **API** (`api/`) - Internal service, rack-only access
- **Database** (`database/`) - Internal service, rack-only access

## Services Overview

### Frontend Service (External)
- **Port**: 3000
- **Access**: Public
- **Purpose**: Main entry point that tests connectivity to internal services
- **Key Endpoints**:
  - `GET /` - Service information and available endpoints
  - `GET /test-internal` - Tests communication with API and Database services
  - `GET /nslookup/:hostname` - DNS lookup utility
  - `GET /curl/:service` - HTTP connectivity testing

### API Service (Internal)
- **Port**: 3000
- **Access**: Internal only
- **Purpose**: Mock API service with data operations
- **Key Endpoints**:
  - `GET /data` - Retrieve mock data
  - `POST /data` - Create new mock data
  - `GET /test-database` - Test connectivity to database service

### Database Service (Internal)
- **Port**: 3000
- **Access**: Internal only
- **Purpose**: Mock database service with user management
- **Key Endpoints**:
  - `GET /status` - Database status and metrics
  - `GET /users` - Retrieve mock users
  - `POST /users` - Create new users
  - `GET /stats` - Database statistics

## Quick Start

1. **Deploy to Convox**:
   ```bash
   convox deploy
   ```

2. **Test the application**:
   - Access the frontend service via the public URL
   - Use `/test-internal` endpoint to verify internal service communication

## Internal Service Communication

Services communicate using Convox's internal DNS resolution:
```
http://<service>.<rack>-<app>.svc.cluster.local:3000
```

Example: `http://api.production-myapp.svc.cluster.local:3000`

## Environment Variables

The app automatically detects:
- `RACK` - Convox rack name
- `APP` - Application name
- `SERVICE` - Service name
- `PORT` - Service port (defaults to 3000)

## Testing Features

- **Network debugging tools** installed in all containers
- **DNS resolution testing** via nslookup endpoints
- **HTTP connectivity testing** via curl endpoints
- **Environment inspection** for troubleshooting
- **Mock data** for testing service interactions

## Use Cases

- Test internal service routing in Convox
- Verify DNS resolution between services
- Debug network connectivity issues
- Validate microservices communication patterns