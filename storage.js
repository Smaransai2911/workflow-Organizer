
const { db } = require("./db");
const { users } = require("../shared/schema");
const { eq } = require("drizzle-orm");

const storage = {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  },

  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
};

module.exports = { storage };
