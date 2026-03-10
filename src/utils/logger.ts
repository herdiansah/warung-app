// --- Server Logger Utility ---
// Color-coded structured logging for WarungApp
// Writes to console (colored) + logs/app.log (plain text)

import fs from "fs";
import path from "path";

const LOG_FILE = path.resolve("logs/app.log");

// Ensure logs directory exists
fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

function writeToFile(level: string, event: string, details?: Record<string, any>) {
    const ts = new Date().toISOString();
    const detailStr = details ? ` ${JSON.stringify(details)}` : "";
    const line = `[${ts}] ${level.padEnd(7)} ${event}${detailStr}\n`;
    fs.appendFileSync(LOG_FILE, line, "utf8");
}

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
};

function timestamp(): string {
    return new Date().toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
}

export const logger = {
    info(event: string, details?: Record<string, any>) {
        const ts = timestamp();
        const detailStr = details ? ` ${colors.gray}${JSON.stringify(details)}${colors.reset}` : "";
        console.log(`${colors.gray}[${ts}]${colors.reset} ${colors.blue}ℹ INFO${colors.reset}  ${colors.bright}${event}${colors.reset}${detailStr}`);
        writeToFile("INFO", event, details);
    },

    success(event: string, details?: Record<string, any>) {
        const ts = timestamp();
        const detailStr = details ? ` ${colors.gray}${JSON.stringify(details)}${colors.reset}` : "";
        console.log(`${colors.gray}[${ts}]${colors.reset} ${colors.green}✓ OK${colors.reset}    ${colors.bright}${event}${colors.reset}${detailStr}`);
        writeToFile("OK", event, details);
    },

    warn(event: string, details?: Record<string, any>) {
        const ts = timestamp();
        const detailStr = details ? ` ${colors.gray}${JSON.stringify(details)}${colors.reset}` : "";
        console.log(`${colors.gray}[${ts}]${colors.reset} ${colors.yellow}⚠ WARN${colors.reset}  ${colors.bright}${event}${colors.reset}${detailStr}`);
        writeToFile("WARN", event, details);
    },

    error(event: string, details?: Record<string, any>) {
        const ts = timestamp();
        const detailStr = details ? ` ${colors.gray}${JSON.stringify(details)}${colors.reset}` : "";
        console.error(`${colors.gray}[${ts}]${colors.reset} ${colors.red}✖ ERROR${colors.reset} ${colors.bright}${event}${colors.reset}${detailStr}`);
        writeToFile("ERROR", event, details);
    },

    request(method: string, path: string, statusCode: number, durationMs: number) {
        const ts = timestamp();
        const statusColor = statusCode < 400 ? colors.green : statusCode < 500 ? colors.yellow : colors.red;
        console.log(
            `${colors.gray}[${ts}]${colors.reset} ${colors.cyan}→ ${method}${colors.reset} ${path} ${statusColor}${statusCode}${colors.reset} ${colors.gray}${durationMs}ms${colors.reset}`
        );
        writeToFile("REQUEST", `${method} ${path} ${statusCode} ${durationMs}ms`);
    },
};
