import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  provider: text("provider"), // 'google', 'github', 'email', etc.
  providerId: text("provider_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Edge device schema
export const devices = pgTable("devices", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'raspberry-pi', 'jetson', etc.
  ip: text("ip").notNull(),
  status: text("status").notNull().default("disconnected"), // 'connected', 'disconnected', 'connecting'
  specs: json("specs"), // CPU, memory, etc.
  userId: varchar("user_id").references(() => users.id),
  lastSeen: timestamp("last_seen").defaultNow(),
});

// Chat messages schema
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  deviceId: varchar("device_id").references(() => devices.id),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  images: json("images"), // Array of image URLs/paths
  debug: json("debug"), // Debug information
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
  provider: true,
  providerId: true,
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  userId: true,
  lastSeen: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
