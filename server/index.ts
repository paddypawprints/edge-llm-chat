import express, { type Request, Response, NextFunction } from "express";
import { spawn } from "child_process";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Parse JSON and URL-encoded bodies before the proxy middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Manual proxy handler for API requests to FastAPI
// This bypasses middleware interference issues
app.all('/api/*', async (req, res) => {
  try {
    // Keep full path including /api prefix - FastAPI expects it
    const fastApiUrl = `http://127.0.0.1:8000${req.url}`;
    
    log(`Proxying ${req.method} ${req.originalUrl} to FastAPI: ${fastApiUrl}`);
    
    // Prepare headers, preserving important ones like x-session-id
    const headers: Record<string, string> = {};
    Object.keys(req.headers).forEach(key => {
      const value = req.headers[key];
      if (typeof value === 'string') {
        headers[key] = value;
      } else if (Array.isArray(value)) {
        headers[key] = value.join(', ');
      }
    });
    
    // Remove host header to avoid conflicts
    delete headers.host;
    
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };
    
    // Add body for POST, PUT, PATCH methods
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // For multipart data, we need to forward the raw request body
        // Since express.json() doesn't handle multipart, we need to collect the raw data
        let body = '';
        req.setEncoding('utf8');
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const multipartResponse = await fetch(fastApiUrl, {
              ...fetchOptions,
              body: body,
            });
            
            // Copy response
            multipartResponse.headers.forEach((value, key) => {
              res.setHeader(key, value);
            });
            res.status(multipartResponse.status);
            
            const responseContentType = multipartResponse.headers.get('content-type');
            if (responseContentType?.includes('application/json')) {
              const data = await multipartResponse.json();
              res.json(data);
            } else {
              const text = await multipartResponse.text();
              res.send(text);
            }
          } catch (error) {
            log(`Multipart proxy error: ${error.message}`);
            res.status(500).json({ error: 'Backend service unavailable' });
          }
        });
        return; // Exit early for multipart handling
      } else {
        // Handle JSON data - req.body is now available since express.json() runs first
        if (req.body) {
          fetchOptions.body = JSON.stringify(req.body);
          if (!headers['content-type']) {
            headers['content-type'] = 'application/json';
          }
        }
      }
    }
    
    // Make request to FastAPI
    const response = await fetch(fastApiUrl, fetchOptions);
    
    log(`FastAPI responded ${response.status} for ${req.originalUrl}`);
    
    // Copy response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // Set status and send response
    res.status(response.status);
    
    // Handle different content types
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else {
      const text = await response.text();
      res.send(text);
    }
    
  } catch (error) {
    log(`Proxy error for ${req.originalUrl}: ${error.message}`);
    res.status(500).json({ error: 'Backend service unavailable' });
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Start FastAPI server as supervised child process
  log("🚀 Starting FastAPI backend server...");
  const fastapi = spawn('python3', ['start_fastapi.py'], { 
    stdio: 'inherit', 
    env: process.env,
    cwd: process.cwd()
  });

  fastapi.on('error', (err) => {
    log(`FastAPI server error: ${err.message}`);
  });

  fastapi.on('exit', (code, signal) => {
    log(`FastAPI server exited with code ${code} and signal ${signal}`);
  });

  // Clean up FastAPI process on exit
  const cleanup = () => {
    if (fastapi && !fastapi.killed) {
      log("🛑 Shutting down FastAPI server...");
      fastapi.kill('SIGTERM');
    }
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  // Proxy middleware is now set up earlier in the file

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
