import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import { storage } from "./storage";
import { fileProcessor } from "./services/fileProcessor";
import { speciesService } from "./services/speciesService";
import { mlService } from "./services/mlService";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertSampleSchema, insertSpeciesSchema, insertDetectionSchema, insertAlertSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";

const upload = multer({ 
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.tar.gz', '.fasta', '.fastq', '.gz'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    const isGzipped = file.originalname.endsWith('.tar.gz');
    
    if (allowedTypes.includes(fileExt) || isGzipped) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload .tar.gz, .fasta, .fastq, or .gz files.'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

interface WebSocketClient extends WebSocket {
  id: string;
  isAlive: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Auth middleware
  await setupAuth(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<string, WebSocketClient>();

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    const client = ws as WebSocketClient;
    client.id = Math.random().toString(36).substring(2, 15);
    client.isAlive = true;
    clients.set(client.id, client);

    console.log(`WebSocket client ${client.id} connected`);

    client.on('pong', () => {
      client.isAlive = true;
    });

    client.on('close', () => {
      clients.delete(client.id);
      console.log(`WebSocket client ${client.id} disconnected`);
    });

    // Send initial data
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ 
        type: 'connected', 
        message: 'Real-time connection established' 
      }));
    }
  });

  // Ping clients to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = ws as WebSocketClient;
      if (!client.isAlive) {
        client.terminate();
        clients.delete(client.id);
        return;
      }
      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  // Broadcast function for real-time updates
  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // API Routes

  // Dashboard analytics
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const [speciesCount, activeSamples, alertsCount, citizenCount] = await Promise.all([
        storage.getSpeciesCount(),
        storage.getActiveSamplesCount(),
        storage.getAlertsCount(),
        storage.getCitizenScientistsCount()
      ]);

      res.json({
        speciesCount,
        activeSamples,
        alertsCount,
        citizenCount
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  });

  // Sample upload and processing
  app.post("/api/samples/upload", isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { location, metadata } = req.body;
      
      if (!location) {
        return res.status(400).json({ error: "Location is required" });
      }

      const locationData = typeof location === 'string' ? JSON.parse(location) : location;
      const metadataData = metadata ? (typeof metadata === 'string' ? JSON.parse(metadata) : metadata) : {};

      const sampleData = insertSampleSchema.parse({
        userId: req.user.claims.sub, // Get from authenticated user
        filename: req.file.originalname,
        originalFormat: path.extname(req.file.originalname),
        location: locationData,
        metadata: metadataData
      });

      const sample = await storage.createSample(sampleData);

      // Start processing asynchronously
      fileProcessor.processSample(sample.id, req.file.path, req.file.originalname)
        .then(() => {
          broadcast({
            type: 'sample_processed',
            data: { sampleId: sample.id, status: 'completed' }
          });
        })
        .catch((error) => {
          console.error("Error processing sample:", error);
          broadcast({
            type: 'sample_error',
            data: { sampleId: sample.id, error: error.message }
          });
        });

      res.json(sample);
    } catch (error) {
      console.error("Error uploading sample:", error);
      res.status(500).json({ error: "Failed to upload sample" });
    }
  });

  // Get sample processing status
  app.get("/api/samples/:id/status", async (req, res) => {
    try {
      const sample = await storage.getSample(req.params.id);
      if (!sample) {
        return res.status(404).json({ error: "Sample not found" });
      }
      res.json({ status: sample.status, processedFormat: sample.processedFormat });
    } catch (error) {
      console.error("Error fetching sample status:", error);
      res.status(500).json({ error: "Failed to fetch sample status" });
    }
  });

  // Species detection and alerts
  app.get("/api/species/detected", async (req, res) => {
    try {
      const detections = await storage.getRecentDetections(50);
      res.json(detections);
    } catch (error) {
      console.error("Error fetching detections:", error);
      res.status(500).json({ error: "Failed to fetch species detections" });
    }
  });

  app.get("/api/species/distribution", async (req, res) => {
    try {
      const distribution = await storage.getSpeciesDistribution();
      res.json(distribution);
    } catch (error) {
      console.error("Error fetching species distribution:", error);
      res.status(500).json({ error: "Failed to fetch species distribution" });
    }
  });

  // Alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getRecentAlerts(20);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.get("/api/alerts/unread", async (req, res) => {
    try {
      const alerts = await storage.getUnreadAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching unread alerts:", error);
      res.status(500).json({ error: "Failed to fetch unread alerts" });
    }
  });

  app.patch("/api/alerts/:id/read", async (req, res) => {
    try {
      await storage.markAlertAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking alert as read:", error);
      res.status(500).json({ error: "Failed to mark alert as read" });
    }
  });

  // AI Predictions
  app.get("/api/predictions", async (req, res) => {
    try {
      const predictions = await storage.getRecentPredictions(10);
      res.json(predictions);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      res.status(500).json({ error: "Failed to fetch AI predictions" });
    }
  });

  app.post("/api/predictions/generate", isAuthenticated, async (req, res) => {
    try {
      const { location, timeframe } = req.body;
      
      if (!location || !timeframe) {
        return res.status(400).json({ error: "Location and timeframe are required" });
      }

      const prediction = await mlService.generatePrediction(location, timeframe);
      res.json(prediction);
    } catch (error) {
      console.error("Error generating prediction:", error);
      res.status(500).json({ error: "Failed to generate prediction" });
    }
  });

  // Citizen Science
  app.get("/api/citizens/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topUsers = await storage.getTopUsers(limit);
      res.json(topUsers);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch citizen science leaderboard" });
    }
  });

  app.get("/api/achievements/:userId", async (req, res) => {
    try {
      const achievements = await storage.getAchievementsByUser(req.params.userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  // File conversion
  app.post("/api/convert/tar-to-fasta", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!req.file.originalname.endsWith('.tar.gz')) {
        return res.status(400).json({ error: "File must be a .tar.gz archive" });
      }

      const outputPath = await fileProcessor.convertTarToFasta(req.file.path, req.file.originalname);
      
      res.download(outputPath, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          res.status(500).json({ error: "Failed to send converted file" });
        }
        // Clean up files
        fs.unlink(req.file!.path, () => {});
        fs.unlink(outputPath, () => {});
      });
    } catch (error) {
      console.error("Error converting file:", error);
      res.status(500).json({ error: "Failed to convert file" });
    }
  });

  // Real-time data endpoints
  app.get("/api/live/activity", async (req, res) => {
    try {
      // Simulate recent activity for real-time feed
      const [recentDetections, recentAlerts, recentSamples] = await Promise.all([
        storage.getRecentDetections(5),
        storage.getRecentAlerts(5),
        storage.getProcessingSamples()
      ]);

      const activity = [
        ...recentDetections.map(d => ({
          type: 'detection',
          timestamp: d.detectedAt,
          message: `New species detected`,
          data: d
        })),
        ...recentAlerts.map(a => ({
          type: 'alert',
          timestamp: a.createdAt,
          message: a.message,
          data: a
        })),
        ...recentSamples.map(s => ({
          type: 'processing',
          timestamp: s.uploadedAt,
          message: `Sample being processed`,
          data: s
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

      res.json(activity);
    } catch (error) {
      console.error("Error fetching live activity:", error);
      res.status(500).json({ error: "Failed to fetch live activity" });
    }
  });

  // Cleanup interval
  wss.on('close', () => {
    clearInterval(interval);
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  return httpServer;
}
