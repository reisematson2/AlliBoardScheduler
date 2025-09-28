import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertAideSchema, insertActivitySchema, insertBlockSchema, insertTemplateSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Students routes
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const data = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(data);
      res.json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid student data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create student" });
      }
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(id, data);
      if (!student) {
        res.status(404).json({ message: "Student not found" });
        return;
      }
      res.json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid student data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update student" });
      }
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteStudent(id);
      if (!deleted) {
        res.status(404).json({ message: "Student not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Aides routes
  app.get("/api/aides", async (req, res) => {
    try {
      const aides = await storage.getAides();
      res.json(aides);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch aides" });
    }
  });

  app.post("/api/aides", async (req, res) => {
    try {
      const data = insertAideSchema.parse(req.body);
      const aide = await storage.createAide(data);
      res.json(aide);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid aide data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create aide" });
      }
    }
  });

  app.put("/api/aides/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertAideSchema.partial().parse(req.body);
      const aide = await storage.updateAide(id, data);
      if (!aide) {
        res.status(404).json({ message: "Aide not found" });
        return;
      }
      res.json(aide);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid aide data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update aide" });
      }
    }
  });

  app.delete("/api/aides/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAide(id);
      if (!deleted) {
        res.status(404).json({ message: "Aide not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete aide" });
    }
  });

  // Activities routes
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const data = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(data);
      res.json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create activity" });
      }
    }
  });

  app.put("/api/activities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertActivitySchema.partial().parse(req.body);
      const activity = await storage.updateActivity(id, data);
      if (!activity) {
        res.status(404).json({ message: "Activity not found" });
        return;
      }
      res.json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update activity" });
      }
    }
  });

  app.delete("/api/activities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteActivity(id);
      if (!deleted) {
        res.status(404).json({ message: "Activity not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // Blocks routes
  app.get("/api/blocks", async (req, res) => {
    try {
      const { date } = req.query;
      const blocks = await storage.getBlocks(date as string);
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blocks" });
    }
  });

  app.post("/api/blocks", async (req, res) => {
    try {
      const data = insertBlockSchema.parse(req.body);
      const block = await storage.createBlock(data);
      res.json(block);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid block data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create block" });
      }
    }
  });

  app.put("/api/blocks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertBlockSchema.partial().parse(req.body);
      const block = await storage.updateBlock(id, data);
      if (!block) {
        res.status(404).json({ message: "Block not found" });
        return;
      }
      res.json(block);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid block data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update block" });
      }
    }
  });

  app.delete("/api/blocks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteBlock(id);
      if (!deleted) {
        res.status(404).json({ message: "Block not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete block" });
    }
  });

  // Templates routes
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const data = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(data);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid template data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create template" });
      }
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTemplate(id);
      if (!deleted) {
        res.status(404).json({ message: "Template not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
