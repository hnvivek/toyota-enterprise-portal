import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Event } from '../models/Event';
import { Branch } from '../models/Branch';
import { EventType } from '../models/EventType';
import { EventAttachment } from '../models/EventAttachment';
import { auth } from '../middleware/auth';
import { uploadAttachments, handleUploadError } from '../middleware/upload';
import { MoreThan, Between, Like, In } from 'typeorm';
import { Product } from '../models/Product';
import { User } from '../models/User';
import fs from 'fs';
import path from 'path';
import { EventComment } from '../models/EventComment';
import { notificationService } from '../services/notificationService';
import { NotificationType } from '../models/Notification';

const router = Router();

// Get filter options for events
router.get('/filter-options', auth, async (req, res) => {
  try {
    const branchRepository = AppDataSource.getRepository(Branch);
    const eventTypeRepository = AppDataSource.getRepository(EventType);
    const eventRepository = AppDataSource.getRepository(Event);

    // Get all branches
    const branches = await branchRepository.find({
      select: ['id', 'name', 'location'],
      order: { name: 'ASC' }
    });

    // Get all event types
    const eventTypes = await eventTypeRepository.find({
      select: ['id', 'name', 'category'],
      order: { name: 'ASC' }
    });

    // Get available statuses from events
    const statusResults = await eventRepository
      .createQueryBuilder('event')
      .select('DISTINCT event.status', 'status')
      .getRawMany();
    
    const statuses = statusResults.map(r => r.status).filter(Boolean);

    // Get date range of events
    const dateRange = await eventRepository
      .createQueryBuilder('event')
      .select('MIN(event.startDate)', 'minDate')
      .addSelect('MAX(event.startDate)', 'maxDate')
      .getRawOne();

    res.json({
      branches: branches.map(b => ({
        id: b.id,
        name: b.name,
        location: b.location
      })),
      eventTypes: eventTypes.map(et => ({
        id: et.id,
        name: et.name,
        category: et.category
      })),
      statuses: statuses.map(status => ({
        value: status,
        label: status.charAt(0).toUpperCase() + status.slice(1)
      })),
      dateRange: {
        minDate: dateRange?.minDate || null,
        maxDate: dateRange?.maxDate || null
      }
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ message: 'Error fetching filter options' });
  }
});

