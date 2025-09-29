import { 
  type Student, type InsertStudent,
  type Aide, type InsertAide,
  type Activity, type InsertActivity,
  type Block, type InsertBlock,
  type Template, type InsertTemplate
} from "@shared/schema";
import { type IStorage } from "./storage";

export class MemoryStorage implements IStorage {
  private students: Student[] = [];
  private aides: Aide[] = [];
  private activities: Activity[] = [];
  private blocks: Block[] = [];
  private templates: Template[] = [];

  // Students
  async getStudents(): Promise<Student[]> {
    return [...this.students];
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.find(s => s.id === id);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const student: Student = {
      id: crypto.randomUUID(),
      ...insertStudent,
      createdAt: new Date(),
    };
    this.students.push(student);
    return student;
  }

  async updateStudent(id: string, updateData: Partial<InsertStudent>): Promise<Student | undefined> {
    const index = this.students.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    
    this.students[index] = { ...this.students[index], ...updateData };
    return this.students[index];
  }

  async deleteStudent(id: string): Promise<boolean> {
    const index = this.students.findIndex(s => s.id === id);
    if (index === -1) return false;
    
    this.students.splice(index, 1);
    return true;
  }

  // Aides
  async getAides(): Promise<Aide[]> {
    return [...this.aides];
  }

  async getAide(id: string): Promise<Aide | undefined> {
    return this.aides.find(a => a.id === id);
  }

  async createAide(insertAide: InsertAide): Promise<Aide> {
    const aide: Aide = {
      id: crypto.randomUUID(),
      ...insertAide,
      createdAt: new Date(),
    };
    this.aides.push(aide);
    return aide;
  }

  async updateAide(id: string, updateData: Partial<InsertAide>): Promise<Aide | undefined> {
    const index = this.aides.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    this.aides[index] = { ...this.aides[index], ...updateData };
    return this.aides[index];
  }

  async deleteAide(id: string): Promise<boolean> {
    const index = this.aides.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    this.aides.splice(index, 1);
    return true;
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    return [...this.activities];
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    return this.activities.find(a => a.id === id);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const activity: Activity = {
      id: crypto.randomUUID(),
      ...insertActivity,
      createdAt: new Date(),
    };
    this.activities.push(activity);
    return activity;
  }

  async updateActivity(id: string, updateData: Partial<InsertActivity>): Promise<Activity | undefined> {
    const index = this.activities.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    this.activities[index] = { ...this.activities[index], ...updateData };
    return this.activities[index];
  }

  async deleteActivity(id: string): Promise<boolean> {
    const index = this.activities.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    this.activities.splice(index, 1);
    return true;
  }

  // Blocks
  async getBlocks(date?: string): Promise<Block[]> {
    if (date) {
      return this.blocks.filter(b => b.date === date);
    }
    return [...this.blocks];
  }

  async getBlock(id: string): Promise<Block | undefined> {
    return this.blocks.find(b => b.id === id);
  }

  async createBlock(insertBlock: InsertBlock): Promise<Block> {
    const block: Block = {
      id: crypto.randomUUID(),
      ...insertBlock,
      studentIds: (insertBlock.studentIds || []) as string[],
      aideIds: (insertBlock.aideIds || []) as string[],
      notes: insertBlock.notes || null,
      recurrence: insertBlock.recurrence || '{"type":"none"}',
      createdAt: new Date(),
    };
    this.blocks.push(block);
    return block;
  }

  async createRecurringBlocks(blockData: InsertBlock, dates: string[]): Promise<Block[]> {
    const createdBlocks: Block[] = [];
    
    for (const date of dates) {
      const block: Block = {
        id: crypto.randomUUID(),
        ...blockData,
        date,
        studentIds: (blockData.studentIds || []) as string[],
        aideIds: (blockData.aideIds || []) as string[],
        notes: blockData.notes || null,
        recurrence: blockData.recurrence || '{"type":"none"}',
        createdAt: new Date(),
      };
      this.blocks.push(block);
      createdBlocks.push(block);
    }
    
    return createdBlocks;
  }

  async updateBlock(id: string, updateData: Partial<InsertBlock>): Promise<Block | undefined> {
    const index = this.blocks.findIndex(b => b.id === id);
    if (index === -1) return undefined;
    
    const updatedBlock: Block = { 
      ...this.blocks[index], 
      ...updateData,
      studentIds: (updateData.studentIds || this.blocks[index].studentIds) as string[],
      aideIds: (updateData.aideIds || this.blocks[index].aideIds) as string[]
    };
    this.blocks[index] = updatedBlock;
    return updatedBlock;
  }

  async deleteBlock(id: string): Promise<boolean> {
    const index = this.blocks.findIndex(b => b.id === id);
    if (index === -1) return false;
    
    this.blocks.splice(index, 1);
    return true;
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    return [...this.templates];
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    return this.templates.find(t => t.id === id);
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const template: Template = {
      id: crypto.randomUUID(),
      ...insertTemplate,
      createdAt: new Date(),
    };
    this.templates.push(template);
    return template;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return false;
    
    this.templates.splice(index, 1);
    return true;
  }
}
