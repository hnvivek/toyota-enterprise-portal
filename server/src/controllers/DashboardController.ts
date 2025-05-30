import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Event } from "../models/Event";
import { Between } from "typeorm";
import { Branch } from "../models/Branch";
import { User } from "../models/User";

export class DashboardController {
    private eventRepository = AppDataSource.getRepository(Event);
    private branchRepository = AppDataSource.getRepository(Branch);
    private userRepository = AppDataSource.getRepository(User);

    async summary(request: Request, response: Response) {
        try {
            const branchId = request.query.branchId as string;
            console.log('=== SUMMARY ENDPOINT DEBUG ===');
            console.log('Raw branchId from query:', branchId, typeof branchId);

            let events: Event[] = [];
            
            if (branchId && !isNaN(Number(branchId))) {
                const branchIdNum = parseInt(branchId, 10);
                console.log('Filtering by branchId:', branchIdNum);
                
                // Method 1: Direct repository find with where clause
                events = await this.eventRepository.find({
                    where: {
                        branchId: branchIdNum,
                        isActive: true
                    },
                    relations: ['branch']
                });
                
                console.log('Method 1 - Direct find results:', events.length);
                console.log('Events found:', events.map(e => ({
                    id: e.id,
                    title: e.title,
                    branchId: e.branchId,
                    branchName: e.branch?.name,
                    budget: e.budget
                })));
                
                // Method 2: Query builder for comparison
                const queryBuilderEvents = await this.eventRepository
                    .createQueryBuilder("event")
                    .leftJoinAndSelect("event.branch", "branch")
                    .where("event.isActive = :isActive", { isActive: true })
                    .andWhere("event.branchId = :branchId", { branchId: branchIdNum })
                    .getMany();
                
                console.log('Method 2 - Query builder results:', queryBuilderEvents.length);
                
                // Method 3: Raw SQL for verification (fix column names)
                const rawEvents = await this.eventRepository.query(
                    `SELECT e.*, b.name as branch_name 
                     FROM events e 
                     LEFT JOIN branches b ON b.id = e.branch_id 
                     WHERE e.branch_id = $1 AND e."isActive" = true`,
                    [branchIdNum]
                );
                
                console.log('Method 3 - Raw SQL results:', rawEvents.length);
                console.log('Raw events:', rawEvents);
                
                // Use the events from Method 1 (repository find)
                if (events.length === 0) {
                    console.log('No events found for branchId:', branchIdNum);
                    console.log('Available branches:');
                    const allBranches = await this.branchRepository.find();
                    console.log(allBranches.map(b => ({ id: b.id, name: b.name })));
                }
                
            } else {
                console.log('No branchId provided, fetching all events');
                // Get all active events
                events = await this.eventRepository.find({
                    where: {
                        isActive: true
                    },
                    relations: ['branch']
                });
                console.log('Total active events:', events.length);
            }

            // Calculate metrics from filtered events
            console.log('Calculating metrics from', events.length, 'events');
            
            // Get total users count from database (not just users who created events)
            const totalUsersCount = await this.userRepository.count();
            
            const metrics = {
                total_events: events.length,
                total_users: totalUsersCount,
                total_budget: events.reduce((sum, e) => sum + (Number(e.budget) || 0), 0),
                total_planned_budget: events.reduce((sum, e) => sum + (Number(e.plannedBudget) || 0), 0),
                total_actual_budget: events.reduce((sum, e) => sum + (Number(e.actualBudget) || 0), 0),
                total_planned_enquiries: events.reduce((sum, e) => sum + (Number(e.plannedEnquiries) || 0), 0),
                total_actual_enquiries: events.reduce((sum, e) => sum + (Number(e.actualEnquiries) || 0), 0),
                total_planned_orders: events.reduce((sum, e) => sum + (Number(e.plannedOrders) || 0), 0),
                total_actual_orders: events.reduce((sum, e) => sum + (Number(e.actualOrders) || 0), 0),
                upcoming_events: events.filter(e => {
                    const startDate = new Date(e.startDate);
                    const now = new Date();
                    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                    return startDate >= now && startDate <= thirtyDaysFromNow;
                }).length
            };

            console.log('Calculated metrics:', metrics);

            // Set totalBranches to 1 when filtering by branch, otherwise count all
            const totalBranches = branchId && !isNaN(Number(branchId)) ? 1 : 
                await this.branchRepository.count();

            const response_data = {
                totalEvents: metrics.total_events,
                totalUsers: metrics.total_users,
                totalBranches: totalBranches,
                upcomingEvents: metrics.upcoming_events,
                totalBudget: metrics.total_budget.toFixed(2),
                totalPlannedBudget: metrics.total_planned_budget.toFixed(2),
                totalActualBudget: metrics.total_actual_budget.toFixed(2),
                totalPlannedEnquiries: metrics.total_planned_enquiries,
                totalActualEnquiries: metrics.total_actual_enquiries,
                totalPlannedOrders: metrics.total_planned_orders,
                totalActualOrders: metrics.total_actual_orders
            };

            console.log('Response data:', response_data);
            console.log('=== END SUMMARY DEBUG ===');

            return response.json(response_data);
        } catch (error) {
            console.error("Error in summary endpoint:", error);
            return response.status(500).json({ 
                message: "Internal server error",
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    async debug(request: Request, response: Response) {
        try {
            console.log('=== DEBUG ENDPOINT ===');
            
            const allEvents = await this.eventRepository
                .createQueryBuilder("event")
                .leftJoinAndSelect("event.branch", "branch")
                .select([
                    "event.id",
                    "event.title", 
                    "event.branchId",
                    "event.isActive",
                    "branch.id",
                    "branch.name"
                ])
                .getMany();

            console.log('All events in database:');
            allEvents.forEach(event => {
                console.log(`Event ${event.id}: branchId=${event.branchId} (${typeof event.branchId}), branch=${event.branch?.name}, active=${event.isActive}`);
            });

            const branchId = 1;
            const filteredEvents = await this.eventRepository
                .createQueryBuilder("event")
                .where("event.isActive = :isActive", { isActive: true })
                .andWhere("event.branchId = :branchId", { branchId })
                .getMany();

            return response.json({
                totalEvents: allEvents.length,
                filteredEventsForBranch1: filteredEvents.length,
                allEvents: allEvents.map(e => ({
                    id: e.id,
                    title: e.title,
                    branchId: e.branchId,
                    branchIdType: typeof e.branchId,
                    branchName: e.branch?.name,
                    isActive: e.isActive
                })),
                filteredEvents: filteredEvents.map(e => ({
                    id: e.id,
                    title: e.title,
                    branchId: e.branchId
                }))
            });
        } catch (error) {
            console.error("Debug endpoint error:", error);
            return response.status(500).json({ 
                message: "Debug error", 
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    async recentEvents(request: Request, response: Response) {
        try {
            const branchId = request.query.branchId as string;
            console.log('Filtering recent events by branch:', { branchId });

            let queryBuilder = this.eventRepository
                .createQueryBuilder("event")
                .select([
                    "event.id",
                    "event.title",
                    "event.startDate",
                    "event.location",
                    "event.status",
                    "event.budget"
                ])
                .where("event.isActive = :isActive", { isActive: true })
                .orderBy("event.startDate", "DESC")
                .take(5);

            if (branchId && branchId !== 'all' && !isNaN(Number(branchId))) {
                queryBuilder = queryBuilder.andWhere("event.branchId = :branchId", { branchId: Number(branchId) });
            }

            const events = await queryBuilder.getMany();
            return response.json(events);
        } catch (error) {
            console.error("Error in recentEvents endpoint:", error);
            return response.status(500).json({ 
                message: "Internal server error",
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
}