import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        store_id?: string | null;
    };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(500).json({ error: "Server authentication is not configured." });
    }

    try {
        const decoded = jwt.verify(token, secret) as any;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: "Invalid token." });
    }
};

export const authorizeRole = (allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden: insufficient permissions" });
        }
        next();
    };
};
