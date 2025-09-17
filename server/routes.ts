import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertUserSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Mock session storage - in production, use a proper session store
const sessions = new Map<string, any>();

// Middleware to check authentication
const requireAuth = (req: any, res: any, next: any) => {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = sessions.get(sessionId);
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Mock authentication - accept any email/password
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user for demo
        user = await storage.createUser({
          email,
          name: email.split('@')[0] || 'User',
          provider: 'email'
        });
      }
      
      // Create session
      const sessionId = Math.random().toString(36).substring(7);
      sessions.set(sessionId, user);
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        sessionId
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post("/api/auth/oidc-login", async (req, res) => {
    try {
      const { provider } = req.body;
      
      // Mock OIDC login - create demo user
      const email = `demo@${provider}.com`;
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        user = await storage.createUser({
          email,
          name: 'Demo User',
          provider,
          providerId: 'mock-id'
        });
      }
      
      // Create session
      const sessionId = Math.random().toString(36).substring(7);
      sessions.set(sessionId, user);
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        sessionId
      });
    } catch (error) {
      console.error('OIDC login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post("/api/auth/logout", requireAuth, (req, res) => {
    const sessionId = req.headers['x-session-id'];
    sessions.delete(sessionId);
    res.json({ success: true });
  });

  // Device management routes
  app.get("/api/devices", requireAuth, async (req: any, res) => {
    try {
      const devices = await storage.getUserDevices(req.user.id);
      res.json(devices);
    } catch (error) {
      console.error('Get devices error:', error);
      res.status(500).json({ error: 'Failed to fetch devices' });
    }
  });

  app.post("/api/devices/:deviceId/connect", requireAuth, async (req: any, res) => {
    try {
      const { deviceId } = req.params;
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await storage.updateDeviceStatus(deviceId, "connected");
      
      // Associate device with user
      const device = await storage.getDevice(deviceId);
      if (device) {
        device.userId = req.user.id;
        await storage.createDevice({ ...device, userId: req.user.id });
      }
      
      res.json({ success: true, message: "Device connected successfully" });
    } catch (error) {
      console.error('Connect device error:', error);
      res.status(500).json({ error: 'Failed to connect device' });
    }
  });

  app.post("/api/devices/:deviceId/disconnect", requireAuth, async (req: any, res) => {
    try {
      const { deviceId } = req.params;
      
      await storage.updateDeviceStatus(deviceId, "disconnected");
      
      res.json({ success: true, message: "Device disconnected" });
    } catch (error) {
      console.error('Disconnect device error:', error);
      res.status(500).json({ error: 'Failed to disconnect device' });
    }
  });

  // Chat routes
  app.get("/api/chat/messages", requireAuth, async (req: any, res) => {
    try {
      const { deviceId } = req.query;
      const messages = await storage.getChatMessages(req.user.id, deviceId);
      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post("/api/chat/message", requireAuth, upload.array('images', 3), async (req: any, res) => {
    try {
      const { message, deviceId, debug } = req.body;
      const images = req.files as Express.Multer.File[];
      
      // Save user message
      const userMessage = await storage.createChatMessage({
        userId: req.user.id,
        deviceId: deviceId || null,
        role: 'user',
        content: message,
        images: images?.map(img => `data:${img.mimetype};base64,${img.buffer.toString('base64')}`) || [],
        debug: debug === 'true' ? { userInput: message, timestamp: new Date() } : null
      });

      // Simulate LLM processing delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));
      
      // Generate mock AI response
      const responses = [
        "I'm processing your request on the edge device. The model is analyzing your input...",
        "Based on the data processed locally, here's what I found...",
        "Running inference on the edge hardware. This keeps your data private and secure.",
        "The edge AI model has completed processing. Here are the results...",
        "Processing complete. The advantage of edge computing is the low latency you're experiencing."
      ];
      
      const mockResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // Mock debug information
      const debugInfo = debug === 'true' ? {
        systemPrompt: "You are a helpful AI assistant running on an edge device. Provide concise and accurate responses while highlighting the benefits of edge computing.",
        modelInputs: { 
          temperature: 0.7, 
          max_tokens: 150, 
          prompt_tokens: message.length,
          image_count: images?.length || 0 
        },
        modelOutputs: { 
          tokens_generated: Math.floor(20 + Math.random() * 100), 
          confidence: 0.85 + Math.random() * 0.15 
        },
        processingTime: Math.floor(200 + Math.random() * 800),
        device: {
          gpu_usage: Math.floor(Math.random() * 80),
          memory_usage: Math.floor(30 + Math.random() * 40),
          temperature: Math.floor(35 + Math.random() * 20)
        }
      } : null;

      // Save AI response
      const aiMessage = await storage.createChatMessage({
        userId: req.user.id,
        deviceId: deviceId || null,
        role: 'assistant',
        content: mockResponse,
        images: [],
        debug: debugInfo
      });

      res.json({
        userMessage,
        aiMessage,
        success: true
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Device scanning (mock)
  app.post("/api/devices/scan", requireAuth, async (req, res) => {
    try {
      // Simulate scanning delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return mock discovered devices
      const devices = await storage.getUserDevices(req.user.id);
      res.json({
        success: true,
        devices: devices.length,
        message: "Scan completed"
      });
    } catch (error) {
      console.error('Scan devices error:', error);
      res.status(500).json({ error: 'Scan failed' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
