import React, { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  useDraggable, 
  useDroppable
} from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Custom Droppable component for dnd-kit
interface DroppableProps {
  children: (provided: any, snapshot: any) => React.ReactNode;
  droppableId: string;
}

function Droppable({ children, droppableId }: DroppableProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
  });

  const provided = {
    droppableProps: {
      ref: setNodeRef,
    },
    innerRef: setNodeRef,
  };

  const snapshot = {
    isDraggingOver: isOver,
  };

  return (
    <div ref={setNodeRef} data-droppable-id={droppableId}>
      {children(provided, snapshot)}
    </div>
  );
}

// Custom Draggable component for dnd-kit
interface DraggableProps {
  children: (provided: any, snapshot: any) => React.ReactNode;
  draggableId: string;
  index: number;
}

function Draggable({ children, draggableId, index }: DraggableProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const provided = {
    draggableProps: {
      ...attributes,
      style,
    },
    dragHandleProps: listeners,
    innerRef: setNodeRef,
  };

  const snapshot = {
    isDragging,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(provided, snapshot)}
    </div>
  );
}

// Droppable Block Component
interface DroppableBlockProps {
  block: Block;
  blockStyle: any;
  onBlockClick: (block: Block) => void;
  onResizeStart: (blockId: string, type: 'top' | 'bottom', e: React.MouseEvent) => void;
  activity: any;
  conflict: any;
  getStudent: (id: string) => any;
  getAide: (id: string) => any;
  getEntityBadgeClass: (color: string) => string;
  getBlockTooltipContent: (block: Block) => React.ReactNode;
  formatTimeDisplay: (time: string) => string;
}

