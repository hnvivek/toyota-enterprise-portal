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
- Backend Server: 5000
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

Create a `.env` file in the server directory:
```bash
DB_HOST=localhost
DB_PORT=5432  # PostgreSQL default port
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=toyota_events
PORT=8080     # Backend server port
```

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

```bash
# Create the postgres user
createuser -s postgres

# Set password for postgres user (enter 'postgres' when prompted)
psql postgres
postgres=# \password postgres
postgres=# \q

# Create the database
createdb toyota_events
```

### 3. Start the Backend Server

```bash
cd server
npm run dev
```

The server will start on http://localhost:5000

### 4. Start the Frontend Application

In a new terminal:
```bash
cd toyota-enterprise-portal
npm start
```

The frontend will start on http://localhost:3000

## Stopping the Application

### 1. Stop the Frontend
Press `Ctrl + C` in the terminal where the frontend is running.

### 2. Stop the Backend
Press `Ctrl + C` in the terminal where the backend is running.

### 3. Stop PostgreSQL
```bash
brew services stop postgresql@14
```

### 4. (Optional) Kill All Node Processes
If any Node.js processes are still running:
```bash
pkill -f "node|ts-node"
```

## Troubleshooting

### Port Already in Use
If you see "address already in use" error:
1. Find the process using the port:
```bash
lsof -i :5000  # For backend port
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
psql -U postgres -d toyota_events
```

## Project Structure

```
toyota-app/
├── server/                 # Backend
│   ├── src/
│   │   ├── config/        # Database and other configurations
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   └── index.ts       # Entry point
│   └── package.json
│
└── toyota-enterprise-portal/  # Frontend
    ├── src/
    │   ├── components/    # React components
    │   ├── routes/        # Frontend routes
    │   └── App.tsx       # Main App component
    └── package.json
``` 