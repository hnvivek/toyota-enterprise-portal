import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { Branch } from '../models/Branch';
import { auth } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import bcrypt from 'bcryptjs';

const router = Router();

// Get all users (admin only)
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({
      relations: ['branch'],
      select: ['id', 'username', 'email', 'role', 'region', 'createdAt', 'updatedAt']
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get user profile
router.get('/profile', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: req.user.userId },
      relations: ['branch'],
      select: ['id', 'username', 'email', 'role', 'region', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/profile', auth, async (req: Request, res: Response) => {
  try {
    console.log('PUT /profile - User from token:', req.user);
    console.log('PUT /profile - Request body:', req.body);

    if (!req.user) {
      console.log('PUT /profile - No user in request');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRepository = AppDataSource.getRepository(User);
    
    console.log('PUT /profile - Looking for user with ID:', req.user.userId);
    const user = await userRepository.findOne({
      where: { id: req.user.userId },
      relations: ['branch']
    });

    if (!user) {
      console.log('PUT /profile - User not found in database');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('PUT /profile - Found user:', { id: user.id, username: user.username, email: user.email });

    // Extract fields from request - only allow username and email for regular users
    const { username, email } = req.body;

    // Validate required fields
    if (!username || !email) {
      console.log('PUT /profile - Missing required fields:', { username, email });
      return res.status(400).json({ message: 'Username and email are required' });
    }

    // Check if email is already taken by another user
    console.log('PUT /profile - Checking for existing email:', email);
    const existingUser = await userRepository.findOne({ 
      where: { email } 
    });
    
    if (existingUser && existingUser.id !== req.user.userId) {
      console.log('PUT /profile - Email already taken by user:', existingUser.id);
      return res.status(400).json({ message: 'Email is already taken by another user' });
    }

    // Update only basic user fields
    console.log('PUT /profile - Updating user fields');
    user.username = username;
    user.email = email;
    
    await userRepository.save(user);
    console.log('PUT /profile - User saved successfully');
    
    // Return updated user with relations
    const updatedUser = await userRepository.findOne({
      where: { id: req.user.userId },
      relations: ['branch'],
      select: ['id', 'username', 'email', 'role', 'region', 'createdAt', 'updatedAt']
    });
    
    console.log('PUT /profile - Returning updated user');
    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('PUT /profile - Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Update user password
router.put('/password', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Find user with password field
    const user = await userRepository.findOne({
      where: { id: req.user.userId },
      select: ['id', 'password']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    user.password = hashedNewPassword;
    await userRepository.save(user);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
});

// Create new user (admin only)
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const branchRepository = AppDataSource.getRepository(Branch);
    const { username, email, password, role = 'user', branchId } = req.body;

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

    // Get branch if branchId is provided
    let branch = null;
    if (branchId && branchId !== '') {
      branch = await branchRepository.findOne({ where: { id: parseInt(branchId) } });
      if (!branch) {
        return res.status(400).json({ message: 'Invalid branch selected' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userData: any = {
      username,
      email,
      password: hashedPassword,
      role
    };

    if (branch) {
      userData.branch = branch;
      userData.region = branch.region; // Set user region from branch
    }

    const user = userRepository.create(userData);
    const savedUser = await userRepository.save(user);
    
    res.status(201).json({
      message: 'User created successfully',
      user: savedUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      message: 'Error creating user',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Update user (admin only)
router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const branchRepository = AppDataSource.getRepository(Branch);
    const userId = parseInt(req.params.id);
    const { username, email, role, branchId } = req.body;

    // Find the user to update
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['branch']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate input
    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email are required' });
    }

    // Check if email is already taken by another user
    const existingUser = await userRepository.findOne({ 
      where: { email } 
    });
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ message: 'Email is already taken by another user' });
    }

    // Handle branch assignment
    let branch = null;
    if (branchId && branchId !== '') {
      branch = await branchRepository.findOne({ where: { id: parseInt(branchId) } });
      if (!branch) {
        return res.status(400).json({ message: 'Invalid branch selected' });
      }
    }

    // Update user fields
    user.username = username;
    user.email = email;
    user.role = role;
    
    // Handle branch assignment (can be null)
    if (branch) {
      user.branch = branch;
      user.region = branch.region; // Set user region from branch
    } else {
      user.branch = undefined as any; // Remove branch association
      user.region = ''; // Clear region when no branch
    }

    const updatedUser = await userRepository.save(user);
    
    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      message: 'Error updating user',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const userId = parseInt(req.params.id);

    // Don't allow deleting yourself
    if (userId === req.user.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await userRepository.remove(user);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

export default router;