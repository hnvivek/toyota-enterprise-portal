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
import { notificationService } from './services/notificationService';

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

// Scheduled notification tasks
const scheduleNotificationTasks = () => {
  // Run event reminders every day at 9 AM
  const runEventReminders = () => {
    const now = new Date();
    if (now.getHours() === 9 && now.getMinutes() === 0) {
      console.log('Running scheduled event reminders...');
      notificationService.createEventReminders().catch(error => {
        console.error('Error running event reminders:', error);
      });
    }
  };

  // Run approval reminders every 6 hours during business hours
  const runApprovalReminders = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Run at 9 AM, 1 PM, and 5 PM (business hours)
    if (minute === 0 && [9, 13, 17].includes(hour)) {
      console.log('Running scheduled approval reminders...');
      notificationService.createApprovalReminders().catch(error => {
        console.error('Error running approval reminders:', error);
      });
    }
  };

  // Run notification cleanup daily at 2 AM
  const runNotificationCleanup = () => {
    const now = new Date();
    if (now.getHours() === 2 && now.getMinutes() === 0) {
      console.log('Running scheduled notification cleanup...');
      
      // First mark old notifications for cleanup
      notificationService.markOldNotificationsForCleanup()
        .then(marked => {
          console.log(`Marked ${marked} old notifications for cleanup`);
          
          // Then perform the actual cleanup
          return notificationService.performCleanup();
        })
        .then(result => {
          console.log('Notification cleanup completed:', result);
        })
        .catch(error => {
          console.error('Error running notification cleanup:', error);
        });
    }
  };

  // Check every minute for scheduled tasks
  setInterval(() => {
    try {
      runEventReminders();
      runApprovalReminders();
      runNotificationCleanup();
    } catch (error) {
      console.error('Error in scheduled notification tasks:', error);
    }
  }, 60000); // Check every minute

  console.log('Notification scheduling system started');
  console.log('📅 Event reminders: Daily at 9:00 AM');
  console.log('⏰ Approval reminders: Every 6 hours (9 AM, 1 PM, 5 PM)');
  console.log('🧹 Notification cleanup: Daily at 2:00 AM');
};

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start notification scheduler
  scheduleNotificationTasks();
});

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((error: Error) => {
    console.error('Error connecting to database:', error);
  }); 