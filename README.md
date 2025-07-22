# Toyota Enterprise Portal

This is a full-stack application with a React frontend and Node.js/Express backend, using PostgreSQL as the database.

## Prerequisites

- Node.js (Latest LTS version recommended)
- PostgreSQL 14
- npm (comes with Node.js)
- Homebrew (for macOS users)

## Port Configuration

The application uses the following ports by default:
- PostgreSQL: 5432 (default PostgreSQL port)
- Backend Server: 8080
- Frontend: 3000

## Installation

### 1. Database Setup

Install PostgreSQL:
```bash
# For macOS users
brew install postgresql@14
```

### 2. Backend Setup

Navigate to the server directory:
```bash
cd server
```

Install dependencies:
```bash
npm install
```

The `.env` file should already exist in the server directory with the following configuration:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=toyota_enterprise_portal
PORT=8080
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000
```

If the `.env` file is missing, create it with the above content.

### 3. Frontend Setup

Navigate to the frontend directory:
```bash
cd toyota-enterprise-portal
```

Install dependencies:
```bash
npm install
```

## Running the Application

### 1. Start PostgreSQL

```bash
brew services start postgresql@14
```

### 2. Create Database and User (First time only)

**Note: The database may already exist and be seeded with data. Check first:**

```bash
# Check if database exists
psql -U postgres -l | grep toyota_enterprise_portal
```

If the database doesn't exist, create it:
```bash
# Create the postgres user (if it doesn't exist)
createuser -s postgres

# Set password for postgres user (enter 'postgres' when prompted)
psql postgres
postgres=# \password postgres
postgres=# \q

# Create the database
createdb toyota_enterprise_portal
```

### 3. Start the Backend Server

In one terminal window:
```bash
cd server
npm run dev
```

The server will start on **http://localhost:8080**

### 4. Start the Frontend Application

In a new terminal window:
```bash
cd toyota-enterprise-portal
npm start
```

The frontend will start on **http://localhost:3000** and should automatically open in your browser.

## Quick Start (if everything is already set up)

If PostgreSQL is running and the database exists, you can quickly start both servers:

**Terminal 1 (Backend):**
```bash
cd server && npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd toyota-enterprise-portal && npm start
```

## Accessing the Application

- **Main Application**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Health Check**: http://localhost:8080/api (may return "Cannot GET /" which is normal)

## Stopping the Application

### 1. Stop the Frontend
Press `Ctrl + C` in the terminal where the frontend is running.

### 2. Stop the Backend
Press `Ctrl + C` in the terminal where the backend is running.

### 3. Stop PostgreSQL (Optional)
```bash
brew services stop postgresql@14
```

### 4. Kill All Node Processes (if needed)
If any Node.js processes are still running:
```bash
pkill -f "node|ts-node"
```

## Troubleshooting

### Port Already in Use
If you see "address already in use" error:
1. Find the process using the port:
```bash
lsof -i :8080  # For backend port
lsof -i :3000  # For frontend port
```

2. Kill the process:
```bash
kill <PID>
```

### Database Connection Issues
1. Check if PostgreSQL is running:
```bash
brew services list | grep postgresql
```

2. Verify database connection:
```bash
psql -U postgres -d toyota_enterprise_portal
```

3. If you get authentication errors, ensure the postgres user exists and has the right password:
```bash
psql postgres
postgres=# \password postgres
```

### Backend Issues
- Check that the `.env` file exists in the `server` directory
- Ensure the database name in `.env` matches the actual database name
- Verify the backend is compiled: `cd server && npm run build`

### Frontend Issues  
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check if the backend is running and accessible at http://localhost:8080

## Project Structure

```
toyota-app/
├── server/                 # Backend (Node.js/Express/TypeScript)
│   ├── src/
│   │   ├── config/        # Database and other configurations
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Auth and other middleware
│   │   └── index.ts       # Entry point
│   ├── .env              # Environment variables
│   └── package.json
│
└── toyota-enterprise-portal/  # Frontend (React/TypeScript)
    ├── src/
    │   ├── components/    # React components
    │   ├── pages/         # Page components
    │   ├── services/      # API services
    │   └── App.tsx       # Main App component
    └── package.json
```

## Development Notes

- The backend uses TypeScript and runs with `ts-node-dev` for hot reloading
- The frontend is a Create React App with TypeScript
- Database migrations and seeding happen automatically on startup
- JWT authentication is configured for user sessions
- The application includes user management, event management, and dashboard features 