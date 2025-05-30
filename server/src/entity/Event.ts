import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Branch } from "./Branch";

@Entity("events")
export class Event {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Branch, branch => branch.events)
    @JoinColumn({ name: "branch_id" })
    branch!: Branch;

    @Column({ name: "branch_id" })
    branchId!: string;

    @Column()
    title!: string;

    @Column()
    startDate!: Date;

    @Column()
    location!: string;

    @Column()
    status!: string;

    @Column('decimal', { precision: 10, scale: 2 })
    budget!: number;

    @Column({ default: true })
    isActive!: boolean;

    @Column({ name: "user_id", nullable: true })
    userId!: string;

    // Planned Metrics
    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    plannedBudget!: number;

    @Column('int', { nullable: true })
    plannedEnquiries!: number;

    @Column('int', { nullable: true })
    plannedOrders!: number;

    // Actual Metrics
    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    actualBudget!: number;

    @Column('int', { nullable: true })
    actualEnquiries!: number;

    @Column('int', { nullable: true })
    actualOrders!: number;
} 