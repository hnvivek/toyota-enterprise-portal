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
            const startDate = request.query.startDate as string;
            const endDate = request.query.endDate as string;
            
            console.log('=== SUMMARY ENDPOINT DEBUG ===');
            console.log('Query parameters:', { branchId, startDate, endDate });

            // Build where conditions
            let whereConditions: any = {
                isActive: true
            };

            // Add branch filter if provided
            if (branchId && !isNaN(Number(branchId))) {
                whereConditions.branchId = parseInt(branchId, 10);
                console.log('Filtering by branchId:', whereConditions.branchId);
            }

            // Add date filter if provided
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                // Set end date to end of day to include events on the end date
                end.setHours(23, 59, 59, 999);
                
                whereConditions.startDate = Between(start, end);
                console.log('Filtering by date range:', { start, end });
            }

            console.log('Final where conditions:', whereConditions);

            // Fetch events with conditions
            const events = await this.eventRepository.find({
                where: whereConditions,
                relations: ['branch']
            });
            
            console.log('Events found:', events.length);
            if (events.length > 0) {
                console.log('Sample events:', events.slice(0, 3).map(e => ({
                    id: e.id,
                    title: e.title,
                    startDate: e.startDate,
                    branchId: e.branchId,
                    branchName: e.branch?.name
                })));
            }

            // Calculate metrics from filtered events
            console.log('Calculating metrics from', events.length, 'events');
            
            // Get total users count from database (not just users who created events)
            const totalUsersCount = await this.userRepository.count();
            
            // Calculate events by status
            const executedEvents = events.filter(e => e.status === 'completed').length;
            const pendingEvents = events.filter(e => e.status !== 'completed').length;
            
            const metrics = {
                total_events: events.length,
                executed_events: executedEvents,
                pending_events: pendingEvents,
                total_users: totalUsersCount,
                total_budget: events.reduce((sum, e) => sum + (Number(e.budget) || 0), 0),
                total_planned_budget: events.reduce((sum, e) => sum + (Number(e.plannedBudget) || 0), 0),
                total_actual_budget: events.reduce((sum, e) => sum + (Number(e.actualBudget) || 0), 0),
                total_planned_enquiries: events.reduce((sum, e) => sum + (Number(e.plannedEnquiries) || 0), 0),
                total_actual_enquiries: events.reduce((sum, e) => sum + (Number(e.actualEnquiries) || 0), 0),
                total_planned_orders: events.reduce((sum, e) => sum + (Number(e.plannedOrders) || 0), 0),
                total_actual_orders: events.reduce((sum, e) => sum + (Number(e.actualOrders) || 0), 0),
                upcoming_events: events.filter(e => {
                    const eventStartDate = new Date(e.startDate);
                    const now = new Date();
                    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                    return eventStartDate >= now && eventStartDate <= thirtyDaysFromNow;
                }).length
            };

            console.log('Calculated metrics:', metrics);

            // Set totalBranches to 1 when filtering by branch, otherwise count all
            const totalBranches = branchId && !isNaN(Number(branchId)) ? 1 : 
                await this.branchRepository.count();

            const response_data = {
                totalEvents: metrics.total_events,
                eventsExecuted: metrics.executed_events,
                eventsPending: metrics.pending_events,
                totalUsers: metrics.total_users,
                totalBranches: totalBranches,
                upcomingEvents: metrics.upcoming_events,
                totalBudget: metrics.total_budget.toFixed(2),
                plannedCost: metrics.total_planned_budget.toFixed(2),
                totalPlannedBudget: metrics.total_planned_budget.toFixed(2),
                totalActualBudget: metrics.total_actual_budget.toFixed(2),
                totalPlannedEnquiries: metrics.total_planned_enquiries,
                totalActualEnquiries: metrics.total_actual_enquiries,
                totalPlannedOrders: metrics.total_planned_orders,
                totalActualOrders: metrics.total_actual_orders,
                // Add debug info
                dateFilter: startDate && endDate ? { startDate, endDate } : null,
                branchFilter: branchId || null
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
            const startDate = request.query.startDate as string;
            const endDate = request.query.endDate as string;
            
            console.log('Filtering recent events by:', { branchId, startDate, endDate });

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
                .where("event.isActive = :isActive", { isActive: true });

            // Add branch filter
            if (branchId && branchId !== 'all' && !isNaN(Number(branchId))) {
                queryBuilder = queryBuilder.andWhere("event.branchId = :branchId", { branchId: Number(branchId) });
            }

            // Add date filter
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                
                queryBuilder = queryBuilder.andWhere("event.startDate BETWEEN :startDate AND :endDate", {
                    startDate: start,
                    endDate: end
                });
            }

            const events = await queryBuilder
                .orderBy("event.startDate", "DESC")
                .take(5)
                .getMany();

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