import { Block, Student, Aide } from "@shared/schema";
import { timeToMinutes } from "./time-utils";

export interface ConflictInfo {
  type: "student" | "aide";
  conflictingBlocks: string[];
  conflictingEntities: string[];
}

export function detectConflicts(
  blocks: Block[],
  students: Student[],
  aides: Aide[]
): Map<string, ConflictInfo> {
  const conflicts = new Map<string, ConflictInfo>();

  // Group blocks by date
  const blocksByDate = blocks.reduce((acc, block) => {
    if (!acc[block.date]) {
      acc[block.date] = [];
    }
    acc[block.date].push(block);
    return acc;
  }, {} as Record<string, Block[]>);

  // Check conflicts for each date
  Object.entries(blocksByDate).forEach(([date, dateBlocks]) => {
    checkStudentConflicts(dateBlocks, students, conflicts);
    checkAideConflicts(dateBlocks, aides, conflicts);
  });

  return conflicts;
}

function checkStudentConflicts(
  blocks: Block[],
  students: Student[],
  conflicts: Map<string, ConflictInfo>
) {
  students.forEach(student => {
    const studentBlocks = blocks.filter(block => 
      block.studentIds.includes(student.id)
    );

    for (let i = 0; i < studentBlocks.length; i++) {
      for (let j = i + 1; j < studentBlocks.length; j++) {
        const block1 = studentBlocks[i];
        const block2 = studentBlocks[j];

        if (blocksOverlap(block1, block2)) {
          // Add conflict for block1
          const conflict1 = conflicts.get(block1.id) || {
            type: "student",
            conflictingBlocks: [],
            conflictingEntities: []
          };
          
          if (!conflict1.conflictingBlocks.includes(block2.id)) {
            conflict1.conflictingBlocks.push(block2.id);
          }
          if (!conflict1.conflictingEntities.includes(student.id)) {
            conflict1.conflictingEntities.push(student.id);
          }
          conflicts.set(block1.id, conflict1);

          // Add conflict for block2
          const conflict2 = conflicts.get(block2.id) || {
            type: "student",
            conflictingBlocks: [],
            conflictingEntities: []
          };
          
          if (!conflict2.conflictingBlocks.includes(block1.id)) {
            conflict2.conflictingBlocks.push(block1.id);
          }
          if (!conflict2.conflictingEntities.includes(student.id)) {
            conflict2.conflictingEntities.push(student.id);
          }
          conflicts.set(block2.id, conflict2);
        }
      }
    }
  });
}

function checkAideConflicts(
  blocks: Block[],
  aides: Aide[],
  conflicts: Map<string, ConflictInfo>
) {
  aides.forEach(aide => {
    const aideBlocks = blocks.filter(block => 
      block.aideIds.includes(aide.id)
    );

    for (let i = 0; i < aideBlocks.length; i++) {
      for (let j = i + 1; j < aideBlocks.length; j++) {
        const block1 = aideBlocks[i];
        const block2 = aideBlocks[j];

        if (blocksOverlap(block1, block2)) {
          // Add conflict for block1
          const conflict1 = conflicts.get(block1.id) || {
            type: "aide",
            conflictingBlocks: [],
            conflictingEntities: []
          };
          
          if (!conflict1.conflictingBlocks.includes(block2.id)) {
            conflict1.conflictingBlocks.push(block2.id);
          }
          if (!conflict1.conflictingEntities.includes(aide.id)) {
            conflict1.conflictingEntities.push(aide.id);
          }
          conflicts.set(block1.id, conflict1);

          // Add conflict for block2
          const conflict2 = conflicts.get(block2.id) || {
            type: "aide",
            conflictingBlocks: [],
            conflictingEntities: []
          };
          
          if (!conflict2.conflictingBlocks.includes(block1.id)) {
            conflict2.conflictingBlocks.push(block1.id);
          }
          if (!conflict2.conflictingEntities.includes(aide.id)) {
            conflict2.conflictingEntities.push(aide.id);
          }
          conflicts.set(block2.id, conflict2);
        }
      }
    }
  });
}

function blocksOverlap(block1: Block, block2: Block): boolean {
  const start1 = timeToMinutes(block1.startTime);
  const end1 = timeToMinutes(block1.endTime);
  const start2 = timeToMinutes(block2.startTime);
  const end2 = timeToMinutes(block2.endTime);

  return start1 < end2 && start2 < end1;
}
