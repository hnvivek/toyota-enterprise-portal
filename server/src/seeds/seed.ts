import { AppDataSource } from '../config/database';
import { Branch } from '../models/Branch';
import { Product } from '../models/Product';
import { EventType } from '../models/EventType';
import { User } from '../models/User';
import { UserRole } from '../types/auth';
import bcrypt from 'bcryptjs';
import { Event, EventStatus } from '../models/Event';

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

async function createUsers(branches: Branch[]): Promise<User[]> {
  const userRepository = AppDataSource.getRepository(User);
  
  console.log('Creating initial users...');
  
  const createdUsers: User[] = [];
  
  const usersToCreate = [
    {
      username: 'admin',
      email: 'admin@toyota.com',
      password: 'admin123',
      role: UserRole.ADMIN,
      branch: null, // Admin has access to all branches
      description: 'System Administrator - All Branches Access'
    },
    {
      username: 'priya_sales',
      email: 'priya.sales@toyota.com',
      password: 'sales123',
      role: UserRole.SALES_MANAGER,
      branch: branches[2], // Assigned to Whitefield branch only
      description: 'Sales Manager - Whitefield Branch'
    },
    {
      username: 'rajesh_gm',
      email: 'rajesh.gm@toyota.com',
      password: 'gm123',
      role: UserRole.GENERAL_MANAGER,
      branch: branches[2], // Assigned to Whitefield branch only
      description: 'General Manager - Whitefield Branch'
    },
    {
      username: 'arun_marketing',
      email: 'arun.marketing@toyota.com',
      password: 'marketing123',
      role: UserRole.MARKETING_MANAGER,
      branch: branches[3], // Assigned to KP Road branch only
      description: 'Marketing Manager - KP Road Branch'
    },
    {
      username: 'kavya_head',
      email: 'kavya.head@toyota.com',
      password: 'head123',
      role: UserRole.MARKETING_HEAD,
      branch: null, // Marketing Head has access to all branches for campaign oversight
      description: 'Marketing Head - All Branches Access'
    }
  ];
  
  for (const userData of usersToCreate) {
    try {
      console.log(`Creating user: ${userData.email}`);
      
      // Check if user already exists
      const existingUser = await userRepository.findOne({ where: { email: userData.email } });
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        createdUsers.push(existingUser);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      console.log(`Password hashed for user: ${userData.email}`);

      // Create user
      const user = new User();
      user.username = userData.username;
      user.email = userData.email;
      user.password = hashedPassword;
      user.role = userData.role;
      if (userData.branch) {
        user.branch = userData.branch;
      }

      const savedUser = await userRepository.save(user);
      createdUsers.push(savedUser);
      console.log(`User created successfully: ${savedUser.email} (ID: ${savedUser.id}) - ${userData.role}`);
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
    }
  }

  console.log('User seeding completed');
  return createdUsers;
}

