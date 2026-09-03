// --- Server Logger Utility ---
// Structured logging for WarungApp.
//
// Modes (LOG_FORMAT env):
//   pretty (default)  colored human-readable console + logs/app.log file
//   json              one JSON object per line on stdout (Docker/collectors)
//
// Filtering (LOG_LEVEL env): debug < info < warn < error (default: info)
//
// Error tracking integration point: set ERROR_WEBHOOK_URL to POST every
// ERROR-level event as JSON (e.g. Sentry-compatible ingest, Slack, etc).

import fs from "fs";
import path from "path";

const LOG_FILE = path.resolve("logs/app.log");
const LOG_LEVELS: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || "info"] ?? 1;
const jsonMode = process.env.LOG_FORMAT === "json";
const errorWebhook = process.env.ERROR_WEBHOOK_URL || "";

// Ensure logs directory exists (local file sink only)
if (!jsonMode) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}

function writeToFile(level: string, event: string, details?: Record<string, any>) {
  if (jsonMode) return; // file sink is dev-only; JSON mode goes to stdout
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

interface LogEntry {
  level: string;
  event: string;
  details?: Record<string, any>;
  timestamp: string;
  pid: number;
  hostname: string;
}

function emit(level: string, event: string, details?: Record<string, any>) {
  const ts = timestamp();

  if (jsonMode) {
    const entry: LogEntry = {
      level,
      event,
      timestamp: new Date().toISOString(),
      pid: process.pid,
      hostname: process.env.HOSTNAME || "localhost",
    };
    if (details) entry.details = details;
    const line = JSON.stringify(entry);
    if (level === "error") process.stderr.write(line + "\n");
    else process.stdout.write(line + "\n");
    return;
  }

  const detailStr = details ? ` ${colors.gray}${JSON.stringify(details)}${colors.reset}` : "";
  const color = level === "info" ? colors.blue : level === "warn" ? colors.yellow : level === "error" ? colors.red : colors.green;
  const badge = level === "info" ? "INFO" : level === "warn" ? "WARN" : level === "error" ? "ERROR" : "OK";
  const icon = level === "info" ? "ℹ" : level === "warn" ? "⚠" : level === "error" ? "✖" : "✓";
  const out = level === "error" ? console.error : console.log;
  out(`${colors.gray}[${ts}]${colors.reset} ${color}${icon} ${badge}${colors.reset}  ${colors.bright}${event}${colors.reset}${detailStr}`);
  writeToFile(level, event, details);
}

async function notifyError(event: string, details?: Record<string, any>) {
  if (!errorWebhook) return;
  try {
    await fetch(errorWebhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, details, timestamp: new Date().toISOString(), app: "warung-app" }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err: any) {
    // Never let error notification break the request path
    process.stderr.write(`[logger] error webhook failed: ${err.message}\n`);
  }
}

export const logger = {
  debug(event: string, details?: Record<string, any>) {
    if (currentLevel > 0) return;
    emit("debug", event, details);
  },

  info(event: string, details?: Record<string, any>) {
    if (currentLevel > 1) return;
    emit("info", event, details);
  },

  success(event: string, details?: Record<string, any>) {
    if (currentLevel > 1) return;
    emit("success", event, details);
  },

  warn(event: string, details?: Record<string, any>) {
    if (currentLevel > 2) return;
    emit("warn", event, details);
  },

  error(event: string, details?: Record<string, any>) {
    if (currentLevel > 3) return;
    emit("error", event, details);
    void notifyError(event, details);
  },

  request(method: string, path: string, statusCode: number, durationMs: number) {
    if (currentLevel > 1) return;

    if (jsonMode) {
      const line = JSON.stringify({
        level: "info",
        event: "request",
        method,
        path,
        statusCode,
        durationMs,
        timestamp: new Date().toISOString(),
        pid: process.pid,
      });
      process.stdout.write(line + "\n");
      return;
    }

    const ts = timestamp();
    const statusColor = statusCode < 400 ? colors.green : statusCode < 500 ? colors.yellow : colors.red;
    console.log(
      `${colors.gray}[${ts}]${colors.reset} ${colors.cyan}→ ${method}${colors.reset} ${path} ${statusColor}${statusCode}${colors.reset} ${colors.gray}${durationMs}ms${colors.reset}`
    );
    writeToFile("REQUEST", `${method} ${path} ${statusCode} ${durationMs}ms`);
  },
};
