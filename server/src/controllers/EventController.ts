import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Event } from '../models/Event';
import { Branch } from '../models/Branch';
import { Product } from '../models/Product';
import { EventType } from '../models/EventType';
import { User } from '../models/User';
import { UserPayload, UserRole } from '../types/auth';

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user: UserPayload;
}

export class EventController {
  private eventRepository = getRepository(Event);
  private branchRepository = getRepository(Branch);
  private productRepository = getRepository(Product);
  private eventTypeRepository = getRepository(EventType);
  private userRepository = getRepository(User);

  async all(request: Request, response: Response) {
    try {
      const events = await this.eventRepository.find({
        relations: ['branch', 'products', 'eventType', 'organizer'],
      });
      response.json(events);
    } catch (error) {
      response.status(500).json({ message: 'Error fetching events' });
    }
  }

  async one(request: Request, response: Response) {
    try {
      const event = await this.eventRepository.findOne({
        where: { id: parseInt(request.params.id) },
        relations: ['branch', 'products', 'eventType', 'organizer'],
      });

      if (!event) {
        response.status(404).json({ message: 'Event not found' });
        return;
      }

      response.json(event);
    } catch (error) {
      response.status(500).json({ message: 'Error fetching event' });
    }
  }

  async save(request: AuthenticatedRequest, response: Response) {
    try {
      const {
        title,
        description,
        location,
        startDate,
        endDate,
        branchId,
        productIds,
        eventTypeId,
        isPlanned,
        plannedBudget,
        plannedEnquiries,
        plannedOrders,
        actualBudget,
        actualEnquiries,
        actualOrders,
      } = request.body;

      // Validate required fields
      if (!title || !description || !location || !startDate || !endDate || !branchId || !productIds || !eventTypeId) {
        response.status(400).json({ message: 'Missing required fields' });
        return;
      }

      // Get related entities
      const branch = await this.branchRepository.findOne({ where: { id: branchId } });
      const products = await this.productRepository.findByIds(productIds);
      const eventType = await this.eventTypeRepository.findOne({ where: { id: eventTypeId } });
      const organizer = await this.userRepository.findOne({ where: { id: request.user.userId } });

      if (!branch || !eventType || !organizer) {
        response.status(400).json({ message: 'Invalid branch, event type, or organizer' });
        return;
      }

      const event = new Event();
      event.title = title;
      event.description = description;
      event.location = location;
      event.startDate = new Date(startDate);
      event.endDate = new Date(endDate);
      event.branch = branch;
      event.products = products;
      event.eventType = eventType;
      event.organizer = organizer;
      event.isPlanned = isPlanned;
      event.plannedBudget = plannedBudget;
      event.plannedEnquiries = plannedEnquiries;
      event.plannedOrders = plannedOrders;
      event.actualBudget = actualBudget;
      event.actualEnquiries = actualEnquiries;
      event.actualOrders = actualOrders;

      await this.eventRepository.save(event);
      response.json(event);
    } catch (error) {
      response.status(500).json({ message: 'Error creating event' });
    }
  }

  async update(request: AuthenticatedRequest, response: Response) {
    try {
      const event = await this.eventRepository.findOne({
        where: { id: parseInt(request.params.id) },
        relations: ['branch', 'products', 'eventType', 'organizer'],
      });

      if (!event) {
        response.status(404).json({ message: 'Event not found' });
        return;
      }

      const {
        title,
        description,
        location,
        startDate,
        endDate,
        branchId,
        productIds,
        eventTypeId,
        isPlanned,
        plannedBudget,
        plannedEnquiries,
        plannedOrders,
        actualBudget,
        actualEnquiries,
        actualOrders,
      } = request.body;

      // Get related entities
      const branch = await this.branchRepository.findOne({ where: { id: branchId } });
      const products = await this.productRepository.findByIds(productIds);
      const eventType = await this.eventTypeRepository.findOne({ where: { id: eventTypeId } });

      if (!branch || !eventType) {
        response.status(400).json({ message: 'Invalid branch or event type' });
        return;
      }

      event.title = title;
      event.description = description;
      event.location = location;
      event.startDate = new Date(startDate);
      event.endDate = new Date(endDate);
      event.branch = branch;
      event.products = products;
      event.eventType = eventType;
      event.isPlanned = isPlanned;
      event.plannedBudget = plannedBudget;
      event.plannedEnquiries = plannedEnquiries;
      event.plannedOrders = plannedOrders;
      event.actualBudget = actualBudget;
      event.actualEnquiries = actualEnquiries;
      event.actualOrders = actualOrders;

      await this.eventRepository.save(event);
      response.json(event);
    } catch (error) {
      response.status(500).json({ message: 'Error updating event' });
    }
  }

  async remove(request: Request, response: Response) {
    try {
      const event = await this.eventRepository.findOne({
        where: { id: parseInt(request.params.id) },
      });

      if (!event) {
        response.status(404).json({ message: 'Event not found' });
        return;
      }

      await this.eventRepository.remove(event);
      response.json({ message: 'Event deleted successfully' });
    } catch (error) {
      response.status(500).json({ message: 'Error deleting event' });
    }
  }
} 