function DroppableBlock({ 
  block, 
  blockStyle, 
  onBlockClick, 
  onResizeStart,
  activity,
  conflict,
  getStudent,
  getAide,
  getEntityBadgeClass,
  getBlockTooltipContent,
  formatTimeDisplay
}: DroppableBlockProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `block-${block.id}`,
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            className={`${blockStyle.className} ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
            style={{
              ...blockStyle.style,
              pointerEvents: 'auto',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onBlockClick(block);
            }}
            data-testid={`block-${block.id}`}
          >
            {/* Top resize handle */}
            <div
              className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-200/20 transition-colors z-20"
              onMouseDown={(e) => onResizeStart(block.id, 'top', e)}
              title="Resize from top"
            />
            
            {/* Bottom resize handle */}
            <div
              className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-200/20 transition-colors z-20"
              onMouseDown={(e) => onResizeStart(block.id, 'bottom', e)}
              title="Resize from bottom"
            />
            
            <div className="flex items-center justify-between mb-1">
              {conflict && (
                <div className="text-xs text-destructive">
                  {conflict.type === "aide" ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                </div>
              )}
            </div>
            
            <div className="flex h-full">
              {/* Left side: Activity name and time */}
              <div className="flex flex-col flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground line-clamp-1">
                  {activity?.title || "Unknown Activity"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTimeDisplay(block.startTime)} - {formatTimeDisplay(block.endTime)}
                </div>
              </div>
              
              {/* Right side: Names */}
              <div className="flex flex-col gap-0.5 ml-2 max-h-full overflow-hidden">
                {(() => {
                  // Calculate how many names we can fit based on block duration
                  const durationMinutes = timeToMinutes(block.endTime) - timeToMinutes(block.startTime);
                  
                  // Estimate how many names can fit based on block duration
                  // Longer blocks can fit more names
                  let maxNames = 2; // Default minimum
                  if (durationMinutes >= 60) maxNames = 4; // 1+ hour blocks
                  else if (durationMinutes >= 45) maxNames = 3; // 45+ minute blocks
                  else if (durationMinutes >= 30) maxNames = 2; // 30+ minute blocks
                  
                  // Get all names (students first, then aides)
                  const allNames = [
                    ...block.studentIds.map(id => ({ id, type: 'student', entity: getStudent(id) })),
                    ...block.aideIds.map(id => ({ id, type: 'aide', entity: getAide(id) }))
                  ].filter(item => item.entity);
                  
                  // Calculate how many names we can actually display
                  let namesToShow = Math.min(maxNames, allNames.length);
                  
                  // If we have space, try to fit more names by checking actual text length
                  if (namesToShow < allNames.length) {
                    const totalTextLength = allNames.slice(0, namesToShow).reduce((sum, item) => 
                      sum + (item.entity?.name?.length || 0), 0
                    );
                    const avgTextLength = totalTextLength / namesToShow;
                    
                    // If names are short, we might be able to fit more
                    if (avgTextLength < 8 && namesToShow < allNames.length) {
                      namesToShow = Math.min(namesToShow + 1, allNames.length);
                    }
                  }
                  
                  const visibleNames = allNames.slice(0, namesToShow);
                  const remainingCount = allNames.length - namesToShow;
                  
                  return (
                    <>
                      {visibleNames.map(({ id, type, entity }) => (
                        <div
                          key={id}
                          className={`text-xs px-1 py-0.5 rounded ${
                            type === 'aide' ? 'border ' : ''
                          }${getEntityBadgeClass(entity.color)} truncate leading-tight`}
                          data-testid={`${type}-badge-${entity.id}`}
                        >
                          {entity.name}
                        </div>
                      ))}
                      {remainingCount > 0 && (
                        <div className="text-xs px-1 py-0.5 rounded border text-muted-foreground bg-muted/50 leading-tight">
                          +{remainingCount}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {getBlockTooltipContent(block)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
import { 
  StickyNote, 
  GripVertical, 
  AlertTriangle, 
  AlertCircle,
  Plus,
  Calendar
} from "lucide-react";
import { Block, Student, Aide, Activity } from "@shared/schema";
import { BlockModal } from "./block-modal";
import { 
  formatTimeDisplay, 
  getBlockPosition, 
  generateTimeSlots,
  timeToMinutes,
  getCurrentDate
} from "@/lib/time-utils";
import { detectConflicts } from "@/lib/conflicts";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Helper functions for week view
const getWeekDates = (selectedDate: string): string[] => {
  const date = new Date(selectedDate + 'T00:00:00'); // Ensure we're working with local time
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Find the Monday of the week containing the selected date
  const startOfWeek = new Date(date);
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, so go back 6 days to get Monday
  startOfWeek.setDate(date.getDate() + daysToMonday);
  
  const weekDates = [];
  for (let i = 0; i < 5; i++) { // Only 5 days: Monday to Friday
    const currentDate = new Date(startOfWeek);
    currentDate.setDate(startOfWeek.getDate() + i);
    weekDates.push(currentDate.toISOString().split('T')[0]);
  }
  return weekDates;
};

const getDayNames = (): string[] => {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
};

// Improved time grid generation with half-hour intervals
const generateImprovedTimeSlots = (startHour: number, endHour: number) => {
  const slots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    // Add hour slot
    slots.push({
      time: `${hour.toString().padStart(2, "0")}:00`,
      isHour: true,
      displayTime: formatTimeDisplay(`${hour.toString().padStart(2, "0")}:00`)
    });
    
    // Add half-hour slot (except for the last hour)
    if (hour < endHour) {
      slots.push({
        time: `${hour.toString().padStart(2, "0")}:30`,
        isHour: false,
        displayTime: ""
      });
    }
  }
  return slots;
};

// Dynamic height calculation based on container size
const useDynamicHeight = (containerRef: React.RefObject<HTMLDivElement>, startHour: number = 8, endHour: number = 18, dataLoaded: boolean = false) => {
  const [heightPerHour, setHeightPerHour] = useState(60); // Default fallback
  
  const updateHeight = React.useCallback(() => {
    if (containerRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      const totalHours = endHour - startHour;
      const availableHeight = containerHeight - 100; // Reserve space for header/padding
      const calculatedHeightPerHour = Math.max(40, availableHeight / totalHours); // Minimum 40px per hour
      setHeightPerHour(calculatedHeightPerHour);
    }
  }, [containerRef, startHour, endHour]);
  
  // Use useLayoutEffect for immediate updates
  React.useLayoutEffect(() => {
    updateHeight();
  }, [updateHeight, dataLoaded]);
  
  // Also use ResizeObserver for window resize events
  React.useEffect(() => {
    const resizeObserver = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // Also listen to window resize as a fallback
    window.addEventListener('resize', updateHeight);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [updateHeight]);
  
  return heightPerHour;
};

// Improved block positioning with dynamic height calculation
const getImprovedBlockPosition = (startTime: string, endTime: string, heightPerHour: number, startHour: number = 8) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const duration = endMinutes - startMinutes;
  
  const pixelsPerMinute = heightPerHour / 60;
  
  // Calculate position from start hour (8 AM = 0px)
  const startOffsetMinutes = startMinutes - (startHour * 60);
  const top = Math.max(0, startOffsetMinutes * pixelsPerMinute) - 3; // Move up 3px to align with grid lines
  const height = Math.max(32, duration * pixelsPerMinute);
  
  return {
    top,
    height
  };
};

interface ScheduleGridProps {
  selectedDate: string;
  viewMode: "master" | "student" | "aide";
  selectedEntityId?: string;
  calendarView: "day" | "week";
}

export function ScheduleGrid({ selectedDate, viewMode, selectedEntityId, calendarView }: ScheduleGridProps) {
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [newBlockTime, setNewBlockTime] = useState<{ start: string; end: string } | null>(null);
  const [resizingBlock, setResizingBlock] = useState<{ id: string; type: 'top' | 'bottom'; startY: number; originalBlock: Block } | null>(null);
  const [optimisticBlocks, setOptimisticBlocks] = useState<Map<string, Block>>(new Map());
  const [forceRecalculate, setForceRecalculate] = useState(0);
  const resizeDraftRef = useRef<Block | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Calculate dates to fetch based on calendar view
  const datesToFetch = useMemo(() => {
    if (calendarView === "week") {
      return getWeekDates(selectedDate);
    } else {
      // For daily view, use selected date
      return [selectedDate];
    }
  }, [calendarView, selectedDate]);

  // Fetch blocks for all relevant dates
  const { data: allBlocks = [], isLoading: blocksLoading } = useQuery<Block[]>({
    queryKey: ["/api/blocks", calendarView, selectedDate],
    queryFn: async () => {
      if (calendarView === "day") {
        // For daily view, use selected date
        const res = await fetch(`/api/blocks?date=${selectedDate}`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        return res.json();
      } else {
        // Week view - fetch blocks for all days in the week
        const promises = datesToFetch.map(date => 
          fetch(`/api/blocks?date=${date}`, { credentials: "include" })
            .then(res => res.ok ? res.json() : [])
        );
        const results = await Promise.all(promises);
        return results.flat();
      }
    },
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: aides = [] } = useQuery<Aide[]>({
    queryKey: ["/api/aides"],
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const updateBlockMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      console.log('updateBlockMutation called with:', { id, data });
      return apiRequest("PUT", `/api/blocks/${id}`, data);
    },
    onSuccess: (result) => {
      console.log('updateBlockMutation success:', result);
      // Invalidate cache with all relevant variables
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      toast({ title: "Block updated successfully" });
    },
    onError: (error) => {
      console.error('updateBlockMutation error:', error);
      toast({ title: "Failed to update block", variant: "destructive" });
    },
  });

  // Use improved time slots with half-hour intervals
  const timeSlots = generateImprovedTimeSlots(8, 18);
  const heightPerHour = useDynamicHeight(containerRef, 8, 18, forceRecalculate > 0);
  const conflicts = detectConflicts(allBlocks, students, aides);

  // Force recalculation when data loads or changes
  React.useEffect(() => {
    if (!blocksLoading && allBlocks.length >= 0) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        setForceRecalculate(prev => prev + 1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [blocksLoading, allBlocks.length]);

  // Also trigger recalculation on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setForceRecalculate(prev => prev + 1);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const filteredBlocks = useMemo(() => {
    // Merge optimistic updates with server data
    const mergedBlocks = allBlocks.map(block => 
      optimisticBlocks.get(block.id) || block
    );
    
    // For daily view, only show blocks for the selected date
    const dateFilteredBlocks = calendarView === "day" 
      ? mergedBlocks.filter(block => block.date === selectedDate)
      : mergedBlocks;
    
    if (viewMode === "master") return dateFilteredBlocks;
    
    if (viewMode === "student" && selectedEntityId) {
      return dateFilteredBlocks.filter(block => block.studentIds.includes(selectedEntityId));
    }
    
    if (viewMode === "aide" && selectedEntityId) {
      return dateFilteredBlocks.filter(block => block.aideIds.includes(selectedEntityId));
    }
    
    return dateFilteredBlocks;
  }, [allBlocks, viewMode, selectedEntityId, optimisticBlocks, calendarView]);

  const getActivity = (activityId: string) => {
    // Handle custom activities (stored as "custom:Activity Name")
    if (activityId.startsWith('custom:')) {
      const customName = activityId.replace('custom:', '');
      return {
        id: activityId,
        title: customName,
        color: 'gray', // Default color for custom activities
        description: ''
      };
    }
    return activities.find(a => a.id === activityId);
  };

  const getStudent = (studentId: string) => {
    return students.find(s => s.id === studentId);
  };

  const getAide = (aideId: string) => {
    return aides.find(a => a.id === aideId);
  };

  const groupOverlappingBlocks = (blocks: Block[]) => {
    const groups: Block[][] = [];
    const processed = new Set<string>();
    
    blocks.forEach(block => {
      if (processed.has(block.id)) return;
      
      const group: Block[] = [block];
      processed.add(block.id);
      
      // Find all blocks that overlap with this one
      blocks.forEach(otherBlock => {
        if (processed.has(otherBlock.id)) return;
        
        const blockStart = timeToMinutes(block.startTime);
        const blockEnd = timeToMinutes(block.endTime);
        const otherStart = timeToMinutes(otherBlock.startTime);
        const otherEnd = timeToMinutes(otherBlock.endTime);
        
        // Check if blocks overlap in time
        if (blockStart < otherEnd && blockEnd > otherStart) {
          group.push(otherBlock);
          processed.add(otherBlock.id);
        }
      });
      
      groups.push(group);
    });
    
    return groups;
  };

  const getBlockStyle = (block: Block, columnIndex?: number, blockIndex?: number) => {
    const position = getImprovedBlockPosition(block.startTime, block.endTime, heightPerHour, 8);
    const activity = getActivity(block.activityId);
    const conflict = conflicts.get(block.id);
    
    let className = "schedule-block absolute rounded-md p-2 m-1 cursor-pointer shadow-sm border-l-4 ";
    
    if (activity) {
      const colorMap: Record<string, string> = {
        blue: "bg-blue-100 border-blue-500 dark:bg-blue-900/30",
        green: "bg-green-100 border-green-500 dark:bg-green-900/30", 
        purple: "bg-purple-100 border-purple-500 dark:bg-purple-900/30",
        orange: "bg-orange-100 border-orange-500 dark:bg-orange-900/30",
        teal: "bg-teal-100 border-teal-500 dark:bg-teal-900/30",
        indigo: "bg-indigo-100 border-indigo-500 dark:bg-indigo-900/30",
        pink: "bg-pink-100 border-pink-500 dark:bg-pink-900/30",
        yellow: "bg-yellow-100 border-yellow-500 dark:bg-yellow-900/30",
        red: "bg-red-100 border-red-500 dark:bg-red-900/30",
      };
      className += colorMap[activity.color] || "bg-gray-100 border-gray-500 dark:bg-gray-900/30";
    }
    
    if (conflict) {
      if (conflict.type === "aide") {
        className += " conflict-aide";
      } else {
        className += " conflict-student";
      }
    }

    // Calculate overlapping blocks for side-by-side layout
    const overlappingBlocks = filteredBlocks.filter(otherBlock => {
      if (otherBlock.id === block.id) return false;
      if (otherBlock.date !== block.date) return false;
      
      const blockStart = timeToMinutes(block.startTime);
      const blockEnd = timeToMinutes(block.endTime);
      const otherStart = timeToMinutes(otherBlock.startTime);
      const otherEnd = timeToMinutes(otherBlock.endTime);
      
      // Check if blocks overlap in time
      return (blockStart < otherEnd && blockEnd > otherStart);
    });

    const totalOverlapping = overlappingBlocks.length + 1; // +1 for current block
    const blockWidth = 100 / totalOverlapping; // Percentage width
    const blockLeft = (blockIndex || 0) * blockWidth; // Position within the group

    // Week view: blocks are constrained within their column
    // Day view: blocks span the full width with left/right margins
    const baseStyle = {
      top: `${position.top}px`,
      height: `${position.height}px`,
      minHeight: "48px",
      zIndex: 10,
    };

    if (calendarView === "week" && columnIndex !== undefined) {
      // In week view, blocks are positioned relative to their column
      // No header offset needed - already positioned within day container
      return {
        className,
        style: {
          ...baseStyle,
          left: "4px",
          right: "4px",
          zIndex: 10, // Above droppable areas
          // Blocks are contained within their respective day column
        },
      };
    } else {
      // Day view: use side-by-side layout for overlapping blocks
      return {
        className,
        style: {
          ...baseStyle,
          left: `${blockLeft}%`,
          width: `${blockWidth}%`,
          zIndex: 10, // Above droppable areas
        },
      };
    }
  };

  const getEntityBadgeClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      purple: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      orange: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      teal: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
      indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      pink: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colorMap[color] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const getBlockTooltipContent = (block: Block) => {
    const students = block.studentIds.map(id => getStudent(id)).filter(Boolean);
    const aides = block.aideIds.map(id => getAide(id)).filter(Boolean);
    const activity = getActivity(block.activityId);
    
    return (
      <div className="space-y-2">
        <div className="font-medium">{activity?.title || "Unknown Activity"}</div>
        <div className="text-sm text-muted-foreground">
          {formatTimeDisplay(block.startTime)} - {formatTimeDisplay(block.endTime)}
        </div>
        {students.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground">Students:</div>
            <div className="text-xs">{students.map(s => s?.name).join(", ")}</div>
          </div>
        )}
        {aides.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground">Aides:</div>
            <div className="text-xs">{aides.map(a => a?.name).join(", ")}</div>
          </div>
        )}
        {block.notes && (
          <div>
            <div className="text-xs font-medium text-muted-foreground">Notes:</div>
            <div className="text-xs">{block.notes}</div>
          </div>
        )}
      </div>
    );
  };

  const handleBlockClick = (block: Block) => {
    setSelectedBlock(block);
    setNewBlockTime(null);
    setBlockModalOpen(true);
  };

  const handleAddBlock = (startTime?: string) => {
    const start = startTime || "09:00";
    const endTime = timeToMinutes(start) + 60;
    const end = `${Math.floor(endTime / 60).toString().padStart(2, "0")}:${(endTime % 60).toString().padStart(2, "0")}`;
    
    setSelectedBlock(null);
    setNewBlockTime({ start, end });
    setBlockModalOpen(true);
  };

  const handleTimeSlotClick = (time: string) => {
    handleAddBlock(time);
  };



  const handleResizeStart = (blockId: string, type: 'top' | 'bottom', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const initialY = e.clientY;
    const originalBlock = allBlocks.find((b: Block) => b.id === blockId);
    if (!originalBlock) return;
    
    setResizingBlock({ id: blockId, type, startY: initialY, originalBlock });
    resizeDraftRef.current = originalBlock; // Initialize ref with original
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - initialY;
      const pixelsPerHour = heightPerHour; // Use dynamic height calculation
      const minutesDelta = Math.round((deltaY / pixelsPerHour) * 60);
      
      // Snap to 15-minute intervals
      const snappedDelta = Math.round(minutesDelta / 15) * 15;
      
      let newStartTime = originalBlock.startTime;
      let newEndTime = originalBlock.endTime;
      
      if (type === 'top') {
        // Resize from top (change start time)
        const currentStart = timeToMinutes(originalBlock.startTime);
        const newStart = Math.max(0, currentStart + snappedDelta);
        const newEnd = timeToMinutes(originalBlock.endTime);
        
        // Minimum 15 minutes duration
        if (newEnd - newStart >= 15) {
          const hours = Math.floor(newStart / 60);
          const minutes = newStart % 60;
          newStartTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
        }
      } else {
        // Resize from bottom (change end time)
        const currentEnd = timeToMinutes(originalBlock.endTime);
        const newEnd = Math.max(timeToMinutes(originalBlock.startTime) + 15, currentEnd + snappedDelta);
        const hours = Math.floor(newEnd / 60);
        const minutes = newEnd % 60;
        newEndTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      }
      
      // Update both ref and optimistic state for immediate UI feedback
      if (newStartTime !== originalBlock.startTime || newEndTime !== originalBlock.endTime) {
        const updatedBlock = {
          ...originalBlock,
          startTime: newStartTime,
          endTime: newEndTime,
        };
        resizeDraftRef.current = updatedBlock; // Update ref with live state
        setOptimisticBlocks(prev => {
          const newMap = new Map(prev);
          newMap.set(blockId, updatedBlock);
          return newMap;
        });
      }
    };

    const handleMouseUp = () => {
      const finalBlock = resizeDraftRef.current;
      if (finalBlock && 
          (finalBlock.startTime !== originalBlock.startTime || 
           finalBlock.endTime !== originalBlock.endTime)) {
        // Make single API call with final state, keep optimistic state until mutation resolves
        updateBlockMutation.mutate({
          id: blockId,
          data: finalBlock,
        }, {
          onSettled: () => {
            // Clean up optimistic state only after mutation completes
            setOptimisticBlocks(prev => {
              const newMap = new Map(prev);
              newMap.delete(blockId);
              return newMap;
            });
          }
        });
      } else {
        // No changes, clean up immediately
        setOptimisticBlocks(prev => {
          const newMap = new Map(prev);
          newMap.delete(blockId);
          return newMap;
        });
      }
      
      // Clean up resize state and listeners
      resizeDraftRef.current = null;
      setResizingBlock(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (blocksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {calendarView === "week" ? "Weekly Schedule" : "Daily Schedule"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {calendarView === "week" ? (
                  (() => {
                    const weekDates = getWeekDates(selectedDate);
                    const startDate = new Date(weekDates[0] + 'T00:00:00');
                    const endDate = new Date(weekDates[4] + 'T00:00:00');
                    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                  })()
                ) : (
                  new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => handleAddBlock()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-add-block"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Block
              </Button>
            </div>
          </div>
        </div>

        <div ref={containerRef} className="flex-1 overflow-auto p-4">
            {calendarView === "week" ? (
              /* Week View Layout */
              <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-0 h-full">
                {/* Time Column */}
                <div className="border-r border-border relative">
                  {/* Time column header to match day headers */}
                  <div className="h-12 border-b border-border bg-muted/30 flex items-center justify-center">
                    <div className="text-xs font-medium text-muted-foreground">Time</div>
                  </div>
                  
                  {timeSlots.map((timeSlot, index) => {
                    // Calculate position based on actual time, not index
                    const timeMinutes = timeToMinutes(timeSlot.time);
                    const startHour = 8; // 8 AM start
                    const startOffsetMinutes = timeMinutes - (startHour * 60);
                    const pixelsPerMinute = heightPerHour / 60;
                    const topPosition = Math.max(0, startOffsetMinutes * pixelsPerMinute) + 48; // Add 48px for header height
                    
                    return (
                      <div
                        key={timeSlot.time}
                        className={`timeline-hour flex items-center justify-center text-sm text-muted-foreground ${
                          timeSlot.isHour ? 'border-t border-border' : 'border-t border-border/50'
                        }`}
                        style={{
                          position: "absolute",
                          top: `${topPosition}px`,
                          height: `${heightPerHour / 2}px`, // Half-hour slots
                          width: "100%",
                          left: 0,
                        }}
                      >
                        {timeSlot.displayTime}
                      </div>
                    );
                  })}
                </div>
                
                {/* Day Columns */}
                {getWeekDates(selectedDate).map((date, dayIndex) => {
                  const dayName = getDayNames()[dayIndex];
                  const dayBlocks = filteredBlocks.filter(block => block.date === date);
                  const isCurrentDay = date === getCurrentDate();
                  
                  return (
                    <div key={date} className="border-r border-border last:border-r-0">
                      {/* Day Header */}
                      <div className={`h-12 border-b border-border flex flex-col items-center justify-center p-2 ${
                        isCurrentDay 
                          ? 'bg-primary/10 border-primary/20' 
                          : 'bg-muted/30'
                      }`}>
                        <div className={`text-xs font-medium ${
                          isCurrentDay ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          {dayName.slice(0, 3)}
                        </div>
                        <div className={`text-sm font-semibold ${
                          isCurrentDay ? 'text-primary' : 'text-foreground'
                        }`}>
                          {new Date(date + 'T00:00:00').getDate()}
                        </div>
                      </div>
                      
                      {/* Day Schedule Content */}
                      <div className="relative" style={{ minHeight: "512px" }}>
                        {/* Individual Time Slot Droppables for this day */}
                        {timeSlots.map((timeSlot, index) => {
                          // Calculate position based on actual time, not index
                          const timeMinutes = timeToMinutes(timeSlot.time);
                          const startHour = 8; // 8 AM start
                          const startOffsetMinutes = timeMinutes - (startHour * 60);
                          const pixelsPerMinute = heightPerHour / 60;
                          const topPosition = Math.max(0, startOffsetMinutes * pixelsPerMinute); // No header offset needed - already in day container
                          
                          return (
                            <Droppable key={`timeslot-${date}-${index}`} droppableId={`timeslot-${date}-${index}`}>
                              {(provided: any, snapshot: any) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`droppable-area cursor-pointer hover:bg-accent/50 transition-colors ${
                                    timeSlot.isHour ? 'border-t border-border' : 'border-t border-border/50'
                                  } ${
                                    snapshot.isDraggingOver ? "bg-primary/10 border-primary" : ""
                                  }`}
                                  onClick={() => handleTimeSlotClick(timeSlot.time)}
                                  style={{ 
                                    position: "absolute",
                                    top: `${topPosition}px`,
                                    height: `${heightPerHour / 2}px`, // Match time label height
                                    left: 0,
                                    right: 0,
                                    zIndex: snapshot.isDraggingOver ? 5 : 1,
                                  }}
                                >
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          );
                        })}

                        {/* Schedule Blocks for this day - positioned but not in separate droppable */}
                        <div className="absolute inset-0 pointer-events-none">
                          {groupOverlappingBlocks(dayBlocks).map((group, groupIndex) => 
                            group.map((block, blockIndex) => {
                              const blockStyle = getBlockStyle(block, dayIndex, blockIndex);
                              const activity = getActivity(block.activityId);
                              const conflict = conflicts.get(block.id);

                            return (
                              <DroppableBlock 
                                key={block.id} 
                                block={block} 
                                blockStyle={blockStyle} 
                                onBlockClick={handleBlockClick}
                                onResizeStart={handleResizeStart}
                                activity={activity}
                                conflict={conflict}
                                getStudent={getStudent}
                                getAide={getAide}
                                getEntityBadgeClass={getEntityBadgeClass}
                                getBlockTooltipContent={getBlockTooltipContent}
                                formatTimeDisplay={formatTimeDisplay}
                              />
                            );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Day View Layout */
              <div className="grid grid-cols-[80px_1fr] gap-0 h-full">
                {/* Time Column */}
                <div className="border-r border-border relative">
                  {timeSlots.map((timeSlot, index) => {
                    // Calculate position based on actual time, not index
                    const timeMinutes = timeToMinutes(timeSlot.time);
                    const startHour = 8; // 8 AM start
                    const startOffsetMinutes = timeMinutes - (startHour * 60);
                    const pixelsPerMinute = heightPerHour / 60;
                    const topPosition = Math.max(0, startOffsetMinutes * pixelsPerMinute);
                    
                    return (
                      <div
                        key={timeSlot.time}
                        className={`timeline-hour flex items-center justify-center text-sm text-muted-foreground cursor-pointer hover:bg-accent transition-colors ${
                          timeSlot.isHour ? 'border-t border-border' : 'border-t border-border/50'
                        }`}
                        onClick={() => handleTimeSlotClick(timeSlot.time)}
                        data-testid={`timeslot-${timeSlot.time}`}
                        style={{
                          position: "absolute",
                          top: `${topPosition}px`,
                          height: `${heightPerHour / 2}px`, // Half-hour slots
                          width: "100%",
                          left: 0,
                        }}
                      >
                        {timeSlot.displayTime}
                      </div>
                    );
                  })}
                </div>

                {/* Schedule Content */}
                <div className="relative" style={{ minHeight: "512px" }}>
                  {/* Individual Time Slot Droppables */}
                  {timeSlots.map((timeSlot, index) => {
                    // Calculate position based on actual time, not index
                    const timeMinutes = timeToMinutes(timeSlot.time);
                    const startHour = 8; // 8 AM start
                    const startOffsetMinutes = timeMinutes - (startHour * 60);
                    const pixelsPerMinute = heightPerHour / 60;
                    const topPosition = Math.max(0, startOffsetMinutes * pixelsPerMinute);
                    
                    return (
                      <Droppable key={`timeslot-${index}`} droppableId={`timeslot-${index}`}>
                        {(provided: any, snapshot: any) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`droppable-area cursor-pointer hover:bg-accent/50 transition-colors ${
                              timeSlot.isHour ? 'border-t border-border' : 'border-t border-border/50'
                            } ${
                              snapshot.isDraggingOver ? "bg-primary/10 border-primary" : ""
                            }`}
                            onClick={() => handleTimeSlotClick(timeSlot.time)}
                            style={{ 
                              position: "absolute",
                              top: `${topPosition}px`,
                              height: `${heightPerHour / 2}px`, // Match time label height
                              left: 0,
                              right: 0,
                              zIndex: snapshot.isDraggingOver ? 5 : 1,
                            }}
                          >
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    );
                  })}

                  {/* Schedule Blocks - positioned but not in separate droppable */}
                  <div className="absolute inset-0 pointer-events-none">
                    {groupOverlappingBlocks(filteredBlocks).map((group, groupIndex) => 
                      group.map((block, blockIndex) => {
                        const blockStyle = getBlockStyle(block, undefined, blockIndex);
                        const activity = getActivity(block.activityId);
                        const conflict = conflicts.get(block.id);

                      return (
                        <DroppableBlock 
                          key={block.id} 
                          block={block} 
                          blockStyle={blockStyle} 
                          onBlockClick={handleBlockClick}
                          onResizeStart={handleResizeStart}
                          activity={activity}
                          conflict={conflict}
                          getStudent={getStudent}
                          getAide={getAide}
                          getEntityBadgeClass={getEntityBadgeClass}
                          getBlockTooltipContent={getBlockTooltipContent}
                          formatTimeDisplay={formatTimeDisplay}
                        />
                      );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
        </div>
      </Card>

      <BlockModal
        open={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        block={selectedBlock}
        currentDate={selectedDate}
        initialStartTime={newBlockTime?.start}
        initialEndTime={newBlockTime?.end}
      />
    </>
  );
}