// Get all events with filtering
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const eventRepository = AppDataSource.getRepository(Event);
    const userRepository = AppDataSource.getRepository(User);
    
    // Get user's last seen timestamp
    const user = await userRepository.findOne({ where: { id: req.user.userId } });
    const lastSeenEvents = user?.lastSeenEvents;

    const {
      page = 1,
      limit = 10,
      sortBy = 'updatedAt',
      sortOrder = 'DESC',
      status,
      branchId,
      eventTypeId,
      startDate,
      endDate,
      minBudget,
      maxBudget,
      search
    } = req.query;

    let query = eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.branch', 'branch')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .leftJoinAndSelect('event.eventType', 'eventType')
      .leftJoinAndSelect('event.products', 'products');

    // Apply filters
    if (status) {
      query = query.andWhere('event.status = :status', { status });
    }

    if (branchId) {
      query = query.andWhere('event.branchId = :branchId', { branchId: parseInt(branchId as string) });
    }

    if (eventTypeId) {
      query = query.andWhere('event.eventType.id = :eventTypeId', { eventTypeId: parseInt(eventTypeId as string) });
    }

    if (startDate) {
      query = query.andWhere('event.startDate >= :startDate', { startDate });
    }

    if (endDate) {
      query = query.andWhere('event.endDate <= :endDate', { endDate });
    }

    if (minBudget) {
      query = query.andWhere('event.budget >= :minBudget', { minBudget: parseFloat(minBudget as string) });
    }

    if (maxBudget) {
      query = query.andWhere('event.budget <= :maxBudget', { maxBudget: parseFloat(maxBudget as string) });
    }

    if (search) {
      query = query.andWhere(
        '(event.title ILIKE :search OR event.description ILIKE :search OR event.location ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Add sorting
    const validSortFields = ['title', 'startDate', 'endDate', 'budget', 'status', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'updatedAt';
    const sortDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    query = query.orderBy(`event.${sortField}`, sortDirection);

    // Get total count for pagination
    const totalCount = await query.getCount();

    // Apply pagination
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    query = query.skip(offset).take(parseInt(limit as string));

    const events = await query.getMany();

    // Add isNew flag to each event
    const eventsWithNewFlag = events.map(event => ({
      ...event,
      isNew: lastSeenEvents ? event.createdAt > lastSeenEvents : false
    }));

    const totalPages = Math.ceil(totalCount / parseInt(limit as string));

    res.json({
      events: eventsWithNewFlag,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages,
        totalCount,
        limit: parseInt(limit as string),
        hasNext: parseInt(page as string) < totalPages,
        hasPrev: parseInt(page as string) > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// Get recent events with optional branch filter
router.get('/recent', auth, async (req, res) => {
  try {
    const { branchId, limit = 5 } = req.query;
    const eventRepository = AppDataSource.getRepository(Event);
    
    let queryBuilder = eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.branch', 'branch')
      .leftJoinAndSelect('event.products', 'products')
      .where('event.isActive = :isActive', { isActive: true })
      .orderBy('event.createdAt', 'DESC')
      .take(Number(limit));

    // Apply branch filter if provided
    if (branchId && branchId !== 'all' && !isNaN(Number(branchId))) {
      queryBuilder.andWhere('event.branchId = :branchId', { branchId: Number(branchId) });
    }

    const events = await queryBuilder.getMany();
    res.json(events);
  } catch (error) {
    console.error('Error fetching recent events:', error);
    res.status(500).json({ message: 'Error fetching recent events' });
  }
});

// Create new event
router.post('/', auth, uploadAttachments, handleUploadError, async (req: Request, res: Response) => {
  try {
    const eventRepository = AppDataSource.getRepository(Event);
    const branchRepository = AppDataSource.getRepository(Branch);
    const productRepository = AppDataSource.getRepository(Product);
    const eventTypeRepository = AppDataSource.getRepository(EventType);
    const userRepository = AppDataSource.getRepository(User);
    const eventAttachmentRepository = AppDataSource.getRepository(EventAttachment);

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
    } = req.body;

    console.log('Creating event with data:', {
      title, branchId, productIds, eventTypeId
    });

    // Validate required fields
    if (!title || !description || !location || !startDate || !endDate || !branchId || !eventTypeId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get related entities
    const branch = await branchRepository.findOne({ where: { id: parseInt(branchId) } });
    const eventType = await eventTypeRepository.findOne({ where: { id: parseInt(eventTypeId) } });
    const organizer = await userRepository.findOne({ where: { id: (req as any).user.userId } });
    
    let products: Product[] = [];
    if (productIds) {
      // Handle both array and single product ID
      const productIdArray = Array.isArray(productIds) ? productIds : [productIds];
      const numericProductIds = productIdArray.map(id => parseInt(id.toString()));
      products = await productRepository.findByIds(numericProductIds);
      console.log('Found products:', products.map(p => ({ id: p.id, name: p.name })));
    }

    if (!branch || !eventType || !organizer) {
      return res.status(400).json({ message: 'Invalid branch, event type, or organizer' });
    }

    // Create and populate event
    const eventData = {
      title,
      description,
      location,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget: parseFloat(req.body.budget || '0'),
      branch,
      products,
      eventType,
      organizer,
      isPlanned: isPlanned === 'true' || isPlanned === true,
      plannedBudget: plannedBudget ? parseFloat(plannedBudget) : undefined,
      plannedEnquiries: plannedEnquiries ? parseInt(plannedEnquiries) : undefined,
      plannedOrders: plannedOrders ? parseInt(plannedOrders) : undefined,
      actualBudget: actualBudget ? parseFloat(actualBudget) : undefined,
      actualEnquiries: actualEnquiries ? parseInt(actualEnquiries) : undefined,
      actualOrders: actualOrders ? parseInt(actualOrders) : undefined,
    };

    const event = eventRepository.create(eventData);
    const savedEvent = await eventRepository.save(event);
    
    // Handle file attachments
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      console.log('Processing file attachments:', req.files.length);
      
      for (const file of req.files) {
        const attachment = eventAttachmentRepository.create({
          event: savedEvent,
          filename: file.originalname,
          fileUrl: `/uploads/${file.filename}`,
          fileType: file.mimetype,
          uploadedBy: organizer,
        });
        
        await eventAttachmentRepository.save(attachment);
        console.log('Saved attachment:', file.originalname);
      }
    }
    
    // Fetch the complete event with all relations for response
    const completeEvent = await eventRepository.findOne({
      where: { id: savedEvent.id },
      relations: ['branch', 'products', 'eventType', 'organizer', 'attachments'],
    });

    res.status(201).json(completeEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Error creating event', error: error instanceof Error ? error.message : String(error) });
  }
});

// Get pending approvals for current user
router.get('/pending-approvals', auth, async (req, res) => {
  try {
    console.log('=== PENDING APPROVALS DEBUG ===');
    console.log('Request user:', req.user);
    
    const eventRepository = AppDataSource.getRepository(Event);
    const userRepository = AppDataSource.getRepository(User);
    
    if (!req.user) {
      console.log('No req.user found');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log('Fetching user with ID:', req.user.userId);
    
    // Fetch full user data including branch
    const user = await userRepository.findOne({
      where: { id: req.user.userId },
      relations: ['branch']
    });

    console.log('Fetched user:', user);

    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User role:', user.role);
    console.log('User branch:', user.branch);

    let queryBuilder = eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.branch', 'branch')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .leftJoinAndSelect('event.products', 'products')
      .leftJoinAndSelect('event.eventType', 'eventType')
      .orderBy('event.createdAt', 'DESC');

    // Filter based on user role and branch
    if (user.role === 'general_manager') {
      console.log('User is general_manager');
      // GMs see events pending their approval from their branch only
      if (!user.branch) {
        console.log('GM has no branch assigned');
        return res.json([]); // No branch assigned, no events to approve
      }
      console.log('Filtering for branch ID:', user.branch.id);
      queryBuilder
        .where('event.status = :status', { status: 'pending_gm' })
        .andWhere('event.branchId = :branchId', { branchId: user.branch.id });
    } else if (user.role === 'marketing_head') {
      console.log('User is marketing_head');
      // Marketing heads see events pending their final approval from all branches
      queryBuilder.where('event.status = :status', { status: 'pending_marketing' });
    } else {
      console.log('User role does not have pending approvals:', user.role);
      // Other roles don't have pending approvals
      return res.json([]);
    }

    console.log('Executing query...');
    const events = await queryBuilder.getMany();
    console.log('Found events:', events.length);

    res.json(events);
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ message: 'Error fetching pending approvals' });
  }
});

// Get event by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const eventRepository = AppDataSource.getRepository(Event);
    const eventId = parseInt(req.params.id);
    
    console.log(`Fetching event ${eventId} with relations...`);
    
    const event = await eventRepository.findOne({
      where: { id: eventId },
      relations: ['branch', 'products', 'eventType', 'organizer', 'attachments', 'budgetAllocations', 'comments', 'comments.commentedBy']
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    console.log(`Event ${eventId} found:`, {
      id: event.id,
      title: event.title,
      productsCount: event.products?.length || 0,
      products: event.products?.map(p => ({ id: p.id, name: p.name })) || []
    });
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Error fetching event' });
  }
});

// Update event
router.put('/:id', auth, uploadAttachments, handleUploadError, async (req: Request, res: Response) => {
  try {
    const eventRepository = AppDataSource.getRepository(Event);
    const userRepository = AppDataSource.getRepository(User);
    const branchRepository = AppDataSource.getRepository(Branch);
    const productRepository = AppDataSource.getRepository(Product);
    const eventTypeRepository = AppDataSource.getRepository(EventType);
    const eventAttachmentRepository = AppDataSource.getRepository(EventAttachment);

    const userId = (req as any).user.userId;
    const currentUser = await userRepository.findOne({ 
      where: { id: userId },
      relations: ['branch']
    });
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const event = await eventRepository.findOne({
      where: { id: parseInt(req.params.id) },
      relations: ['branch', 'products', 'eventType', 'organizer'],
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check permissions
    const canEdit = checkEditPermissions(event, currentUser);
    if (!canEdit.allowed) {
      return res.status(403).json({ message: canEdit.message });
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
    } = req.body;

    // Check if this is a metrics-only update (only actual metrics fields are provided)
    const isMetricsOnlyUpdate = !title && !description && !location && !startDate && !endDate && 
                                !branchId && !eventTypeId && !productIds &&
                                (actualBudget !== undefined || actualEnquiries !== undefined || actualOrders !== undefined);

    console.log('Update type:', isMetricsOnlyUpdate ? 'Metrics-only' : 'Full event update');
    console.log('Request body:', req.body);

    if (isMetricsOnlyUpdate) {
      // Handle metrics-only update
      console.log('Processing metrics-only update for event:', event.id);
      
      // Only update actual metric fields if values are provided
      if (actualBudget !== undefined) {
        event.actualBudget = actualBudget ? parseFloat(actualBudget.toString()) : null;
      }
      if (actualEnquiries !== undefined) {
        event.actualEnquiries = actualEnquiries ? parseInt(actualEnquiries.toString()) : null;
      }
      if (actualOrders !== undefined) {
        event.actualOrders = actualOrders ? parseInt(actualOrders.toString()) : null;
      }

      const savedEvent = await eventRepository.save(event);
      
      // Fetch the complete updated event with all relations for response
      const completeEvent = await eventRepository.findOne({
        where: { id: savedEvent.id },
        relations: ['branch', 'products', 'eventType', 'organizer', 'attachments'],
      });

      console.log('Metrics-only update completed successfully');
      res.json(completeEvent);
      return;
    }

    // Handle full event update (original logic)
    console.log('Processing full event update with data:', {
      title, branchId, productIds, eventTypeId
    });

    // Get related entities with proper parsing
    const branch = await branchRepository.findOne({ where: { id: parseInt(branchId) } });
    const eventType = await eventTypeRepository.findOne({ where: { id: parseInt(eventTypeId) } });
    const organizer = await userRepository.findOne({ where: { id: (req as any).user.userId } });
    
    let products: Product[] = [];
    if (productIds) {
      // Handle both array and single product ID
      const productIdArray = Array.isArray(productIds) ? productIds : [productIds];
      const numericProductIds = productIdArray.map(id => parseInt(id.toString()));
      products = await productRepository.findByIds(numericProductIds);
      console.log('Found products for update:', products.map(p => ({ id: p.id, name: p.name })));
    }

    if (!branch || !eventType) {
      return res.status(400).json({ message: 'Invalid branch or event type' });
    }

    // Update event properties
    event.title = title;
    event.description = description;
    event.location = location;
    event.startDate = new Date(startDate);
    event.endDate = new Date(endDate);
    event.budget = parseFloat(req.body.budget || event.budget.toString());
    event.branch = branch;
    event.products = products;
    event.eventType = eventType;
    event.isPlanned = isPlanned === 'true' || isPlanned === true;
    
    // Only update metric fields if values are provided
    if (plannedBudget) event.plannedBudget = parseFloat(plannedBudget);
    if (plannedEnquiries) event.plannedEnquiries = parseInt(plannedEnquiries);
    if (plannedOrders) event.plannedOrders = parseInt(plannedOrders);
    if (actualBudget !== undefined) event.actualBudget = actualBudget ? parseFloat(actualBudget.toString()) : null;
    if (actualEnquiries !== undefined) event.actualEnquiries = actualEnquiries ? parseInt(actualEnquiries.toString()) : null;
    if (actualOrders !== undefined) event.actualOrders = actualOrders ? parseInt(actualOrders.toString()) : null;

    const savedEvent = await eventRepository.save(event);
    
    // Handle file attachments
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      console.log('Processing file attachments for update:', req.files.length);
      
      for (const file of req.files) {
        const attachment = eventAttachmentRepository.create({
          event: savedEvent,
          filename: file.originalname,
          fileUrl: `/uploads/${file.filename}`,
          fileType: file.mimetype,
          uploadedBy: organizer!,
        });
        
        await eventAttachmentRepository.save(attachment);
        console.log('Saved attachment for update:', file.originalname);
      }
    }
    
    // Fetch the complete updated event with all relations for response
    const completeEvent = await eventRepository.findOne({
      where: { id: savedEvent.id },
      relations: ['branch', 'products', 'eventType', 'organizer', 'attachments'],
    });

    res.json(completeEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Error updating event', error: error instanceof Error ? error.message : String(error) });
  }
});

// Update event status
router.patch('/:id/status', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    const userId = (req as any).user.userId;

    // Validate status
    const validStatuses = ['draft', 'pending_gm', 'pending_marketing', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const eventRepository = AppDataSource.getRepository(Event);
    const userRepository = AppDataSource.getRepository(User);
    const commentRepository = AppDataSource.getRepository(EventComment);
    
    const event = await eventRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['organizer']
    });

    const currentUser = await userRepository.findOne({
      where: { id: userId },
      relations: ['branch']
    });

    if (!event || !currentUser) {
      return res.status(404).json({ error: 'Event or user not found' });
    }

    // Special validation for completion: check that actual values are provided
    if (status === 'completed') {
      const missingValues = [];
      
      if (!event.actualBudget || event.actualBudget <= 0) {
        missingValues.push('Actual Cost');
      }
      if (event.actualEnquiries === null || event.actualEnquiries === undefined) {
        missingValues.push('Actual Leads');
      }
      if (event.actualOrders === null || event.actualOrders === undefined) {
        missingValues.push('Actual Orders');
      }
      
      if (missingValues.length > 0) {
        return res.status(400).json({ 
          error: `Cannot mark event as completed. Missing actual values: ${missingValues.join(', ')}. Please update the event with actual results first.` 
        });
      }
    }

    // Validate workflow permissions
    const canTransition = validateStatusTransition(event.status, status, currentUser.role, event.organizer.id === userId);
    
    if (!canTransition.allowed) {
      return res.status(403).json({ error: canTransition.message });
    }

    // Update the status
    const oldStatus = event.status;
    event.status = status;
    await eventRepository.save(event);

    // Add comment if provided
    if (comment && comment.trim()) {
      const eventComment = commentRepository.create({
        event,
        comment: comment.trim(),
        commentedBy: currentUser,
        commentType: getCommentType(status),
        statusFrom: oldStatus,
        statusTo: status
      });
      await commentRepository.save(eventComment);
    }

    // CREATE NOTIFICATIONS FOR STATUS CHANGES
    try {
      await createStatusChangeNotifications(event, oldStatus, status, currentUser, comment);
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Don't fail the status update if notifications fail
    }

    console.log(`Event ${id} status updated from ${oldStatus} to ${status} by user ${userId}`);
    res.json({ 
      message: 'Event status updated successfully', 
      status,
      previousStatus: oldStatus
    });
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
});

// Helper function to validate status transitions based on user roles
function validateStatusTransition(currentStatus: string, newStatus: string, userRole: string, isCreator: boolean) {
  const transitions: Record<string, { allowedRoles: string[], message: string }> = {
    'draft->pending_gm': {
      allowedRoles: ['sales_manager', 'admin'],
      message: 'Only the event creator (Sales Manager) can submit for GM approval'
    },
    'draft->pending_marketing': {
      allowedRoles: ['general_manager', 'admin'],
      message: 'General Manager can submit their own events directly to Marketing Head'
    },
    'pending_gm->pending_marketing': {
      allowedRoles: ['general_manager', 'admin'],
      message: 'Only General Manager can approve and forward to Marketing Head'
    },
    'pending_gm->rejected': {
      allowedRoles: ['general_manager', 'admin'],
      message: 'Only General Manager can reject events'
    },
    'pending_gm->draft': {
      allowedRoles: ['general_manager', 'admin'],
      message: 'Only General Manager can send back to draft'
    },
    'pending_marketing->approved': {
      allowedRoles: ['marketing_head', 'admin'],
      message: 'Only Marketing Head can give final approval'
    },
    'pending_marketing->rejected': {
      allowedRoles: ['marketing_head', 'admin'],
      message: 'Only Marketing Head can reject events'
    },
    'pending_marketing->pending_gm': {
      allowedRoles: ['marketing_head', 'admin'],
      message: 'Only Marketing Head can send back to GM'
    },
    'approved->completed': {
      allowedRoles: ['sales_manager', 'general_manager', 'marketing_head', 'marketing_manager', 'admin'],
      message: 'Event can be marked complete by authorized users'
    },
    'rejected->draft': {
      allowedRoles: ['sales_manager', 'general_manager', 'admin'],
      message: 'Event creator can revise rejected events'
    }
  };

  const key = `${currentStatus}->${newStatus}`;
  const rule = transitions[key];

  if (!rule) {
    return { allowed: false, message: 'Invalid status transition' };
  }

  // Special check for creator permissions
  if ((currentStatus === 'draft' || currentStatus === 'rejected') && !isCreator && userRole !== 'admin') {
    return { allowed: false, message: 'Only the event creator can submit their own events' };
  }

  const hasPermission = rule.allowedRoles.includes(userRole);
  return {
    allowed: hasPermission,
    message: hasPermission ? 'Transition allowed' : rule.message
  };
}

// Helper function to determine comment type based on status
function getCommentType(status: string): 'feedback' | 'approval' | 'rejection' | 'general' {
  switch (status) {
    case 'approved':
    case 'pending_marketing':
      return 'approval';
    case 'rejected':
      return 'rejection';
    case 'draft':
      return 'feedback';
    default:
      return 'general';
  }
}

// Helper function to check edit permissions
function checkEditPermissions(event: Event, user: User) {
  console.log('=== EDIT PERMISSIONS DEBUG ===');
  console.log('User:', { id: user.id, role: user.role, branch: user.branch });
  console.log('Event:', { id: event.id, title: event.title, branch: event.branch, status: event.status });
  
  // Admin can always edit
  if (user.role === 'admin') {
    return { allowed: true, message: 'Admin access' };
  }

  const status = event.status.toLowerCase();
  const isCreator = event.organizer.id === user.id;
  const isSameBranch = user.branch?.id === event.branch.id;
  
  console.log('Permission checks:', { 
    status, 
    isCreator, 
    isSameBranch,
    userBranchId: user.branch?.id,
    eventBranchId: event.branch.id
  });

  // Sales Manager permissions
  if (user.role === 'sales_manager') {
    if (!isCreator) {
      return { allowed: false, message: 'Sales managers can only edit events they created' };
    }
    
    // Can edit own events until GM approves (draft, pending_gm)
    if (status === 'draft' || status === 'rejected') {
      return { allowed: true, message: 'Creator can edit in draft/rejected status' };
    } else if (status === 'pending_gm') {
      return { allowed: true, message: 'Creator can edit while pending GM approval (limited changes)' };
    } else {
      return { allowed: false, message: 'Events cannot be edited after GM approval' };
    }
  }

  // General Manager permissions
  if (user.role === 'general_manager') {
    console.log('GM permission check - user branch:', user.branch, 'event branch:', event.branch);
    if (!user.branch) {
      return { allowed: false, message: 'GM has no branch assigned. Please contact admin.' };
    }
    if (!isSameBranch) {
      return { allowed: false, message: `GMs can only edit events from their branch. Your branch: ${user.branch.name}, Event branch: ${event.branch.name}` };
    }
    
    // Can edit any event in their branch while pending their approval
    if (status === 'draft' || status === 'pending_gm') {
      return { allowed: true, message: 'GM can edit events in their branch pending approval' };
    } else {
      return { allowed: false, message: 'Events cannot be edited after GM approval' };
    }
  }

  // Marketing Head permissions
  if (user.role === 'marketing_head') {
    // Can edit any event pending their approval
    if (status === 'pending_marketing') {
      return { allowed: true, message: 'Marketing Head can edit events pending final approval' };
    } else {
      return { allowed: false, message: 'Marketing Head can only edit events pending their approval' };
    }
  }

  // Marketing Manager can edit metrics after approval
  if (user.role === 'marketing_manager') {
    if (status === 'approved' || status === 'completed') {
      return { allowed: true, message: 'Marketing Manager can edit post-event metrics' };
    } else {
      return { allowed: false, message: 'Marketing Manager can only edit metrics after approval' };
    }
  }

  return { allowed: false, message: 'You do not have permission to edit this event' };
}

// Helper function to check delete permissions
function checkDeletePermissions(event: Event, user: User) {
  // Admin can always delete
  if (user.role === 'admin') {
    return { allowed: true, message: 'Admin access' };
  }

  const status = event.status.toLowerCase();
  const isCreator = event.organizer.id === user.id;
  const isSameBranch = user.branch?.id === event.branch.id;

  // Only allow deletion in early stages
  if (status === 'approved' || status === 'completed') {
    return { allowed: false, message: 'Cannot delete approved or completed events' };
  }

  // Sales Manager can delete own events until GM approval
  if (user.role === 'sales_manager' && isCreator) {
    if (status === 'draft' || status === 'rejected') {
      return { allowed: true, message: 'Creator can delete in draft/rejected status' };
    } else {
      return { allowed: false, message: 'Cannot delete events after submission to GM' };
    }
  }

  // General Manager can delete events in their branch (with restrictions)
  if (user.role === 'general_manager' && isSameBranch) {
    if (status === 'draft' || status === 'pending_gm' || status === 'rejected') {
      return { allowed: true, message: 'GM can delete events in their branch before final approval' };
    }
  }

  // Marketing Head can delete events pending their approval
  if (user.role === 'marketing_head') {
    if (status === 'pending_marketing') {
      return { allowed: true, message: 'Marketing Head can delete events pending their approval' };
    }
  }

  return { allowed: false, message: 'You do not have permission to delete this event' };
}

// Delete event attachments
router.delete('/:id/attachments', auth, async (req, res) => {
  try {
    const eventAttachmentRepository = AppDataSource.getRepository(EventAttachment);
    const { attachmentIds } = req.body;

    if (!attachmentIds || !Array.isArray(attachmentIds)) {
      return res.status(400).json({ message: 'Invalid attachment IDs' });
    }

    console.log('Deleting attachments:', attachmentIds);

    // Find attachments to delete
    const attachmentsToDelete = await eventAttachmentRepository.findByIds(attachmentIds);

    if (attachmentsToDelete.length === 0) {
      return res.status(404).json({ message: 'No attachments found to delete' });
    }

    // Delete attachment records from database
    await eventAttachmentRepository.remove(attachmentsToDelete);

    // Delete actual files from disk
    for (const attachment of attachmentsToDelete) {
      try {
        // Convert fileUrl (/uploads/filename) to actual file path
        const fileName = attachment.fileUrl.replace('/uploads/', '');
        const filePath = path.join(__dirname, '../../uploads', fileName);
        
        // Check if file exists before trying to delete
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Successfully deleted file: ${attachment.fileUrl}`);
        } else {
          console.log(`File not found (already deleted?): ${attachment.fileUrl}`);
        }
      } catch (fileError) {
        console.error(`Error deleting file ${attachment.fileUrl}:`, fileError);
        // Continue with other files even if one fails
      }
    }

    res.json({ message: 'Attachments deleted successfully', deletedCount: attachmentsToDelete.length });
  } catch (error) {
    console.error('Error deleting attachments:', error);
    res.status(500).json({ message: 'Error deleting attachments' });
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const eventRepository = AppDataSource.getRepository(Event);
    const userRepository = AppDataSource.getRepository(User);
    const eventAttachmentRepository = AppDataSource.getRepository(EventAttachment);
    
    const userId = (req as any).user.userId;
    const currentUser = await userRepository.findOne({ 
      where: { id: userId },
      relations: ['branch']
    });
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find event with attachments
    const event = await eventRepository.findOne({
      where: { id: parseInt(req.params.id) },
      relations: ['attachments', 'organizer', 'branch']
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check delete permissions
    const canDelete = checkDeletePermissions(event, currentUser);
    if (!canDelete.allowed) {
      return res.status(403).json({ message: canDelete.message });
    }
    
    // Delete all attachment files first
    if (event.attachments && event.attachments.length > 0) {
      console.log(`Deleting ${event.attachments.length} attachments for event ${event.id}`);
      
      for (const attachment of event.attachments) {
        try {
          // Convert fileUrl (/uploads/filename) to actual file path
          const fileName = attachment.fileUrl.replace('/uploads/', '');
          const filePath = path.join(__dirname, '../../uploads', fileName);
          
          // Check if file exists before trying to delete
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Successfully deleted file: ${attachment.fileUrl}`);
          }
        } catch (fileError) {
          console.error(`Error deleting file ${attachment.fileUrl}:`, fileError);
          // Continue with other files even if one fails
        }
      }
    }
    
    // Delete the event (this will cascade delete attachments due to foreign key)
    await eventRepository.remove(event);
    res.json({ message: 'Event and all attachments deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Error deleting event' });
  }
});

