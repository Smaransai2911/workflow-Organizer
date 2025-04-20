
const { pgTable, text, serial, integer, boolean, timestamp, jsonb } = require("drizzle-orm/pg-core");
const { createInsertSchema } = require("drizzle-zod");
const { z } = require("zod");

// User table with enhanced password validation
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
});

const insertUserSchema = createInsertSchema(users)
  .extend({
    password: z.string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    email: z.string().email("Invalid email format"),
    username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username too long"),
    displayName: z.string().min(2, "Display name must be at least 2 characters")
  });

// Rest of your schema definitions...
const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  userId: integer("user_id").notNull(),
});

const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  progress: integer("progress").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  subjectId: integer("subject_id").notNull(),
  userId: integer("user_id").notNull(),
  priority: text("priority").notNull().default("medium"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  subjectId: integer("subject_id"),
  userId: integer("user_id").notNull(),
  type: text("type").notNull().default("event"),
});

const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  url: text("url"),
  subjectId: integer("subject_id").notNull(),
  userId: integer("user_id").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Enums
const TaskPriorityEnum = z.enum(["low", "medium", "high"]);
const SubjectColorEnum = z.enum([
  "green", "blue", "purple", "indigo", "amber", "red", "pink", "cyan", "teal", "orange"
]);
const ResourceTypeEnum = z.enum(["pdf", "document", "image", "video", "link", "other"]);

module.exports = {
  users,
  subjects,
  tasks,
  events,
  resources,
  insertUserSchema,
  TaskPriorityEnum,
  SubjectColorEnum,
  ResourceTypeEnum
};
