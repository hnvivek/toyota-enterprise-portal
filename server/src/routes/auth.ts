import { Router } from 'express';
import { User } from '../models/User';
import { UserRole } from '../types/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { auth } from '../middleware/auth';
import { seed } from '../seeds/seed';

const router = Router();

// test route
router.get('/', (req, res) => {
  res.json({ message: 'Auth routes are working!' });
});

// Manual seed endpoint (for fixing Railway deployment)
router.post('/manual-seed', async (req, res) => {
  try {
    console.log('Manual seed endpoint called');
    await seed();
    res.json({ 
      message: 'Database seeded successfully!',
      adminCredentials: {
        email: 'admin@toyota.com',
        password: 'admin123'
      }
    });
  } catch (error) {
    console.error('Manual seed error:', error);
    res.status(500).json({ 
      message: 'Error seeding database',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const { username, email, password, role = UserRole.SALES_MANAGER } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = userRepository.create({
      username,
      email,
      password: hashedPassword,
      role
    });

    const savedUser = await userRepository.save(user);

    // Generate JWT token
    const token = jwt.sign(
      { userId: savedUser.id, role: savedUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Error creating user',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt started');
    const userRepository = AppDataSource.getRepository(User);
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    console.log('Searching for user in database...');
    const user = await userRepository.findOne({ where: { email } });
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', { id: user.id, email: user.email, role: user.role });

    // Check password
    console.log('Verifying password...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Password verification failed for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Password verified successfully');

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('JWT token generated successfully');

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

    console.log('Login successful for user:', email);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Error logging in',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get current user info
router.get('/me', auth, async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const userId = (req as any).user.userId;
    
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['branch']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      branch: user.branch
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ message: 'Error fetching user information' });
  }
});

export default router;