import { 
  type Student, type InsertStudent,
  type Aide, type InsertAide,
  type Activity, type InsertActivity,
  type Block, type InsertBlock,
  type Template, type InsertTemplate
} from "@shared/schema";
import { randomUUID } from "crypto";

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
  updateBlock(id: string, block: Partial<InsertBlock>): Promise<Block | undefined>;
  deleteBlock(id: string): Promise<boolean>;

  // Templates
  getTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  deleteTemplate(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private students: Map<string, Student> = new Map();
  private aides: Map<string, Aide> = new Map();
  private activities: Map<string, Activity> = new Map();
  private blocks: Map<string, Block> = new Map();
  private templates: Map<string, Template> = new Map();

  constructor() {
    // Initialize with empty data
  }

  // Students
  async getStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = { 
      ...insertStudent, 
      id, 
      createdAt: new Date() 
    };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: string, updateData: Partial<InsertStudent>): Promise<Student | undefined> {
    const existing = this.students.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updateData };
    this.students.set(id, updated);
    return updated;
  }

  async deleteStudent(id: string): Promise<boolean> {
    return this.students.delete(id);
  }

  // Aides
  async getAides(): Promise<Aide[]> {
    return Array.from(this.aides.values());
  }

  async getAide(id: string): Promise<Aide | undefined> {
    return this.aides.get(id);
  }

  async createAide(insertAide: InsertAide): Promise<Aide> {
    const id = randomUUID();
    const aide: Aide = { 
      ...insertAide, 
      id, 
      createdAt: new Date() 
    };
    this.aides.set(id, aide);
    return aide;
  }

  async updateAide(id: string, updateData: Partial<InsertAide>): Promise<Aide | undefined> {
    const existing = this.aides.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updateData };
    this.aides.set(id, updated);
    return updated;
  }

  async deleteAide(id: string): Promise<boolean> {
    return this.aides.delete(id);
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values());
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      createdAt: new Date() 
    };
    this.activities.set(id, activity);
    return activity;
  }

  async updateActivity(id: string, updateData: Partial<InsertActivity>): Promise<Activity | undefined> {
    const existing = this.activities.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updateData };
    this.activities.set(id, updated);
    return updated;
  }

  async deleteActivity(id: string): Promise<boolean> {
    return this.activities.delete(id);
  }

  // Blocks
  async getBlocks(date?: string): Promise<Block[]> {
    const allBlocks = Array.from(this.blocks.values());
    if (date) {
      return allBlocks.filter(block => block.date === date);
    }
    return allBlocks;
  }

  async getBlock(id: string): Promise<Block | undefined> {
    return this.blocks.get(id);
  }

  async createBlock(insertBlock: InsertBlock): Promise<Block> {
    const id = randomUUID();
    const block: Block = { 
      ...insertBlock, 
      id, 
      studentIds: insertBlock.studentIds || [],
      aideIds: insertBlock.aideIds || [],
      notes: insertBlock.notes || "",
      recurrence: insertBlock.recurrence || "none",
      createdAt: new Date() 
    };
    this.blocks.set(id, block);
    return block;
  }

  async updateBlock(id: string, updateData: Partial<InsertBlock>): Promise<Block | undefined> {
    const existing = this.blocks.get(id);
    if (!existing) return undefined;
    
    const updated: Block = { 
      ...existing, 
      ...updateData,
      studentIds: updateData.studentIds || existing.studentIds,
      aideIds: updateData.aideIds || existing.aideIds,
      notes: updateData.notes || existing.notes,
      recurrence: updateData.recurrence || existing.recurrence,
    };
    this.blocks.set(id, updated);
    return updated;
  }

  async deleteBlock(id: string): Promise<boolean> {
    return this.blocks.delete(id);
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = randomUUID();
    const template: Template = { 
      ...insertTemplate, 
      id, 
      createdAt: new Date() 
    };
    this.templates.set(id, template);
    return template;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.templates.delete(id);
  }
}

export const storage = new MemStorage();
