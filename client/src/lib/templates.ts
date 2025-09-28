import { Block, Template, InsertTemplate } from "@shared/schema";

export function saveTemplate(name: string, blocks: Block[]): InsertTemplate {
  // Strip out IDs and dates to make template reusable
  const blockData = blocks.map(block => ({
    startTime: block.startTime,
    endTime: block.endTime,
    activityId: block.activityId,
    studentIds: block.studentIds,
    aideIds: block.aideIds,
    notes: block.notes,
    recurrence: block.recurrence,
  }));

  return {
    name,
    blockData: blockData as any[],
  };
}

export function loadTemplate(template: Template, targetDate: string): Omit<Block, 'id' | 'createdAt'>[] {
  return template.blockData.map(blockData => ({
    ...blockData,
    date: targetDate,
  }));
}

// Local storage functions for client-side template management
export function saveTemplateToLocalStorage(name: string, blocks: Block[]): void {
  const templates = getTemplatesFromLocalStorage();
  const template = saveTemplate(name, blocks);
  
  templates[name] = template;
  localStorage.setItem('alliboard-templates', JSON.stringify(templates));
}

export function getTemplatesFromLocalStorage(): Record<string, InsertTemplate> {
  const stored = localStorage.getItem('alliboard-templates');
  return stored ? JSON.parse(stored) : {};
}

export function loadTemplateFromLocalStorage(name: string, targetDate: string): Omit<Block, 'id' | 'createdAt'>[] | null {
  const templates = getTemplatesFromLocalStorage();
  const template = templates[name];
  
  if (!template) return null;
  
  return template.blockData.map((blockData: any) => ({
    ...blockData,
    date: targetDate,
  }));
}

export function deleteTemplateFromLocalStorage(name: string): void {
  const templates = getTemplatesFromLocalStorage();
  delete templates[name];
  localStorage.setItem('alliboard-templates', JSON.stringify(templates));
}

export function getTemplateNames(): string[] {
  const templates = getTemplatesFromLocalStorage();
  return Object.keys(templates);
}
