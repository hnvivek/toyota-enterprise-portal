import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { EventType } from '../models/EventType';
import { auth } from '../middleware/auth';

const router = Router();

// Get all event types
router.get('/', async (req, res) => {
  try {
    const eventTypeRepository = AppDataSource.getRepository(EventType);
    const eventTypes = await eventTypeRepository.find({
      order: { name: 'ASC' }
    });
    res.json(eventTypes);
  } catch (error) {
    console.error('Error fetching event types:', error);
    res.status(500).json({ message: 'Error fetching event types' });
  }
});

// Create new event type (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const eventTypeRepository = AppDataSource.getRepository(EventType);
    const { name, description, category } = req.body;

    // Validate input
    if (!name || !description || !category) {
      return res.status(400).json({ message: 'Name, description, and category are required' });
    }

    // Check if event type with same name already exists
    const existingEventType = await eventTypeRepository.findOne({ where: { name } });
    if (existingEventType) {
      return res.status(400).json({ message: 'Event type with this name already exists' });
    }

    // Create event type
    const eventType = eventTypeRepository.create({
      name,
      description,
      category
    });

    const savedEventType = await eventTypeRepository.save(eventType);
    
    res.status(201).json(savedEventType);
  } catch (error) {
    console.error('Error creating event type:', error);
    res.status(500).json({ message: 'Error creating event type' });
  }
});

// Update event type (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const eventTypeRepository = AppDataSource.getRepository(EventType);
    const eventTypeId = parseInt(req.params.id);
    const { name, description, category } = req.body;

    // Find the event type to update
    const eventType = await eventTypeRepository.findOne({
      where: { id: eventTypeId }
    });

    if (!eventType) {
      return res.status(404).json({ message: 'Event type not found' });
    }

    // Validate input
    if (!name || !description || !category) {
      return res.status(400).json({ message: 'Name, description, and category are required' });
    }

    // Check if another event type with same name exists
    const existingEventType = await eventTypeRepository.findOne({
      where: { name }
    });
    if (existingEventType && existingEventType.id !== eventTypeId) {
      return res.status(400).json({ message: 'Another event type with this name already exists' });
    }

    // Update event type fields
    eventType.name = name;
    eventType.description = description;
    eventType.category = category;

    const updatedEventType = await eventTypeRepository.save(eventType);
    
    res.json(updatedEventType);
  } catch (error) {
    console.error('Error updating event type:', error);
    res.status(500).json({ message: 'Error updating event type' });
  }
});

// Delete event type (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const eventTypeRepository = AppDataSource.getRepository(EventType);
    const eventTypeId = parseInt(req.params.id);

    const eventType = await eventTypeRepository.findOne({
      where: { id: eventTypeId }
    });

    if (!eventType) {
      return res.status(404).json({ message: 'Event type not found' });
    }

    // TODO: Add check if event type is being used by any events
    // const eventRepository = AppDataSource.getRepository(Event);
    // const eventsUsingType = await eventRepository.count({ where: { eventType: { id: eventTypeId } } });
    // if (eventsUsingType > 0) {
    //   return res.status(400).json({ 
    //     message: `Cannot delete event type. It is being used by ${eventsUsingType} event(s).` 
    //   });
    // }

    await eventTypeRepository.remove(eventType);
    res.json({ message: 'Event type deleted successfully' });
  } catch (error) {
    console.error('Error deleting event type:', error);
    res.status(500).json({ message: 'Error deleting event type' });
  }
});

export default router; 