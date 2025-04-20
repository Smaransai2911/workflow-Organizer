
const { drizzle } = require("drizzle-orm/postgres-js");
const postgres = require("postgres");
const { users, tasks, subjects, events, resources } = require("../shared/schema");

const connectionString = process.env.DATABASE_URL;

console.log("[DB] Connecting to database...");
const client = postgres(connectionString);
const db = drizzle(client);

console.log("[DB] Database connection established");

module.exports = { db };