// Get event comments
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const commentRepository = AppDataSource.getRepository(EventComment);
    
    const comments = await commentRepository.find({
      where: { event: { id: eventId } },
      relations: ['commentedBy'],
      order: { createdAt: 'ASC' }
    });
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching event comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add comment to event
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const { comment } = req.body;
    const userId = (req as any).user.userId;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const eventRepository = AppDataSource.getRepository(Event);
    const userRepository = AppDataSource.getRepository(User);
    const commentRepository = AppDataSource.getRepository(EventComment);

    const event = await eventRepository.findOne({ where: { id: eventId } });
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!event || !user) {
      return res.status(404).json({ error: 'Event or user not found' });
    }

    const newComment = commentRepository.create({
      event,
      comment: comment.trim(),
      commentedBy: user,
      commentType: 'general'
    });

    const savedComment = await commentRepository.save(newComment);
    
    // Return comment with user details
    const commentWithUser = await commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['commentedBy']
    });

    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Demo endpoint to test new event highlighting
router.post('/demo/create-new-event', auth, async (req: Request, res: Response) => {
  try {
    const eventRepository = AppDataSource.getRepository(Event);
    const branchRepository = AppDataSource.getRepository(Branch);
    const eventTypeRepository = AppDataSource.getRepository(EventType);
    const userRepository = AppDataSource.getRepository(User);

    // Get the first available branch and event type for demo
    const branch = await branchRepository.findOne({ where: {} });
    const eventType = await eventTypeRepository.findOne({ where: {} });
    const organizer = await userRepository.findOne({ where: { id: (req as any).user.userId } });

    if (!branch || !eventType || !organizer) {
      return res.status(400).json({ message: 'Demo setup incomplete - missing branch, event type, or organizer' });
    }

    // Create a demo event with current timestamp (guaranteed to be "new")
    const demoEvent = eventRepository.create({
      title: `🆕 Demo New Event - ${new Date().toLocaleTimeString()}`,
      description: 'This is a demo event created to show the new event highlighting feature. It should appear with blue background and NEW badge.',
      location: 'Demo Location',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
      budget: 50000,
      branch,
      eventType,
      organizer,
      products: [],
      isPlanned: true,
      plannedBudget: 50000,
      plannedEnquiries: 10,
      plannedOrders: 5,
    });

    const savedEvent = await eventRepository.save(demoEvent);

    res.status(201).json({
      message: 'Demo event created successfully! Refresh the Events page to see the highlighting.',
      event: savedEvent
    });
  } catch (error) {
    console.error('Error creating demo event:', error);
    res.status(500).json({ message: 'Error creating demo event' });
  }
});

