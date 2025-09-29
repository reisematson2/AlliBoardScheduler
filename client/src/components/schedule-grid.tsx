import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  DndContext, 
  DragEndEvent, 
  useDraggable, 
  useDroppable,
  closestCenter,
  pointerWithin,
  rectIntersection
} from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  timeToMinutes 
} from "@/lib/time-utils";
import { detectConflicts } from "@/lib/conflicts";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Helper functions for week view
const getWeekDates = (selectedDate: string): string[] => {
  const date = new Date(selectedDate);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - dayOfWeek);
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startOfWeek);
    currentDate.setDate(startOfWeek.getDate() + i);
    weekDates.push(currentDate.toISOString().split('T')[0]);
  }
  return weekDates;
};

const getDayNames = (): string[] => {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
};

// Improved time grid generation with half-hour intervals
const generateImprovedTimeSlots = (startHour: number, endHour: number) => {
  const slots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    slots.push({
      time: `${hour.toString().padStart(2, "0")}:00`,
      isHour: true,
      displayTime: formatTimeDisplay(`${hour.toString().padStart(2, "0")}:00`)
    });
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

// Improved block positioning with precise time calculation
const getImprovedBlockPosition = (startTime: string, endTime: string, startHour: number = 8) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const duration = endMinutes - startMinutes;
  
  // Each hour = 64px, so each minute = 64/60 px
  const pixelsPerMinute = 64 / 60;
  
  // Calculate position from start hour (8 AM = 0px)
  const startOffsetMinutes = startMinutes - (startHour * 60);
  const top = Math.max(0, startOffsetMinutes * pixelsPerMinute);
  const height = Math.max(16, duration * pixelsPerMinute); // Minimum 16px height
  
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
  const resizeDraftRef = useRef<Block | null>(null);
  const { toast } = useToast();

  // Calculate dates to fetch based on calendar view
  const datesToFetch = useMemo(() => {
    return calendarView === "week" ? getWeekDates(selectedDate) : [selectedDate];
  }, [calendarView, selectedDate]);

  // Fetch blocks for all relevant dates
  const { data: allBlocks = [], isLoading: blocksLoading } = useQuery<Block[]>({
    queryKey: ["/api/blocks", calendarView, selectedDate],
    queryFn: async () => {
      if (calendarView === "day") {
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
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest("PUT", `/api/blocks/${id}`, data),
    onSuccess: () => {
      // Invalidate cache with all relevant variables
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      toast({ title: "Block updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update block", variant: "destructive" });
    },
  });

  // Use improved time slots with half-hour intervals
  const timeSlots = generateImprovedTimeSlots(8, 16);
  const conflicts = detectConflicts(allBlocks, students, aides);

  const filteredBlocks = useMemo(() => {
    // Merge optimistic updates with server data
    const mergedBlocks = allBlocks.map(block => 
      optimisticBlocks.get(block.id) || block
    );
    
    if (viewMode === "master") return mergedBlocks;
    
    if (viewMode === "student" && selectedEntityId) {
      return mergedBlocks.filter(block => block.studentIds.includes(selectedEntityId));
    }
    
    if (viewMode === "aide" && selectedEntityId) {
      return mergedBlocks.filter(block => block.aideIds.includes(selectedEntityId));
    }
    
    return mergedBlocks;
  }, [allBlocks, viewMode, selectedEntityId, optimisticBlocks]);

  const getActivity = (activityId: string) => {
    return activities.find(a => a.id === activityId);
  };

  const getStudent = (studentId: string) => {
    return students.find(s => s.id === studentId);
  };

  const getAide = (aideId: string) => {
    return aides.find(a => a.id === aideId);
  };

  const getBlockStyle = (block: Block, columnIndex?: number) => {
    const position = getImprovedBlockPosition(block.startTime, block.endTime);
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
      // Day view: use the original full-width styling
      return {
        className,
        style: {
          ...baseStyle,
          left: "8px",
          right: "8px",
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

  const onDragEnd = (event: DragEndEvent) => {
    console.log('onDragEnd called with event:', event);
    
    if (!event.over) {
      console.log('No destination, exiting');
      return;
    }

    const blockId = event.active.id as string;
    const block = allBlocks.find((b: Block) => b.id === blockId);
    if (!block) {
      console.log('Block not found for ID:', blockId);
      return;
    }
    
    console.log('Processing drag for block:', block);

    // Parse the destination to get the target time and date
    const destinationId = event.over.id as string;
    let newStartTime: string;
    let newDate: string = block.date; // Default to existing date

    if (destinationId.startsWith("timeslot-")) {
      if (calendarView === "week") {
        // Week view format: "timeslot-${date}-${index}"
        const match = destinationId.match(/^timeslot-(.+)-(\d+)$/);
        if (match) {
          newDate = match[1];
          const timeSlotIndex = parseInt(match[2]);
          if (timeSlotIndex >= 0 && timeSlotIndex < timeSlots.length) {
            newStartTime = timeSlots[timeSlotIndex].time;
          } else {
            return; // Invalid time slot index
          }
        } else {
          return; // Invalid format
        }
      } else {
        // Day view format: "timeslot-${index}"
        const timeSlotIndex = parseInt(destinationId.replace("timeslot-", ""));
        if (timeSlotIndex >= 0 && timeSlotIndex < timeSlots.length) {
          newStartTime = timeSlots[timeSlotIndex].time;
        } else {
          return; // Invalid time slot index
        }
      }
    } else {
      return; // Not a valid drop target
    }

    // Calculate the duration of the block
    const originalDuration = timeToMinutes(block.endTime) - timeToMinutes(block.startTime);
    const newEndTime = timeToMinutes(newStartTime) + originalDuration;
    const newEndTimeStr = `${Math.floor(newEndTime / 60).toString().padStart(2, "0")}:${(newEndTime % 60).toString().padStart(2, "0")}`;

    // Update the block with new time and date
    updateBlockMutation.mutate({
      id: blockId,
      data: {
        ...block,
        startTime: newStartTime,
        endTime: newEndTimeStr,
        date: newDate, // Update date for week view drops
      },
    });
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
      const pixelsPerHour = 64; // 64px per hour (16px per 15min slot)
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
      <Card className="flex-1">
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
                    const endDate = new Date(weekDates[6] + 'T00:00:00');
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

        <div className="p-4">
          <DndContext 
            onDragEnd={onDragEnd}
            collisionDetection={rectIntersection}
          >
            {calendarView === "week" ? (
              /* Week View Layout */
              <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-0 min-h-[600px]">
                {/* Time Column */}
                <div className="border-r border-border">
                  {timeSlots.map((timeSlot, index) => (
                    <div
                      key={timeSlot.time}
                      className={`timeline-hour h-16 flex items-center justify-center text-sm text-muted-foreground ${
                        timeSlot.isHour ? 'border-t border-border' : 'border-t border-border/50'
                      }`}
                    >
                      {timeSlot.displayTime}
                    </div>
                  ))}
                </div>
                
                {/* Day Columns */}
                {getWeekDates(selectedDate).map((date, dayIndex) => {
                  const dayName = getDayNames()[dayIndex];
                  const dayBlocks = filteredBlocks.filter(block => block.date === date);
                  
                  return (
                    <div key={date} className="border-r border-border last:border-r-0">
                      {/* Day Header */}
                      <div className="h-12 border-b border-border bg-muted/30 flex flex-col items-center justify-center p-2">
                        <div className="text-xs font-medium text-muted-foreground">{dayName.slice(0, 3)}</div>
                        <div className="text-sm font-semibold">{new Date(date + 'T00:00:00').getDate()}</div>
                      </div>
                      
                      {/* Day Schedule Content */}
                      <div className="relative" style={{ minHeight: "512px" }}>
                        {/* Individual Time Slot Droppables for this day */}
                        {timeSlots.map((timeSlot, index) => (
                          <Droppable key={`timeslot-${date}-${index}`} droppableId={`timeslot-${date}-${index}`}>
                            {(provided: any, snapshot: any) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`droppable-area h-16 cursor-pointer hover:bg-accent/50 transition-colors ${
                                  timeSlot.isHour ? 'border-t border-border' : 'border-t border-border/50'
                                } ${
                                  snapshot.isDraggingOver ? "bg-primary/10 border-primary" : ""
                                }`}
                                onClick={() => handleTimeSlotClick(timeSlot.time)}
                                style={{ 
                                  position: "absolute",
                                  top: `${index * 64}px`,
                                  left: 0,
                                  right: 0,
                                  zIndex: snapshot.isDraggingOver ? 5 : 1,
                                }}
                              >
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        ))}

                        {/* Schedule Blocks for this day - positioned but not in separate droppable */}
                        <div className="absolute inset-0 pointer-events-none">
                          {dayBlocks.map((block, index) => {
                            const blockStyle = getBlockStyle(block, dayIndex);
                            const activity = getActivity(block.activityId);
                            const conflict = conflicts.get(block.id);

                            return (
                              <Draggable key={block.id} draggableId={block.id} index={index}>
                                {(provided: any, snapshot: any) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={blockStyle.className}
                                    style={{
                                      ...provided.draggableProps.style,
                                      ...blockStyle.style,
                                      transform: snapshot.isDragging
                                        ? provided.draggableProps.style?.transform
                                        : 'none',
                                      pointerEvents: 'auto',
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleBlockClick(block);
                                    }}
                                    data-testid={`block-${block.id}`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="cursor-grab active:cursor-grabbing"
                                      >
                                        <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                                      </div>
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
                                    
                                    <div className="text-xs font-medium text-foreground mb-1 line-clamp-2">
                                      {activity?.title || "Unknown Activity"}
                                    </div>
                                    
                                    <div className="text-xs text-muted-foreground mb-2">
                                      {formatTimeDisplay(block.startTime)} - {formatTimeDisplay(block.endTime)}
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-1">
                                      {block.studentIds.map(studentId => {
                                        const student = getStudent(studentId);
                                        return student ? (
                                          <Badge
                                            key={studentId}
                                            variant="secondary"
                                            className={`text-xs px-1 py-0 ${getEntityBadgeClass(student.color)}`}
                                            data-testid={`student-badge-${student.id}`}
                                          >
                                            {student.name}
                                          </Badge>
                                        ) : null;
                                      })}
                                      {block.aideIds.map(aideId => {
                                        const aide = getAide(aideId);
                                        return aide ? (
                                          <Badge
                                            key={aideId}
                                            variant="outline"
                                            className={`text-xs px-1 py-0 ${getEntityBadgeClass(aide.color)}`}
                                            data-testid={`aide-badge-${aide.id}`}
                                          >
                                            {aide.name}
                                          </Badge>
                                        ) : null;
                                      })}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Day View Layout */
              <div className="grid grid-cols-[80px_1fr] gap-0 min-h-[600px]">
                {/* Time Column */}
                <div className="border-r border-border">
                  {timeSlots.map((timeSlot, index) => (
                    <div
                      key={timeSlot.time}
                      className={`timeline-hour h-16 flex items-center justify-center text-sm text-muted-foreground cursor-pointer hover:bg-accent transition-colors ${
                        timeSlot.isHour ? 'border-t border-border' : 'border-t border-border/50'
                      }`}
                      onClick={() => handleTimeSlotClick(timeSlot.time)}
                      data-testid={`timeslot-${timeSlot.time}`}
                    >
                      {timeSlot.displayTime}
                    </div>
                  ))}
                </div>

                {/* Schedule Content */}
                <div className="relative" style={{ minHeight: "512px" }}>
                  {/* Individual Time Slot Droppables */}
                  {timeSlots.map((timeSlot, index) => (
                    <Droppable key={`timeslot-${index}`} droppableId={`timeslot-${index}`}>
                      {(provided: any, snapshot: any) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`droppable-area h-16 cursor-pointer hover:bg-accent/50 transition-colors ${
                            timeSlot.isHour ? 'border-t border-border' : 'border-t border-border/50'
                          } ${
                            snapshot.isDraggingOver ? "bg-primary/10 border-primary" : ""
                          }`}
                          onClick={() => handleTimeSlotClick(timeSlot.time)}
                          style={{ 
                            position: "absolute",
                            top: `${index * 64}px`,
                            left: 0,
                            right: 0,
                            zIndex: snapshot.isDraggingOver ? 5 : 1,
                          }}
                        >
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  ))}

                  {/* Schedule Blocks - positioned but not in separate droppable */}
                  <div className="absolute inset-0 pointer-events-none">
                    {filteredBlocks.map((block, index) => {
                      const blockStyle = getBlockStyle(block);
                      const activity = getActivity(block.activityId);
                      const conflict = conflicts.get(block.id);

                      return (
                        <Draggable key={block.id} draggableId={block.id} index={index}>
                          {(provided: any, snapshot: any) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={blockStyle.className}
                              style={{
                                ...provided.draggableProps.style,
                                ...blockStyle.style,
                                transform: snapshot.isDragging
                                  ? provided.draggableProps.style?.transform
                                  : 'none',
                                pointerEvents: 'auto',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBlockClick(block);
                              }}
                              data-testid={`block-${block.id}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                                </div>
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
                              
                              <div className="text-xs font-medium text-foreground mb-1 line-clamp-2">
                                {activity?.title || "Unknown Activity"}
                              </div>
                              
                              <div className="text-xs text-muted-foreground mb-2">
                                {formatTimeDisplay(block.startTime)} - {formatTimeDisplay(block.endTime)}
                              </div>
                              
                              <div className="flex flex-wrap gap-1">
                                {block.studentIds.map(studentId => {
                                  const student = getStudent(studentId);
                                  return student ? (
                                    <Badge
                                      key={studentId}
                                      variant="secondary"
                                      className={`text-xs px-1 py-0 ${getEntityBadgeClass(student.color)}`}
                                      data-testid={`student-badge-${student.id}`}
                                    >
                                      {student.name}
                                    </Badge>
                                  ) : null;
                                })}
                                {block.aideIds.map(aideId => {
                                  const aide = getAide(aideId);
                                  return aide ? (
                                    <Badge
                                      key={aideId}
                                      variant="outline"
                                      className={`text-xs px-1 py-0 ${getEntityBadgeClass(aide.color)}`}
                                      data-testid={`aide-badge-${aide.id}`}
                                    >
                                      {aide.name}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </DndContext>
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
