import { 
  User, InsertUser, 
  Subject, InsertSubject, 
  Task, InsertTask, 
  Event, InsertEvent, 
  Resource, InsertResource,
  users, subjects, tasks, events, resources 
} from "../shared/schema";
import { addDays, subDays, format, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";
import session from "express-session";
import { Store } from "express-session";
import connectPgSimple from "connect-pg-simple";
import { eq, and, lte, gte, asc, desc } from "drizzle-orm";
import { db, pool } from "./db";
import createMemoryStore from "memorystore";

const PostgresSessionStore = connectPgSimple(session);
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Subject methods
  getSubjects(userId: number): Promise<Subject[]>;
  getSubject(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<boolean>;
  
  // Task methods
  getTasks(userId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  getTasksBySubject(subjectId: number): Promise<Task[]>;
  getCompletedTasks(userId: number): Promise<Task[]>;
  getPendingTasks(userId: number): Promise<Task[]>;
  getDueTodayTasks(userId: number): Promise<Task[]>;
  getOverdueTasks(userId: number): Promise<Task[]>;
  getUpcomingTasks(userId: number, limit?: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Event methods
  getEvents(userId: number): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Resource methods
  getResources(userId: number): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  getResourcesBySubject(subjectId: number): Promise<Resource[]>;
  getRecentResources(userId: number, limit?: number): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined>;
  deleteResource(id: number): Promise<boolean>;
  
  // Analytics methods
  getTasksCountBySubject(userId: number): Promise<{subjectId: number, subjectName: string, color: string, count: number}[]>;
  
  // Session store
  sessionStore: Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private subjects: Map<number, Subject>;
  private tasks: Map<number, Task>;
  private events: Map<number, Event>;
  private resources: Map<number, Resource>;
  
  private userIdCounter: number;
  private subjectIdCounter: number;
  private taskIdCounter: number;
  private eventIdCounter: number;
  private resourceIdCounter: number;
  
  sessionStore: any; // Type 'any' to avoid TypeScript issues

  constructor() {
    this.users = new Map();
    this.subjects = new Map();
    this.tasks = new Map();
    this.events = new Map();
    this.resources = new Map();
    
    this.userIdCounter = 1;
    this.subjectIdCounter = 1;
    this.taskIdCounter = 1;
    this.eventIdCounter = 1;
    this.resourceIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Seed a default user
    this.createUser({
      username: "alex",
      password: "password",
      displayName: "Alex Johnson",
      email: "alex.johnson@university.edu"
    });
    
    // Seed some subjects
    const subjectNames = ["Science", "Math", "English", "Computer Science", "History", "Art"];
    const subjectColors = ["green", "blue", "purple", "indigo", "amber", "red"];
    
    for (let i = 0; i < subjectNames.length; i++) {
      this.createSubject({
        name: subjectNames[i],
        color: subjectColors[i],
        userId: 1
      });
    }
    
    // Seed some tasks
    const taskTitles = [
      "Research Paper: Environmental Science",
      "Calculus Quiz Preparation",
      "Literature Review: Shakespeare",
      "Programming Assignment: Java",
      "History Essay: World War II",
      "Art Project: Still Life Drawing"
    ];
    
    const taskDescriptions = [
      "Research and write a 5-page paper on climate change impacts",
      "Study chapters 4-6 and practice sample problems",
      "Read Hamlet and write a character analysis",
      "Implement a binary search tree in Java",
      "Write a 3-page essay on the causes of WWII",
      "Create a still life drawing using charcoal"
    ];
    
    const today = new Date();
    const dueDates = [
      addDays(today, 2), // 2 days from now
      addDays(today, 1), // tomorrow
      addDays(today, 3), // 3 days from now
      subDays(today, 1), // yesterday (overdue)
      addDays(today, 5), // 5 days from now
      addDays(today, 4)  // 4 days from now
    ];
    
    const progress = [75, 30, 60, 90, 20, 10];
    
    for (let i = 0; i < taskTitles.length; i++) {
      this.createTask({
        title: taskTitles[i],
        description: taskDescriptions[i],
        dueDate: dueDates[i],
        progress: progress[i],
        isCompleted: false,
        subjectId: i + 1,
        userId: 1,
        priority: i % 3 === 0 ? "high" : i % 3 === 1 ? "medium" : "low"
      });
    }
    
    // Seed some events
    const eventTitles = ["Math Quiz", "CS Project Due", "Study Group"];
    const eventDates = [
      new Date(2023, 9, 10), // Oct 10
      new Date(2023, 9, 12), // Oct 12
      new Date(2023, 9, 16), // Oct 16
    ];
    
    for (let i = 0; i < eventTitles.length; i++) {
      this.createEvent({
        title: eventTitles[i],
        date: eventDates[i],
        subjectId: i + 1,
        userId: 1,
        type: "deadline"
      });
    }
    
    // Seed some resources
    const resourceNames = [
      "Calculus Formulas.pdf",
      "Cell Structure Diagram.png",
      "Shakespeare Essay Notes.docx"
    ];
    
    const resourceTypes = ["pdf", "image", "document"];
    const resourceUrls = [
      "https://example.com/calculus-formulas.pdf",
      "https://example.com/cell-structure.png",
      "https://example.com/shakespeare-notes.docx"
    ];
    
    for (let i = 0; i < resourceNames.length; i++) {
      this.createResource({
        name: resourceNames[i],
        type: resourceTypes[i],
        url: resourceUrls[i],
        subjectId: i + 1,
        userId: 1
      });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Subject methods
  async getSubjects(userId: number): Promise<Subject[]> {
    return Array.from(this.subjects.values()).filter(
      (subject) => subject.userId === userId
    );
  }
  
  async getSubject(id: number): Promise<Subject | undefined> {
    return this.subjects.get(id);
  }
  
  async createSubject(subject: InsertSubject): Promise<Subject> {
    const id = this.subjectIdCounter++;
    const newSubject: Subject = { ...subject, id };
    this.subjects.set(id, newSubject);
    return newSubject;
  }
  
  async updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined> {
    const existingSubject = this.subjects.get(id);
    if (!existingSubject) return undefined;
    
    const updatedSubject = { ...existingSubject, ...subject };
    this.subjects.set(id, updatedSubject);
    return updatedSubject;
  }
  
  async deleteSubject(id: number): Promise<boolean> {
    return this.subjects.delete(id);
  }
  
  // Task methods
  async getTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId
    );
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTasksBySubject(subjectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.subjectId === subjectId
    );
  }
  
  async getCompletedTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId && task.isCompleted
    );
  }
  
  async getPendingTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId && !task.isCompleted
    );
  }
  
  async getDueTodayTasks(userId: number): Promise<Task[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    return Array.from(this.tasks.values()).filter(
      (task) => 
        task.userId === userId && 
        !task.isCompleted &&
        task.dueDate >= startOfDay &&
        task.dueDate <= endOfDay
    );
  }
  
  async getOverdueTasks(userId: number): Promise<Task[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return Array.from(this.tasks.values()).filter(
      (task) => 
        task.userId === userId && 
        !task.isCompleted &&
        task.dueDate < startOfDay
    );
  }
  
  async getUpcomingTasks(userId: number, limit: number = 5): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((task) => task.userId === userId && !task.isCompleted)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, limit);
  }
  
  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const newTask: Task = { 
      ...task, 
      id, 
      createdAt: new Date(),
      // Ensure required fields have default values if not provided
      progress: task.progress ?? 0,
      description: task.description ?? null,
      isCompleted: task.isCompleted ?? false,
      priority: task.priority ?? "medium"
    };
    this.tasks.set(id, newTask);
    return newTask;
  }
  
  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask = { ...existingTask, ...task };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  // Event methods
  async getEvents(userId: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.userId === userId
    );
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }
  
  async getEventsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => 
        event.userId === userId &&
        isAfter(event.date, startDate) &&
        isBefore(event.date, endDate)
    );
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const newEvent: Event = { 
      ...event, 
      id,
      // Ensure required fields have default values if not provided
      type: event.type ?? "deadline",
      subjectId: event.subjectId ?? null
    };
    this.events.set(id, newEvent);
    return newEvent;
  }
  
  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const existingEvent = this.events.get(id);
    if (!existingEvent) return undefined;
    
    const updatedEvent = { ...existingEvent, ...event };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }
  
  // Resource methods
  async getResources(userId: number): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter(
      (resource) => resource.userId === userId
    );
  }
  
  async getResource(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }
  
  async getResourcesBySubject(subjectId: number): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter(
      (resource) => resource.subjectId === subjectId
    );
  }
  
  async getRecentResources(userId: number, limit: number = 3): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter((resource) => resource.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }
  
  async createResource(resource: InsertResource): Promise<Resource> {
    const id = this.resourceIdCounter++;
    const newResource: Resource = { 
      ...resource, 
      id, 
      updatedAt: new Date(),
      // Ensure required fields have default values if not provided
      url: resource.url ?? null
    };
    this.resources.set(id, newResource);
    return newResource;
  }
  
  async updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined> {
    const existingResource = this.resources.get(id);
    if (!existingResource) return undefined;
    
    const updatedResource: Resource = { 
      ...existingResource, 
      ...resource, 
      updatedAt: new Date() 
    };
    this.resources.set(id, updatedResource);
    return updatedResource;
  }
  
  async deleteResource(id: number): Promise<boolean> {
    return this.resources.delete(id);
  }
  
  // Analytics methods
  async getTasksCountBySubject(userId: number): Promise<{subjectId: number, subjectName: string, color: string, count: number}[]> {
    const subjects = await this.getSubjects(userId);
    const result: {subjectId: number, subjectName: string, color: string, count: number}[] = [];
    
    for (const subject of subjects) {
      const tasks = await this.getTasksBySubject(subject.id);
      result.push({
        subjectId: subject.id,
        subjectName: subject.name,
        color: subject.color,
        count: tasks.length
      });
    }
    
    return result;
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }

  // Subject methods
  async getSubjects(userId: number): Promise<Subject[]> {
    return db.select().from(subjects).where(eq(subjects.userId, userId));
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [createdSubject] = await db.insert(subjects).values(subject).returning();
    return createdSubject;
  }

  async updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined> {
    const [updatedSubject] = await db.update(subjects)
      .set(subject)
      .where(eq(subjects.id, id))
      .returning();
    return updatedSubject;
  }

  async deleteSubject(id: number): Promise<boolean> {
    await db.delete(subjects).where(eq(subjects.id, id));
    return true; // If no error is thrown, we assume success
  }

  // Task methods
  async getTasks(userId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasksBySubject(subjectId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.subjectId, subjectId));
  }

  async getCompletedTasks(userId: number): Promise<Task[]> {
    return db.select().from(tasks).where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.isCompleted, true)
      )
    );
  }

  async getPendingTasks(userId: number): Promise<Task[]> {
    return db.select().from(tasks).where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.isCompleted, false)
      )
    );
  }

  async getDueTodayTasks(userId: number): Promise<Task[]> {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    return db.select().from(tasks).where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.isCompleted, false),
        gte(tasks.dueDate, todayStart),
        lte(tasks.dueDate, todayEnd)
      )
    );
  }

  async getOverdueTasks(userId: number): Promise<Task[]> {
    const today = new Date();
    const todayStart = startOfDay(today);

    return db.select().from(tasks).where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.isCompleted, false),
        lte(tasks.dueDate, todayStart)
      )
    );
  }

  async getUpcomingTasks(userId: number, limit: number = 5): Promise<Task[]> {
    return db.select().from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.isCompleted, false)
        )
      )
      .orderBy(asc(tasks.dueDate))
      .limit(limit);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [createdTask] = await db.insert(tasks).values(task).returning();
    return createdTask;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const [updatedTask] = await db.update(tasks)
      .set(task)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    await db.delete(tasks).where(eq(tasks.id, id));
    return true; // If no error is thrown, we assume success
  }

  // Event methods
  async getEvents(userId: number): Promise<Event[]> {
    return db.select().from(events).where(eq(events.userId, userId));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEventsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Event[]> {
    return db.select().from(events).where(
      and(
        eq(events.userId, userId),
        gte(events.date, startDate),
        lte(events.date, endDate)
      )
    );
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [createdEvent] = await db.insert(events).values(event).returning();
    return createdEvent;
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updatedEvent] = await db.update(events)
      .set(event)
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    await db.delete(events).where(eq(events.id, id));
    return true; // If no error is thrown, we assume success
  }

  // Resource methods
  async getResources(userId: number): Promise<Resource[]> {
    return db.select().from(resources).where(eq(resources.userId, userId));
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async getResourcesBySubject(subjectId: number): Promise<Resource[]> {
    return db.select().from(resources).where(eq(resources.subjectId, subjectId));
  }

  async getRecentResources(userId: number, limit: number = 3): Promise<Resource[]> {
    return db.select().from(resources)
      .where(eq(resources.userId, userId))
      .orderBy(desc(resources.updatedAt))
      .limit(limit);
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [createdResource] = await db.insert(resources).values(resource).returning();
    return createdResource;
  }

  async updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined> {
    const [updatedResource] = await db.update(resources)
      .set(resource)
      .where(eq(resources.id, id))
      .returning();
    return updatedResource;
  }

  async deleteResource(id: number): Promise<boolean> {
    await db.delete(resources).where(eq(resources.id, id));
    return true; // If no error is thrown, we assume success
  }

  // Analytics methods
  async getTasksCountBySubject(userId: number): Promise<{subjectId: number, subjectName: string, color: string, count: number}[]> {
    const result: {subjectId: number, subjectName: string, color: string, count: number}[] = [];
    const userSubjects = await this.getSubjects(userId);
    
    for (const subject of userSubjects) {
      const tasks = await this.getTasksBySubject(subject.id);
      result.push({
        subjectId: subject.id,
        subjectName: subject.name,
        color: subject.color,
        count: tasks.length
      });
    }
    
    return result;
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