async function seedEvents(branches: Branch[], eventTypes: EventType[], users: User[], products: Product[]) {
  const eventRepository = AppDataSource.getRepository(Event);
  
  // Get current date for realistic date generation
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based (0 = January)
  
  // Helper function to generate random dates (current month and future only)
  const getRandomDate = (monthsForward: number) => {
    const maxMonthOffset = monthsForward;
    const randomMonthOffset = Math.floor(Math.random() * (maxMonthOffset + 1)); // 0 to monthsForward
    
    const year = currentYear;
    const month = currentMonth + randomMonthOffset;
    const day = Math.floor(Math.random() * 28) + 1; // 1-28 to avoid month overflow issues
    
    // If it's current month, make sure it's not in the past
    const randomDate = new Date(year, month, day);
    if (randomDate < now && randomMonthOffset === 0) {
      // If current month and date is in past, set to today + random days
      const futureDate = new Date(now);
      futureDate.setDate(now.getDate() + Math.floor(Math.random() * 15) + 1); // 1-15 days from now
      return futureDate;
    }
    
    return randomDate;
  };

  // Helper function to get random duration (1-30 days)
  const getRandomDuration = () => Math.floor(Math.random() * 30) + 1;

  // Helper function to get random status based on date
  const getRandomStatus = (startDate: Date): EventStatus => {
    if (startDate < now) {
      // Past events - mostly completed, some approved
      return Math.random() < 0.8 ? 'completed' : 'approved';
    } else {
      // Future events - mix of pending and approved
      const futureStatuses: EventStatus[] = ['pending_gm', 'pending_marketing', 'approved', 'draft'];
      return futureStatuses[Math.floor(Math.random() * futureStatuses.length)];
    }
  };

  // Helper function to get random multiplier for budget/targets
  const getRandomMultiplier = () => 0.5 + Math.random() * 1.5; // 0.5x to 2x

  // Notes templates for variety
  const notesTemplates = [
    "Event focused on young professionals and families. Marketing team coordinated social media campaigns.",
    "Special emphasis on test drives and customer experience. Coordination with local dealership partners.",
    "Corporate tie-up event targeting fleet customers. Focus on bulk bookings and after-sales service.",
    "Festival season campaign with special offers and financing options. High footfall expected.",
    "Digital-first approach with QR codes for instant booking. Target tech-savvy customers.",
    "Rural market penetration strategy. Local language communication and cultural sensitivity required.",
    "Premium segment targeting with personalized customer interactions and exclusive previews.",
    "Service camp combined with sales event. Focus on existing customer retention and referrals.",
    "Mall activation with interactive displays and virtual reality test drive experiences.",
    "Government employee special scheme launch. Documentation support and easy financing process.",
    "Weekend family event with kids activities and food stalls. Community engagement focus.",
    "Corporate B2B event targeting business customers and fleet requirements.",
    "Social media influencer collaboration event with live streaming and contests.",
    "",
    "",
    "" // Some events without notes
  ];

  // Generate 70-90 random events across all branches and event types
  const totalEvents = 75 + Math.floor(Math.random() * 16); // 75-90 events
  
  const eventTitles = [
    'Q1 Digital Campaign', 'Q2 Marketing Push', 'Q3 Sales Drive', 'Q4 Festival Campaign',
    'Summer Sale Event', 'Monsoon Special', 'Festival Bonanza', 'Year End Sale',
    'New Model Launch', 'Test Drive Campaign', 'Corporate Event', 'Mall Display',
    'Road Show', 'Customer Meet', 'Dealer Conference', 'Training Program',
    'Service Campaign', 'Loyalty Program', 'Referral Drive', 'Trade-in Event',
    'Weekend Showcase', 'Family Carnival', 'Tech Expo', 'Green Drive Initiative'
  ];

  const locations = [
    'City Center Mall', 'Phoenix Mall', 'Forum Mall', 'Brigade Road', 'Commercial Street',
    'Whitefield Main Road', 'Electronic City', 'Banashankari', 'Jayanagar', 'Koramangala',
    'HSR Layout', 'BTM Layout', 'Marathahalli', 'Sarjapur Road', 'Outer Ring Road',
    'Hebbal', 'Yeshwantpur', 'Rajajinagar', 'Malleshwaram', 'Indiranagar'
  ];

  for (let i = 0; i < totalEvents; i++) {
    // Random selections
    const randomBranch = branches[Math.floor(Math.random() * branches.length)];
    const randomEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const randomProducts = products
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 1); // 1-3 products per event
    
    // Use the specific priya_sales user for all events (so user can log in as priya.sales@toyota.com and edit them)
    const priyaSalesUser = users.find(u => u.username === 'priya_sales');
    const randomUser = priyaSalesUser || users[0]; // fallback to first user if not found
    
    // Random date generation (current month to 6 months forward)
    const startDate = getRandomDate(6);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + getRandomDuration());
    
    const status = getRandomStatus(startDate);
    
    // Random title and location
    const titleBase = eventTitles[Math.floor(Math.random() * eventTitles.length)];
    const randomLocation = Math.random() < 0.7 ? randomBranch.location : 
                          locations[Math.floor(Math.random() * locations.length)];
    
    // Random budget and targets with variation
    const baseBudget = 50000 + Math.random() * 400000; // 50K to 450K
    const multiplier = getRandomMultiplier();
    
    const budget = Math.round(baseBudget * multiplier);
    const leadTarget = Math.round((50 + Math.random() * 200) * multiplier); // 50-250 leads
    const enquiryTarget = Math.round((20 + Math.random() * 80) * multiplier); // 20-100 enquiries
    const orderTarget = Math.round((3 + Math.random() * 15) * multiplier); // 3-18 orders
    
    // Planned values (slightly different from targets)
    const plannedBudget = Math.round(budget * (0.9 + Math.random() * 0.2)); // 90%-110% of budget
    const plannedLeads = Math.round(leadTarget * (0.8 + Math.random() * 0.4)); // 80%-120%
    const plannedEnquiries = Math.round(enquiryTarget * (0.8 + Math.random() * 0.4)); // 80%-120%
    const plannedOrders = Math.round(orderTarget * (0.8 + Math.random() * 0.4)); // 80%-120%
    
    // Actual values (only for completed events)
    let actualBudget: number | null = null;
    let actualLeads: number | null = null;
    let actualEnquiries: number | null = null;
    let actualOrders: number | null = null;
    
    if (status === 'completed') {
      actualBudget = Math.round(plannedBudget * (0.85 + Math.random() * 0.3)); // 85%-115% of planned
      actualLeads = Math.round(plannedLeads * (0.7 + Math.random() * 0.6)); // 70%-130% of planned
      actualEnquiries = Math.round(plannedEnquiries * (0.7 + Math.random() * 0.6)); // 70%-130% of planned
      actualOrders = Math.round(plannedOrders * (0.6 + Math.random() * 0.8)); // 60%-140% of planned
    }

    // Random notes
    const notes = notesTemplates[Math.floor(Math.random() * notesTemplates.length)];

    const productNames = randomProducts.map(p => p.name).join(' & ');
    const title = `${titleBase} - ${randomBranch.name} - ${productNames}`;
    const description = `${new Date().getFullYear()} ${randomEventType.name} for ${productNames} at ${randomBranch.name} branch. Organized by ${randomUser.username}.`;

    try {
      const event = eventRepository.create({
        title: title.length > 100 ? title.substring(0, 97) + '...' : title,
        description,
        startDate,
        endDate,
        location: randomLocation,
        status,
        budget,
        isPlanned: true,
        isActive: true, // Ensure all events are active
        
        // Original target fields (these are the base targets used for planning)
        enquiryTarget,
        orderTarget,
        
        // Planned metrics (refined planning values, can differ from targets)
        plannedBudget,
        plannedLeads,
        plannedEnquiries,
        plannedOrders,
        
        // Actual metrics (only for completed events)
        actualBudget,
        actualLeads,
        actualEnquiries,
        actualOrders,
        
        // Notes
        notes: notes || null,
        
        // Relationships
        branch: randomBranch,
        organizer: randomUser,
        eventType: randomEventType,
        products: randomProducts,
        
        // Ensure IDs are set properly for relationships
        branchId: randomBranch.id,
        userId: randomUser.id
      });
      
      await eventRepository.save(event);
    } catch (error) {
      console.error(`Error creating event ${i + 1}:`, error);
    }
  }
  
  console.log(`Created ${totalEvents} randomized events across all branches with varied dates, statuses, budgets, and users`);
}

export async function seed() {
  try {
    console.log('Starting seed process...');
    
    // Drop and recreate the database schema
    console.log('Dropping and recreating database schema...');
    await AppDataSource.dropDatabase();
    await AppDataSource.synchronize();
    console.log('Database schema recreated successfully');
    
    // Create basic data
    const createdBranches = await seedBranches();
    const createdProducts = await seedProducts();
    const createdEventTypes = await seedEventTypes();
    
    // Create initial users
    const createdUsers = await createUsers(createdBranches);
    
    // Create events with proper relationships and existing organizers
    await seedEvents(createdBranches, createdEventTypes, createdUsers, createdProducts);
    
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