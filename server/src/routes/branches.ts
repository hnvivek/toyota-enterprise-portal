import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Branch } from '../models/Branch';
import { auth } from '../middleware/auth';

const router = Router();

// Get all branches
router.get('/', auth, async (req, res) => {
  try {
    const branchRepository = AppDataSource.getRepository(Branch);
    const branches = await branchRepository.find();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching branches', error });
  }
});

// Get branch by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const branchRepository = AppDataSource.getRepository(Branch);
    const branch = await branchRepository.findOne({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    
    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching branch', error });
  }
});

// Create branch
router.post('/', auth, async (req, res) => {
  try {
    const branchRepository = AppDataSource.getRepository(Branch);
    const branch = branchRepository.create(req.body);
    await branchRepository.save(branch);
    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ message: 'Error creating branch', error });
  }
});

// Update branch
router.put('/:id', auth, async (req, res) => {
  try {
    const branchRepository = AppDataSource.getRepository(Branch);
    const branch = await branchRepository.findOne({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    
    branchRepository.merge(branch, req.body);
    const result = await branchRepository.save(branch);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error updating branch', error });
  }
});

// Delete branch
router.delete('/:id', auth, async (req, res) => {
  try {
    const branchRepository = AppDataSource.getRepository(Branch);
    const branch = await branchRepository.findOne({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    
    await branchRepository.remove(branch);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting branch', error });
  }
});

export default router; 