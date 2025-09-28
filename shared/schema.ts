import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Recurrence pattern schema
export const recurrencePatternSchema = z.object({
  type: z.enum(['none', 'daily', 'weekly', 'custom']),
  interval: z.number().min(1).optional(), // Every N days/weeks
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0-6 (Sunday-Saturday)
  endDate: z.string().optional(), // ISO date string for when recurrence ends
  maxOccurrences: z.number().min(1).optional(), // Max number of occurrences
});

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aides = pgTable("aides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blocks = pgTable("blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  activityId: varchar("activity_id").notNull(),
  studentIds: json("student_ids").$type<string[]>().notNull().default([]),
  aideIds: json("aide_ids").$type<string[]>().notNull().default([]),
  notes: text("notes").default(""),
  recurrence: text("recurrence").notNull().default('{"type":"none"}'),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  blockData: json("block_data").$type<any[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

export const insertAideSchema = createInsertSchema(aides).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertBlockSchema = createInsertSchema(blocks).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
});

export type RecurrencePattern = z.infer<typeof recurrencePatternSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Aide = typeof aides.$inferSelect;
export type InsertAide = z.infer<typeof insertAideSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Block = typeof blocks.$inferSelect;
export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
