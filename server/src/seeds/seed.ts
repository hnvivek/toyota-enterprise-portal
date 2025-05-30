import { AppDataSource } from '../config/database';
import { Branch } from '../models/Branch';
import { Product } from '../models/Product';
import { EventType } from '../models/EventType';
import { User } from '../models/User';
import { UserRole } from '../types/auth';
import bcrypt from 'bcryptjs';
import { Event } from '../models/Event';

const branches = [
  {
    name: 'Digital',
    location: 'Online',
    region: 'Digital Marketing'
  },
  {
    name: 'Hosur road',
    location: 'Hosur Road',
    region: 'Bangalore South'
  },
  {
    name: 'Whitefield',
    location: 'Whitefield',
    region: 'Bangalore East'
  },
  {
    name: 'KP Road',
    location: 'Kanakapura Road',
    region: 'Bangalore South'
  },
  {
    name: 'Qns road',
    location: 'Queens Road',
    region: 'Bangalore Central'
  }
];

const products = [
  {
    name: 'Glanza',
    description: 'Toyota Glanza - Premium Hatchback',
    price: 800000.00,
    category: 'Hatchback'
  },
  {
    name: 'Urban Cruiser Hyryder',
    description: 'Toyota Urban Cruiser Hyryder - Mid-Size SUV',
    price: 1500000.00,
    category: 'SUV'
  },
  {
    name: 'Taisor',
    description: 'Toyota Taisor - Compact SUV',
    price: 1000000.00,
    category: 'SUV'
  },
  {
    name: 'Rumion',
    description: 'Toyota Rumion - Premium MPV',
    price: 1200000.00,
    category: 'MPV'
  },
  {
    name: 'Fortuner',
    description: 'Toyota Fortuner - Luxury SUV',
    price: 3500000.00,
    category: 'SUV'
  },
  {
    name: 'Crysta',
    description: 'Toyota Innova Crysta - Premium MPV',
    price: 2500000.00,
    category: 'MPV'
  }
];

const eventTypes = [
  {
    name: 'Digital Lead Generation',
    description: 'Social media and digital marketing campaigns for lead generation',
    category: 'Digital'
  },
  {
    name: 'Bank Display',
    description: 'Vehicle display events at bank premises',
    category: 'Event'
  },
  {
    name: 'Exchange Mela',
    description: 'Vehicle exchange and promotional events',
    category: 'Event'
  },
  {
    name: 'Touch & Try',
    description: 'Test drive and vehicle experience events',
    category: 'Event'
  },
  {
    name: 'Halli Habba',
    description: 'Rural market focused events and promotions',
    category: 'Event'
  },
  {
    name: 'Showroom Exchange Mela',
    description: 'Exchange offers and promotions at showroom',
    category: 'Event'
  },
  {
    name: 'CSD Event',
    description: 'Events focused on defense personnel through CSD',
    category: 'Event'
  },
  {
    name: 'Government Office',
    description: 'Events and displays at government offices',
    category: 'Event'
  },
  {
    name: 'Fleet Event',
    description: 'Events focused on fleet and business customers',
    category: 'Event'
  }
];

async function dropAllData() {
  try {
    console.log('Dropping all existing data...');
    
    // Drop in reverse order of dependencies
    await AppDataSource.createQueryBuilder()
      .delete()
      .from(Event)
      .execute();
    console.log('Dropped all events');
    
    await AppDataSource.createQueryBuilder()
      .delete()
      .from(Product)
      .execute();
    console.log('Dropped all products');
    
    await AppDataSource.createQueryBuilder()
      .delete()
      .from(EventType)
      .execute();
    console.log('Dropped all event types');
    
    await AppDataSource.createQueryBuilder()
      .delete()
      .from(Branch)
      .execute();
    console.log('Dropped all branches');
    
    console.log('All data dropped successfully');
  } catch (error) {
    console.error('Error dropping data:', error);
    throw error;
  }
}

async function seedBranches() {
  const branchRepository = AppDataSource.getRepository(Branch);
  const createdBranches = [];
  
  for (const branchData of branches) {
    const branch = branchRepository.create(branchData);
    const savedBranch = await branchRepository.save(branch);
    createdBranches.push(savedBranch);
    console.log(`Created branch: ${branchData.name}`);
  }
  
  return createdBranches;
}

async function seedProducts() {
  const productRepository = AppDataSource.getRepository(Product);
  const createdProducts = [];
  
  for (const productData of products) {
    const product = productRepository.create(productData);
    const savedProduct = await productRepository.save(product);
    createdProducts.push(savedProduct);
    console.log(`Created product: ${productData.name}`);
  }
  
  return createdProducts;
}

