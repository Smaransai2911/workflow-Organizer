
const express = require("express");
const { eq, and, desc, gte } = require("drizzle-orm");
const { db } = require("./db");
const { users, tasks, subjects, events, resources } = require("../shared/schema");

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Not authenticated" });
}

async function registerRoutes(app) {
  const router = express.Router();
  
  // Tasks routes
  router.get("/api/tasks/upcoming", isAuthenticated, async (req, res) => {
    const upcomingTasks = await db.select().from(tasks)
      .where(and(
        eq(tasks.userId, req.user.id),
        eq(tasks.isCompleted, false)
      ))
      .orderBy(desc(tasks.dueDate))
      .limit(5);
    res.json(upcomingTasks);
  });
  
  // Add other routes as needed...
  
  app.use(router);
  return app;
}

module.exports = { registerRoutes };
