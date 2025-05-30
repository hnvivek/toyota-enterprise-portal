import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { UserRole, UserPayload } from '../types/auth';
import { AppDataSource } from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as UserPayload;
    req.user = decoded;

    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'You do not have permission to perform this action',
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(401).json({ error: 'Please authenticate' });
    }
  };
}; 

export { authMiddleware as auth };