async function seedEventTypes() {
  const eventTypeRepository = AppDataSource.getRepository(EventType);
  const createdEventTypes = [];
  
  for (const eventTypeData of eventTypes) {
    const eventType = eventTypeRepository.create(eventTypeData);
    const savedEventType = await eventTypeRepository.save(eventType);
    createdEventTypes.push(savedEventType);
    console.log(`Created event type: ${eventTypeData.name}`);
  }
  
  return createdEventTypes;
}

async function seedDefaultUser() {
  const userRepository = AppDataSource.getRepository(User);
  
  // Check if admin user already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@toyota.com' }
  });
  
  if (existingAdmin) {
    console.log('Admin user already exists, skipping creation');
    return existingAdmin;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = userRepository.create({
    username: 'admin',
    email: 'admin@toyota.com',
    password: hashedPassword,
    role: UserRole.ADMIN
  });
  
  const savedAdmin = await userRepository.save(admin);
  console.log('Created admin user');
  
  return savedAdmin;
}

async function seedEvents(branches: Branch[], eventTypes: EventType[], user: User, products: Product[]) {
  const eventRepository = AppDataSource.getRepository(Event);
  
  // Create sample events for each branch with different values
  for (const branch of branches) {
    // Values will vary based on branch region and type
    const multiplier = branch.name === 'Digital' ? 1.5 : 
                      branch.region.includes('South') ? 1.2 :
                      branch.region.includes('East') ? 0.8 :
                      branch.region.includes('Central') ? 1.0 : 0.9;

    // Create Digital Campaign events - one for each product
    const digitalProducts = products.slice(0, 4); // Glanza, Hyryder, Taisor, Rumion
    
    for (const product of digitalProducts) {
      await eventRepository.save({
        title: `Digital Campaign - ${branch.name} - ${product.name}`,
        description: `Q2 Digital Marketing Campaign for ${product.name} at ${branch.name}`,
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-05-30'),
        location: branch.location,
        status: 'approved',
        budget: Math.round(120000 * multiplier), // Split budget per product
        isPlanned: true,
        enquiryTarget: Math.round(20 * multiplier),
        orderTarget: Math.round(4 * multiplier),
        plannedBudget: Math.round(120000 * multiplier),
        actualBudget: Math.round(114000 * multiplier),
        plannedEnquiries: Math.round(20 * multiplier),
        actualEnquiries: Math.round(24 * multiplier),
        plannedOrders: Math.round(4 * multiplier),
        actualOrders: Math.round(5 * multiplier),
        branch: branch,
        branchId: branch.id,
        organizer: user,
        userId: user.id,
        eventType: eventTypes[0], // Digital Lead Generation
        isActive: true,
        products: [product] // Single product per event
      });
    }

    // Create Exchange Mela events - one for each product
    const exchangeProducts = products.slice(0, 3); // Glanza, Hyryder, Taisor
    
    for (const product of exchangeProducts) {
      await eventRepository.save({
        title: `Exchange Mela - ${branch.name} - ${product.name}`,
        description: `Annual Exchange Mela for ${product.name} at ${branch.name}`,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-15'),
        location: branch.location,
        status: 'completed',
        budget: Math.round(267000 * multiplier), // Split budget per product
        isPlanned: true,
        enquiryTarget: Math.round(50 * multiplier),
        orderTarget: Math.round(10 * multiplier),
        plannedBudget: Math.round(267000 * multiplier),
        actualBudget: Math.round(250000 * multiplier),
        plannedEnquiries: Math.round(50 * multiplier),
        actualEnquiries: Math.round(60 * multiplier),
        plannedOrders: Math.round(10 * multiplier),
        actualOrders: Math.round(12 * multiplier),
        branch: branch,
        branchId: branch.id,
        organizer: user,
        userId: user.id,
        eventType: eventTypes[2], // Exchange Mela
        isActive: true,
        products: [product] // Single product per event
      });
    }

    console.log(`Created events for branch: ${branch.name} with individual products assigned`);
  }
  
  console.log('Created sample events with one product per event');
}

export async function seed() {
  try {
    console.log('Starting seed process...');
    
    // Drop existing data first
    await dropAllData();
    
    // Create basic data
    const createdBranches = await seedBranches();
    const createdProducts = await seedProducts();
    const createdEventTypes = await seedEventTypes();
    const adminUser = await seedDefaultUser();
    
    // Create events with proper relationships
    await seedEvents(createdBranches, createdEventTypes, adminUser, createdProducts);
    
    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error during seed:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  AppDataSource.initialize()
    .then(async () => {
      await seed();
      process.exit(0);
    })
    .catch(error => {
      console.error('Error during initialization or seed:', error);
      process.exit(1);
    });
} 