// Demo endpoint to reset user's lastSeenEvents to simulate being away
router.post('/demo/reset-last-seen', auth, async (req: Request, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: (req as any).user.userId } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set lastSeenEvents to 1 hour ago to make existing events appear "new"
    user.lastSeenEvents = new Date(Date.now() - 60 * 60 * 1000);
    await userRepository.save(user);

    res.json({
      message: 'lastSeenEvents reset to 1 hour ago. Refresh Events page to see existing events highlighted as new!',
      lastSeenEvents: user.lastSeenEvents
    });
  } catch (error) {
    console.error('Error resetting last seen:', error);
    res.status(500).json({ message: 'Error resetting last seen' });
  }
});

// Helper function to create notifications for status changes
async function createStatusChangeNotifications(event: Event, oldStatus: string, newStatus: string, actor: User, comment?: string) {
  const eventCreatorId = event.organizer.id;
  const actorName = actor.username;
  
  // Personal Status Updates for Event Creator
  if (newStatus === 'approved') {
    await notificationService.createNotification(
      eventCreatorId,
      NotificationType.EVENT_APPROVED,
      '🎉 Event Approved!',
      `Great news! Your event "${event.title}" has been approved${comment ? ` with comment: "${comment}"` : ''}.`,
      event.id,
      'event',
      `/events/${event.id}`
    );
  } else if (newStatus === 'rejected') {
    await notificationService.createNotification(
      eventCreatorId,
      NotificationType.EVENT_REJECTED,
      '❌ Event Needs Revision',
      `Your event "${event.title}" was rejected by ${actorName}${comment ? ` with feedback: "${comment}"` : '. Please review and revise.'}.`,
      event.id,
      'event',
      `/events/${event.id}`
    );
  } else if (newStatus === 'pending_marketing' && oldStatus === 'pending_gm') {
    await notificationService.createNotification(
      eventCreatorId,
      NotificationType.EVENT_UPDATED,
      '✅ Event Progressed to Marketing Review',
      `Your event "${event.title}" was approved by GM and is now being reviewed by Marketing Head.`,
      event.id,
      'event',
      `/events/${event.id}`
    );
  } else if (newStatus === 'completed') {
    await notificationService.createNotification(
      eventCreatorId,
      NotificationType.EVENT_UPDATED,
      '🏆 Event Completed Successfully!',
      `Congratulations! Your event "${event.title}" has been marked as completed. Well done!`,
      event.id,
      'event',
      `/events/${event.id}`
    );
  } else if (newStatus === 'draft' && oldStatus === 'rejected') {
    await notificationService.createNotification(
      eventCreatorId,
      NotificationType.EVENT_UPDATED,
      '📝 Event Ready for Revision',
      `Your event "${event.title}" is back in draft mode. Please make the necessary changes and resubmit.`,
      event.id,
      'event',
      `/events/${event.id}`
    );
  }

  // Collaborative Updates - Notify when someone else makes changes
  if (actor.id !== eventCreatorId) {
    if (comment && comment.trim()) {
      await notificationService.createNotification(
        eventCreatorId,
        NotificationType.EVENT_UPDATED,
        '💬 New Comment on Your Event',
        `${actorName} added a comment to "${event.title}": "${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}"`,
        event.id,
        'event',
        `/events/${event.id}`
      );
    }
  }
}

export default router; 