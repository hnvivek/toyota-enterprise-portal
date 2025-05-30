import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

export const checkJwt = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
        const jwtPayload = jwt.verify(token, jwtSecret) as any;
        res.locals.jwtPayload = jwtPayload;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
}; 