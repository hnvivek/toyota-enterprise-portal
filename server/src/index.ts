import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { AppDataSource } from './config/database';
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import userRoutes from './routes/users';
import branchRoutes from './routes/branches';
import productRoutes from './routes/products';
import eventTypeRoutes from './routes/eventTypes';
import dashboardRoutes from './routes/dashboard';
import notificationRoutes from './routes/notifications';
import statsRoutes from './routes/stats';

dotenv.config();

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: true, // Allow all origins in production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', req.method === 'POST' && req.path.includes('login') 
      ? { email: req.body.email, password: '***' } 
      : req.body);
  }
  next();
});

app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: AppDataSource.isInitialized ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/products', productRoutes);
app.use('/api/event-types', eventTypeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);

// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
  
  // Handle React routing - send all non-API requests to index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, '../public', 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
}

const PORT = process.env.PORT || 8080;

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully');
    
    // Start server after database connection is established
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.error('Error connecting to database:', error);
  }); 