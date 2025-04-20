import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertSubjectSchema, 
  insertTaskSchema, 
  insertEventSchema, 
  insertResourceSchema,
  TaskPriorityEnum,
  SubjectColorEnum,
  ResourceTypeEnum
} from "../shared/schema.js";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { setupAuth } from "./auth";
import path from "path";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Debug route to verify database connection
  app.get("/api/_debug/db-check", async (req, res) => {
    try {
      console.log("[DEBUG] Testing database connection");
      // Check if a test user exists
      const testUser = await storage.getUserByUsername("testuser");
      
      if (testUser) {
        console.log("[DEBUG] Test user exists:", testUser.id);
        return res.json({ 
          status: "success", 
          message: "Database connection working", 
          user: { id: testUser.id, username: testUser.username } 
        });
      }
      
      // Create a test user if it doesn't exist
      console.log("[DEBUG] Creating test user");
      const password = "password123"; // Simple test password
      
      // Import the password hashing function from auth.ts
      const { scrypt, randomBytes } = await import('crypto');
      const { promisify } = await import('util');
      const scryptAsync = promisify(scrypt);
      
      // Generate salt
      const salt = randomBytes(16).toString("hex");
      // Hash the password
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      // Format as hash.salt
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      
      const newUser = await storage.createUser({
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
        password: hashedPassword
      });
      
      console.log("[DEBUG] Test user created:", newUser.id);
      return res.json({ 
        status: "success", 
        message: "Created test user", 
        user: { id: newUser.id, username: newUser.username } 
      });
    } catch (error) {
      console.error("[DEBUG] Database test error:", error);
      return res.status(500).json({ 
        status: "error", 
        message: "Database error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Set up authentication
  setupAuth(app);
  
  // User routes are handled by auth.ts
  // We'll just have a route to get a user by ID
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = parseInt(req.params.id);
      
      // Only allow users to get their own profile
      if (req.user?.id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve user" });
    }
  });
  
  // Auth middleware for protected routes
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized - Please login" });
  };

  // Subject routes
  app.get("/api/subjects", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const subjects = await storage.getSubjects(userId);
      return res.status(200).json(subjects);
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve subjects" });
    }
  });
  
  app.post("/api/subjects", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSubjectSchema
        .extend({
          color: SubjectColorEnum
        })
        .parse({
          ...req.body,
          userId: req.user!.id // Add the authenticated user's ID
        });
      
      const subject = await storage.createSubject(validatedData);
      return res.status(201).json(subject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subject data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create subject" });
    }
  });
  
  app.put("/api/subjects/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const subjectId = parseInt(req.params.id);
      const existingSubject = await storage.getSubject(subjectId);
      
      if (!existingSubject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      const validatedData = insertSubjectSchema
        .extend({
          color: SubjectColorEnum
        })
        .partial()
        .parse(req.body);
      
      const updatedSubject = await storage.updateSubject(subjectId, validatedData);
      return res.status(200).json(updatedSubject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subject data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to update subject" });
    }
  });
  
  app.delete("/api/subjects/:id", async (req: Request, res: Response) => {
    try {
      const subjectId = parseInt(req.params.id);
      const existingSubject = await storage.getSubject(subjectId);
      
      if (!existingSubject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      await storage.deleteSubject(subjectId);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete subject" });
    }
  });
  
  // Task routes
  app.get("/api/tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const tasks = await storage.getTasks(userId);
      return res.status(200).json(tasks);
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve tasks" });
    }
  });
  
  app.get("/api/tasks/upcoming", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      const tasks = await storage.getUpcomingTasks(userId, limit);
      
      // Fetch the subject for each task
      const tasksWithSubject = await Promise.all(tasks.map(async (task) => {
        const subject = await storage.getSubject(task.subjectId);
        return {
          ...task,
          subject: subject
        };
      }));
      
      return res.status(200).json(tasksWithSubject);
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve upcoming tasks" });
    }
  });
  
  app.get("/api/tasks/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      const completedTasks = await storage.getCompletedTasks(userId);
      const pendingTasks = await storage.getPendingTasks(userId);
      const dueTodayTasks = await storage.getDueTodayTasks(userId);
      const overdueTasks = await storage.getOverdueTasks(userId);
      
      return res.status(200).json({
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        dueToday: dueTodayTasks.length,
        overdue: overdueTasks.length
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve task statistics" });
    }
  });
  
  app.post("/api/tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertTaskSchema
        .extend({
          dueDate: z.coerce.date(),
          priority: TaskPriorityEnum
        })
        .parse({
          ...req.body,
          userId: req.user!.id // Add the authenticated user's ID
        });
      
      const task = await storage.createTask(validatedData);
      return res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create task" });
    }
  });
  
  app.put("/api/tasks/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const existingTask = await storage.getTask(taskId);
      
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if the task belongs to the authenticated user
      if (existingTask.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden: You don't have permission to update this task" });
      }
      
      const validatedData = insertTaskSchema
        .extend({
          dueDate: z.coerce.date(),
          priority: TaskPriorityEnum
        })
        .partial()
        .parse(req.body);
      
      const updatedTask = await storage.updateTask(taskId, validatedData);
      return res.status(200).json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to update task" });
    }
  });
  
  app.delete("/api/tasks/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const existingTask = await storage.getTask(taskId);
      
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if the task belongs to the authenticated user
      if (existingTask.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden: You don't have permission to delete this task" });
      }
      
      await storage.deleteTask(taskId);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete task" });
    }
  });
  
  // Event routes
  app.get("/api/events", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // If start and end dates are provided, get events in that range
      if (req.query.startDate && req.query.endDate) {
        const startDate = parseISO(req.query.startDate as string);
        const endDate = parseISO(req.query.endDate as string);
        
        const events = await storage.getEventsByDateRange(userId, startDate, endDate);
        return res.status(200).json(events);
      }
      
      // Otherwise return all events
      const events = await storage.getEvents(userId);
      return res.status(200).json(events);
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve events" });
    }
  });
  
  app.post("/api/events", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertEventSchema
        .extend({
          date: z.coerce.date()
        })
        .parse({
          ...req.body,
          userId: req.user!.id // Add the authenticated user's ID
        });
      
      const event = await storage.createEvent(validatedData);
      return res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create event" });
    }
  });
  
  app.put("/api/events/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const existingEvent = await storage.getEvent(eventId);
      
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check if the event belongs to the authenticated user
      if (existingEvent.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden: You don't have permission to update this event" });
      }
      
      const validatedData = insertEventSchema
        .extend({
          date: z.coerce.date()
        })
        .partial()
        .parse(req.body);
      
      const updatedEvent = await storage.updateEvent(eventId, validatedData);
      return res.status(200).json(updatedEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to update event" });
    }
  });
  
  app.delete("/api/events/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const existingEvent = await storage.getEvent(eventId);
      
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check if the event belongs to the authenticated user
      if (existingEvent.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden: You don't have permission to delete this event" });
      }
      
      await storage.deleteEvent(eventId);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete event" });
    }
  });
  
  // Resource routes
  app.get("/api/resources", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const resources = await storage.getResources(userId);
      return res.status(200).json(resources);
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve resources" });
    }
  });
  
  app.get("/api/resources/recent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      
      const resources = await storage.getRecentResources(userId, limit);
      
      // Fetch the subject for each resource
      const resourcesWithSubject = await Promise.all(resources.map(async (resource) => {
        const subject = await storage.getSubject(resource.subjectId);
        return {
          ...resource,
          subject: subject
        };
      }));
      
      return res.status(200).json(resourcesWithSubject);
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve recent resources" });
    }
  });
  
  app.post("/api/resources", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertResourceSchema
        .extend({
          type: ResourceTypeEnum
        })
        .parse({
          ...req.body,
          userId: req.user!.id // Add the authenticated user's ID
        });
      
      const resource = await storage.createResource(validatedData);
      return res.status(201).json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid resource data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create resource" });
    }
  });
  
  app.put("/api/resources/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const resourceId = parseInt(req.params.id);
      const existingResource = await storage.getResource(resourceId);
      
      if (!existingResource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Check if the resource belongs to the authenticated user
      if (existingResource.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden: You don't have permission to update this resource" });
      }
      
      const validatedData = insertResourceSchema
        .extend({
          type: ResourceTypeEnum
        })
        .partial()
        .parse(req.body);
      
      const updatedResource = await storage.updateResource(resourceId, validatedData);
      return res.status(200).json(updatedResource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid resource data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to update resource" });
    }
  });
  
  app.delete("/api/resources/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const resourceId = parseInt(req.params.id);
      const existingResource = await storage.getResource(resourceId);
      
      if (!existingResource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Check if the resource belongs to the authenticated user
      if (existingResource.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden: You don't have permission to delete this resource" });
      }
      
      await storage.deleteResource(resourceId);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete resource" });
    }
  });
  
  // Analytics routes
  app.get("/api/analytics/tasks-by-subject", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const tasksBySubject = await storage.getTasksCountBySubject(userId);
      return res.status(200).json(tasksBySubject);
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve analytics data" });
    }
  });
  
  // Serve static files from public directory
  const publicPath = path.join(process.cwd(), 'public');
  app.use(express.static(publicPath));
  
  // Fallback route for SPA
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: "API endpoint not found" });
    }
    
    // Send the main HTML file for any other route
    res.sendFile(path.join(publicPath, 'index.html'));
  });
  
  return httpServer;
}
