import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

// --- Request Logger Middleware ---
export function requestLogger(req: Request, res: Response, next: NextFunction) {
    // Skip logging for Vite HMR and static assets
    if (req.path.startsWith("/@") || req.path.startsWith("/src/") || req.path.startsWith("/node_modules/")) {
        return next();
    }

    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;
        // Only log API requests
        if (req.path.startsWith("/api/")) {
            logger.request(req.method, req.path, res.statusCode, duration);
        }
    });

    next();
}

// --- Global Error Handler Middleware ---
export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    logger.error("Unhandled error", {
        method: req.method,
        path: req.path,
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack?.split("\n").slice(0, 3),
    });

    // Always return consistent JSON error format
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: process.env.NODE_ENV === "production"
            ? "Terjadi kesalahan internal"
            : err.message || "Internal Server Error",
    });
}
