import { 
  type Student, type InsertStudent,
  type Aide, type InsertAide,
  type Activity, type InsertActivity,
  type Block, type InsertBlock,
  type Template, type InsertTemplate,
  students, aides, activities, blocks, templates
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Students
  getStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;

  // Aides
  getAides(): Promise<Aide[]>;
  getAide(id: string): Promise<Aide | undefined>;
  createAide(aide: InsertAide): Promise<Aide>;
  updateAide(id: string, aide: Partial<InsertAide>): Promise<Aide | undefined>;
  deleteAide(id: string): Promise<boolean>;

  // Activities
  getActivities(): Promise<Activity[]>;
  getActivity(id: string): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: string): Promise<boolean>;

  // Blocks
  getBlocks(date?: string): Promise<Block[]>;
  getBlock(id: string): Promise<Block | undefined>;
  createBlock(block: InsertBlock): Promise<Block>;
  createRecurringBlocks(blockData: InsertBlock, dates: string[]): Promise<Block[]>;
  updateBlock(id: string, block: Partial<InsertBlock>): Promise<Block | undefined>;
  deleteBlock(id: string): Promise<boolean>;

  // Templates
  getTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  deleteTemplate(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Students
  async getStudents(): Promise<Student[]> {
    return await db.select().from(students);
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async updateStudent(id: string, updateData: Partial<InsertStudent>): Promise<Student | undefined> {
    const [updated] = await db.update(students).set(updateData).where(eq(students.id, id)).returning();
    return updated || undefined;
  }

  async deleteStudent(id: string): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Aides
  async getAides(): Promise<Aide[]> {
    return await db.select().from(aides);
  }

  async getAide(id: string): Promise<Aide | undefined> {
    const [aide] = await db.select().from(aides).where(eq(aides.id, id));
    return aide || undefined;
  }

  async createAide(insertAide: InsertAide): Promise<Aide> {
    const [aide] = await db.insert(aides).values(insertAide).returning();
    return aide;
  }

  async updateAide(id: string, updateData: Partial<InsertAide>): Promise<Aide | undefined> {
    const [updated] = await db.update(aides).set(updateData).where(eq(aides.id, id)).returning();
    return updated || undefined;
  }

  async deleteAide(id: string): Promise<boolean> {
    const result = await db.delete(aides).where(eq(aides.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    return await db.select().from(activities);
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(insertActivity).returning();
    return activity;
  }

  async updateActivity(id: string, updateData: Partial<InsertActivity>): Promise<Activity | undefined> {
    const [updated] = await db.update(activities).set(updateData).where(eq(activities.id, id)).returning();
    return updated || undefined;
  }

  async deleteActivity(id: string): Promise<boolean> {
    const result = await db.delete(activities).where(eq(activities.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Blocks
  async getBlocks(date?: string): Promise<Block[]> {
    if (date) {
      return await db.select().from(blocks).where(eq(blocks.date, date));
    }
    return await db.select().from(blocks);
  }

  async getBlock(id: string): Promise<Block | undefined> {
    const [block] = await db.select().from(blocks).where(eq(blocks.id, id));
    return block || undefined;
  }

  async createBlock(insertBlock: InsertBlock): Promise<Block> {
    const [block] = await db.insert(blocks).values(insertBlock).returning();
    return block;
  }

  async createRecurringBlocks(blockData: InsertBlock, dates: string[]): Promise<Block[]> {
    return await db.transaction(async (tx) => {
      const createdBlocks: Block[] = [];
      
      try {
        for (const date of dates) {
          const blockForDate: InsertBlock = {
            startTime: blockData.startTime,
            endTime: blockData.endTime,
            activityId: blockData.activityId,
            studentIds: blockData.studentIds || [],
            aideIds: blockData.aideIds || [],
            notes: blockData.notes,
            recurrence: blockData.recurrence,
            date,
          };
          
          const [createdBlock] = await tx.insert(blocks).values(blockForDate).returning();
          createdBlocks.push(createdBlock);
        }
        
        return createdBlocks;
      } catch (error) {
        // Transaction will automatically rollback on error
        // All blocks created so far will be undone
        throw new Error(`Failed to create recurring blocks atomically: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  async updateBlock(id: string, updateData: Partial<InsertBlock>): Promise<Block | undefined> {
    const [updated] = await db.update(blocks).set(updateData).where(eq(blocks.id, id)).returning();
    return updated || undefined;
  }

  async deleteBlock(id: string): Promise<boolean> {
    const result = await db.delete(blocks).where(eq(blocks.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates);
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template || undefined;
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db.insert(templates).values(insertTemplate).returning();
    return template;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const result = await db.delete(templates).where(eq(templates.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
