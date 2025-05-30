import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Branch } from "../entity/Branch";

export class BranchController {
    private branchRepository = AppDataSource.getRepository(Branch);

    async all(request: Request, response: Response) {
        try {
            const branches = await this.branchRepository.find({
                where: { isActive: true } as any,
                order: { name: "ASC" }
            });
            return response.json(branches);
        } catch (error) {
            console.error("Error fetching branches:", error);
            return response.status(500).json({ message: "Internal server error" });
        }
    }
} 