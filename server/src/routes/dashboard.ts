import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Event } from '../models/Event';
import { User } from '../models/User';
import { Branch } from '../models/Branch';
import { auth } from '../middleware/auth';
import { MoreThanOrEqual } from 'typeorm';
import { DashboardController } from '../controllers/DashboardController';

const router = Router();
const dashboardController = new DashboardController();

// Get dashboard summary - Use DashboardController method with filtering
router.get('/summary', auth, (req, res) => dashboardController.summary(req, res));

// Debug endpoint
router.get('/debug', auth, (req, res) => dashboardController.debug(req, res));

// Recent events endpoint
router.get('/recent-events', auth, (req, res) => dashboardController.recentEvents(req, res));

export default router; 