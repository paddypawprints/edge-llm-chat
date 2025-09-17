import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // All API routes are now handled by FastAPI through the reverse proxy
  // This file now only sets up the HTTP server for Vite integration
  
  const httpServer = createServer(app);

  return httpServer;
}
