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
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { ChevronDown, ChevronUp, Users, Clock, MoreVertical, Edit, Trash2, Copy } from "lucide-react";

// Enhanced Participant Display Component
interface ParticipantDisplayProps {
  block: Block;
  getStudent: (id: string) => any;
  getAide: (id: string) => any;
  getEntityBadgeClass: (color: string) => string;
  blockHeight: number;
  activityColor?: string;
}

function ParticipantDisplay({ block, getStudent, getAide, getEntityBadgeClass, blockHeight, activityColor }: ParticipantDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get all participants (students first, then aides)
  const allParticipants = [
    ...block.studentIds.map(id => ({ id, type: 'student' as const, entity: getStudent(id) })),
    ...block.aideIds.map(id => ({ id, type: 'aide' as const, entity: getAide(id) }))
  ].filter(item => item.entity);

  // Calculate how many participants can fit based on block height
  // Use a more responsive approach that scales with block size
  const reservedSpace = Math.max(32, blockHeight * 0.4); // Reserve 40% of block height or 32px minimum
  const participantHeight = Math.max(16, blockHeight * 0.15); // Each participant takes 15% of block height or 16px minimum
  const maxVisibleParticipants = Math.max(1, Math.floor((blockHeight - reservedSpace) / participantHeight));
  
  const visibleParticipants = isExpanded ? allParticipants : allParticipants.slice(0, maxVisibleParticipants);
  const remainingCount = allParticipants.length - maxVisibleParticipants;

  if (allParticipants.length === 0) {
    return null;
  }

  return (
    <div className="relative flex-1 ml-1 max-h-full overflow-hidden">
      {/* Participants list */}
      <div className="flex flex-col gap-0.5 pr-6">
        {visibleParticipants.map(({ id, type, entity }) => (
          <div
            key={id}
            className={`text-xs px-1 py-0.5 rounded ${
              type === 'aide' ? 'border border-orange-200' : ''
            }${getEntityBadgeClass(entity.color)} truncate leading-tight ${getTextColorClass(entity.color)}`}
            data-testid={`${type}-badge-${entity.id}`}
            title={entity.name} // Add tooltip for truncated names
          >
            {entity.name}
          </div>
        ))}
      </div>
      
      {/* Expand/Collapse and overflow indicators */}
      {allParticipants.length > maxVisibleParticipants && (
        <div className="absolute bottom-1 right-1 flex items-center gap-1">
          {!isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 text-xs hover:bg-muted/70"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              title={`Show all ${allParticipants.length} participants`}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          )}
          {isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 text-xs hover:bg-muted/70"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              title="Show fewer participants"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
          )}
          {!isExpanded && remainingCount > 0 && (
            <div className={`text-xs px-1 py-0.5 rounded bg-muted/50 leading-tight ${getMutedTextColorClass(activityColor || 'blue')}`}>
              +{remainingCount}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Current Time Indicator Component
interface CurrentTimeIndicatorProps {
  heightPerHour: number;
  startHour?: number;
}

function CurrentTimeIndicator({ heightPerHour, startHour = 8 }: CurrentTimeIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every minute
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate position based on current time
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const startTimeInMinutes = startHour * 60;
  
  // Only show if current time is within the visible range
  if (currentTimeInMinutes < startTimeInMinutes || currentTimeInMinutes > (startHour + 10) * 60) {
    return null;
  }
  
  const pixelsPerMinute = heightPerHour / 60;
  const topPosition = (currentTimeInMinutes - startTimeInMinutes) * pixelsPerMinute;
  
  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${topPosition}px` }}
    >
      {/* Current time line */}
      <div className="h-0.5 bg-red-500 shadow-sm relative">
        {/* Time label */}
        <div className="absolute -left-16 -top-2 bg-red-500 text-white text-xs px-1 py-0.5 rounded flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {currentTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })}
        </div>
      </div>
    </div>
  );
}

// Entity Schedule Summary Component
interface EntityScheduleSummaryProps {
  entityId: string | null;
  entityType: 'student' | 'aide' | null;
  blocks: Block[];
  getStudent: (id: string) => any;
  getAide: (id: string) => any;
  getActivity: (id: string) => any;
  formatTimeDisplay: (time: string) => string;
  onClose: () => void;
}

function EntityScheduleSummary({ 
  entityId, 
  entityType, 
  blocks, 
  getStudent, 
  getAide, 
  getActivity, 
  formatTimeDisplay, 
  onClose 
}: EntityScheduleSummaryProps) {
  if (!entityId || !entityType) return null;

  const entity = entityType === 'student' ? getStudent(entityId) : getAide(entityId);
  if (!entity) return null;

  // Filter blocks for this entity
  const entityBlocks = blocks.filter(block => {
    if (entityType === 'student') {
      return block.studentIds.includes(entityId);
    } else {
      return block.aideIds.includes(entityId);
    }
  }).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  return (
    <div className="absolute top-4 right-4 bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm z-30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            entityType === 'student' ? 'bg-blue-500' : 'bg-orange-500'
          }`} />
          <h3 className="font-semibold text-sm">{entity.name}</h3>
          <span className="text-xs text-muted-foreground capitalize">({entityType})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onClose}
        >
          ×
        </Button>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {entityBlocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scheduled activities</p>
        ) : (
          entityBlocks.map(block => {
            const activity = getActivity(block.activityId);
            return (
              <div key={block.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                <div className="flex-1">
                  <div className="font-medium">{activity?.title || "Unknown Activity"}</div>
                  <div className="text-muted-foreground">
                    {formatTimeDisplay(block.startTime)} - {formatTimeDisplay(block.endTime)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

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
  onBlockEdit?: (block: Block) => void;
  onBlockDelete?: (block: Block) => void;
  onBlockCopy?: (block: Block) => void;
  isSelected?: boolean;
  onBlockSelect?: (blockId: string, multiSelect?: boolean) => void;
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
  formatTimeDisplay,
  onBlockEdit,
  onBlockDelete,
  onBlockCopy,
  isSelected = false,
  onBlockSelect
}: DroppableBlockProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `block-${block.id}`,
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                ref={setNodeRef}
                className={`${blockStyle.className} ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''} ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-80 shadow-lg' : ''}`}
                style={{
                  ...blockStyle.style,
                  pointerEvents: 'auto',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  
                  // Handle selection if Ctrl/Cmd is held
                  if (e.ctrlKey || e.metaKey) {
                    onBlockSelect?.(block.id, true);
                    return;
                  }
                  
                  // Handle selection if Shift is held
                  if (e.shiftKey) {
                    onBlockSelect?.(block.id, true);
                    return;
                  }
                  
                  // Normal click - select block and open modal
                  onBlockSelect?.(block.id, false);
                  onBlockClick(block);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onBlockEdit?.(block);
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
            
            {conflict && (
              <div className="absolute top-1 right-1 text-xs text-destructive z-10">
                {conflict.type === "aide" ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
              </div>
            )}
            
            <div className="flex h-full">
              {/* Left side: Activity name and time */}
              <div className="flex flex-1 min-w-0">
                {(() => {
                  // Check if block height is sufficient for vertical layout
                  const blockHeight = parseFloat(blockStyle.style.height);
                  const hasVerticalSpace = blockHeight >= 40; // Need at least 40px for vertical layout
                  
                  if (hasVerticalSpace) {
                    // Vertical layout: name on top, time below
                    return (
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className={`text-xs font-medium line-clamp-1 ${getTextColorClass(activity?.color || 'blue')}`}>
                          {activity?.title || "Unknown Activity"}
                        </div>
                        <div className={`text-xs ${getMutedTextColorClass(activity?.color || 'blue')}`}>
                          {formatTimeDisplay(block.startTime)} - {formatTimeDisplay(block.endTime)}
                        </div>
                      </div>
                    );
                  } else {
                    // Horizontal layout: name and time on same line
                    return (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <div className={`text-xs font-medium line-clamp-1 ${getTextColorClass(activity?.color || 'blue')}`}>
                          {activity?.title || "Unknown Activity"}
                        </div>
                        <div className={`text-xs whitespace-nowrap ${getMutedTextColorClass(activity?.color || 'blue')}`}>
                          {formatTimeDisplay(block.startTime)}-{formatTimeDisplay(block.endTime)}
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
              
              {/* Right side: Enhanced participant display */}
              <ParticipantDisplay
                block={block}
                getStudent={getStudent}
                getAide={getAide}
                getEntityBadgeClass={getEntityBadgeClass}
                blockHeight={blockStyle.style.height}
                activityColor={activity?.color}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {getBlockTooltipContent(block)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onBlockEdit?.(block)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Block
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onBlockCopy?.(block)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Block
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={() => onBlockDelete?.(block)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Block
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
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
import { getTextColorClass, getMutedTextColorClass } from "@/lib/color-utils";
import { undoManager, UndoAction } from "@/lib/undo-manager";
import { selectionManager, SelectionState } from "@/lib/selection-manager";
import { SelectionToolbar } from "./selection-toolbar";
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

// Improved time grid generation with 15-minute intervals
const generateImprovedTimeSlots = (startHour: number, endHour: number) => {
  const slots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    // Add hour slot
    slots.push({
      time: `${hour.toString().padStart(2, "0")}:00`,
      isHour: true,
      isQuarter: false,
      displayTime: formatTimeDisplay(`${hour.toString().padStart(2, "0")}:00`)
    });
    
    // Add 15-minute slot
    slots.push({
      time: `${hour.toString().padStart(2, "0")}:15`,
      isHour: false,
      isQuarter: true,
      displayTime: ""
    });
    
    // Add 30-minute slot
    slots.push({
      time: `${hour.toString().padStart(2, "0")}:30`,
      isHour: false,
      isQuarter: false,
      displayTime: ""
    });
    
    // Add 45-minute slot (except for the last hour)
    if (hour < endHour) {
      slots.push({
        time: `${hour.toString().padStart(2, "0")}:45`,
        isHour: false,
        isQuarter: true,
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

// Responsive block positioning with consistent pixel alignment
const getImprovedBlockPosition = (startTime: string, endTime: string, heightPerHour: number, startHour: number = 8) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const duration = endMinutes - startMinutes;
  
  const pixelsPerMinute = heightPerHour / 60;
  
  // Calculate position from start hour (8 AM = 0px)
  const startOffsetMinutes = startMinutes - (startHour * 60);
  const top = Math.max(0, Math.round(startOffsetMinutes * pixelsPerMinute));
  
  // Calculate height based purely on duration - no artificial minimums
  // This ensures true proportional representation regardless of viewport size
  const height = Math.round(duration * pixelsPerMinute);
  
  // Only apply a minimum height for very short blocks (less than 5 minutes) to ensure usability
  // This minimum scales with the viewport size
  const absoluteMinHeight = Math.max(12, Math.round(heightPerHour * 0.05)); // 3% of hour height, minimum 12px
  const finalHeight = duration < 5 ? Math.max(absoluteMinHeight, height) : height;
  
  return {
    top,
    height: finalHeight
  };
};

interface ScheduleGridProps {
  selectedDate: string;
  viewMode: "master" | "student" | "aide";
  selectedEntityId?: string;
  calendarView: "day" | "week";
  onEntityHighlight?: (entityId: string, entityType: 'student' | 'aide') => void;
  highlightedEntityId?: string | null;
  highlightedEntityType?: 'student' | 'aide' | null;
}

export function ScheduleGrid({ selectedDate, viewMode, selectedEntityId, calendarView, onEntityHighlight, highlightedEntityId, highlightedEntityType }: ScheduleGridProps) {
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [newBlockTime, setNewBlockTime] = useState<{ start: string; end: string } | null>(null);
  const [resizingBlock, setResizingBlock] = useState<{ id: string; type: 'top' | 'bottom'; startY: number; originalBlock: Block } | null>(null);
  const [optimisticBlocks, setOptimisticBlocks] = useState<Map<string, Block>>(new Map());
  const [forceRecalculate, setForceRecalculate] = useState(0);
  const [selectionState, setSelectionState] = useState<SelectionState>(selectionManager.getState());
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
      return apiRequest("PUT", `/api/blocks/${id}`, data);
    },
    onSuccess: (result) => {
      // Invalidate cache with all relevant variables
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      toast({ 
        title: "Schedule updated successfully", 
        description: "Your changes have been saved."
      });
    },
    onError: (error) => {
      console.error('updateBlockMutation error:', error);
      toast({ 
        title: "Failed to update schedule", 
        description: "Please try again. If the problem persists, refresh the page.",
        variant: "destructive" 
      });
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

  // Subscribe to selection changes
  React.useEffect(() => {
    const unsubscribe = selectionManager.subscribe(setSelectionState);
    return unsubscribe;
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + N: Add new block
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleAddBlock();
      }
      
      // Escape: Clear highlighting
      if (e.key === 'Escape') {
        clearHighlight();
      }
      
      // Delete: Delete selected block (if any)
      if (e.key === 'Delete' && selectedBlock) {
        e.preventDefault();
        handleBlockDelete(selectedBlock);
        setSelectedBlock(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlock]);

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
    // Handle custom activities (stored as "custom:Activity Name|#color" or "custom:Activity Name" for backward compatibility)
    if (activityId.startsWith('custom:')) {
      const customData = activityId.replace('custom:', '');
      let customName = "";
      let customColor = "";
      
      if (customData.includes('|')) {
        // New format: custom:ActivityName|#color
        const [name, color] = customData.split('|');
        customName = name;
        customColor = color;
      } else {
        // Old format: custom:ActivityName (for backward compatibility)
        customName = customData;
        // Generate a consistent color based on the custom name for old format
        const colors = ['blue', 'green', 'purple', 'orange', 'teal', 'indigo', 'pink', 'yellow', 'red'];
        const hash = customName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colorIndex = hash % colors.length;
        customColor = colors[colorIndex];
      }
      
      return {
        id: activityId,
        title: customName,
        color: customColor,
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

  // Entity highlighting functions
  const clearHighlight = () => {
    onEntityHighlight?.('', 'student'); // This will clear the highlight
  };

  const isBlockHighlighted = (block: Block) => {
    if (!highlightedEntityId || !highlightedEntityType) return false;
    
    if (highlightedEntityType === 'student') {
      return block.studentIds.includes(highlightedEntityId);
    } else if (highlightedEntityType === 'aide') {
      return block.aideIds.includes(highlightedEntityId);
    }
    
    return false;
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

  const getBlockStyle = (block: Block, columnIndex?: number, blockIndex?: number, allBlocksForDate?: Block[]) => {
    const position = getImprovedBlockPosition(block.startTime, block.endTime, heightPerHour, 8);
    const activity = getActivity(block.activityId);
    const conflict = conflicts.get(block.id);
    
    // Calculate overlapping blocks for side-by-side layout
    // Use the provided blocks for the date, or fall back to filteredBlocks
    const blocksToCheck = allBlocksForDate || filteredBlocks;
    const overlappingBlocks = blocksToCheck.filter(otherBlock => {
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

    // Enhanced visual separation for concurrent activities
    let className = "schedule-block absolute rounded-md p-2 cursor-pointer shadow-sm border-l-4 border-t border-b border-border/20 ";
    
    // Add visual separation between concurrent blocks
    if (totalOverlapping > 1) {
      className += "border-r border-border/30 "; // Add right border for separation
      if (blockIndex === 0) {
        className += "ml-1 "; // First block gets left margin
      } else {
        className += "ml-0.5 "; // Subsequent blocks get smaller margin
      }
      if (blockIndex === totalOverlapping - 1) {
        className += "mr-1 "; // Last block gets right margin
      } else {
        className += "mr-0.5 "; // Other blocks get smaller margin
      }
    } else {
      className += "mx-1 my-0.5 "; // Single blocks get horizontal margin and small vertical margin
    }
    
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
      
      // Check if it's a hex color (custom activity)
      if (activity.color.startsWith('#')) {
        // For hex colors, use inline styles
        className += "bg-opacity-20 dark:bg-opacity-10";
      } else {
        // For named colors, use the color map
        className += colorMap[activity.color] || "bg-gray-100 border-gray-500 dark:bg-gray-900/30";
      }
      
      // Add subtle background alternation for better lane distinction
      if (totalOverlapping > 1 && blockIndex !== undefined) {
        if (blockIndex % 2 === 1) {
          className += " bg-opacity-80 "; // Alternate opacity for visual separation
        }
      }
    }
    
    if (conflict) {
      if (conflict.type === "aide") {
        className += " conflict-aide";
      } else {
        className += " conflict-student";
      }
    }

    // Add highlighting styles
    if (isBlockHighlighted(block)) {
      className += " ring-2 ring-blue-400 ring-opacity-60 shadow-lg ";
    }

    // Week view: blocks are constrained within their column
    // Day view: blocks span the full width with left/right margins
    const baseStyle = {
      top: `${position.top}px`,
      height: `${position.height}px`,
      zIndex: 10,
    };

    // Add inline styles for hex colors
    const inlineStyles: React.CSSProperties = {
      ...baseStyle,
    };

    if (activity && activity.color.startsWith('#')) {
      inlineStyles.backgroundColor = activity.color;
      inlineStyles.borderLeftColor = activity.color;
    }

    if (calendarView === "week" && columnIndex !== undefined) {
      // In week view, blocks are positioned relative to their column
      // No header offset needed - already positioned within day container
      return {
        className,
        style: {
          ...inlineStyles,
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
          ...inlineStyles,
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
    const totalParticipants = students.length + aides.length;
    
    return (
      <div className="space-y-3 max-w-xs">
        <div className="font-semibold text-base">{activity?.title || "Unknown Activity"}</div>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-3 w-3" />
          {formatTimeDisplay(block.startTime)} - {formatTimeDisplay(block.endTime)}
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}</span>
        </div>
        
        {students.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Students ({students.length}):
            </div>
            <div className="text-xs space-y-1">
              {students.map(s => (
                <div key={s?.id} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getEntityBadgeClass(s?.color || 'gray').split(' ')[0]}`} />
                  {s?.name}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {aides.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Aides ({aides.length}):
            </div>
            <div className="text-xs space-y-1">
              {aides.map(a => (
                <div key={a?.id} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getEntityBadgeClass(a?.color || 'gray').split(' ')[0]}`} />
                  {a?.name}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {block.notes && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Notes:</div>
            <div className="text-xs bg-muted/50 p-2 rounded">{block.notes}</div>
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

  // Enhanced block interaction handlers
  const handleBlockEdit = (block: Block) => {
    setSelectedBlock(block);
    setNewBlockTime(null);
    setBlockModalOpen(true);
  };

  const handleBlockDelete = async (block: Block) => {
    if (!confirm(`Are you sure you want to delete this block: ${getActivity(block.activityId)?.title || 'Unknown Activity'}?`)) {
      return;
    }

    try {
      // Store the block data for undo before deleting
      undoManager.addAction('delete', { block });
      
      await apiRequest("DELETE", `/api/blocks/${block.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      toast({ title: "Block deleted successfully" });
    } catch (error) {
      toast({ title: "Failed to delete block", variant: "destructive" });
    }
  };

  const handleBulkDelete = async (blockIds: string[]) => {
    if (!confirm(`Are you sure you want to delete ${blockIds.length} blocks?`)) {
      return;
    }

    try {
      // Get the blocks to be deleted for undo
      const blocksToDelete = allBlocks.filter(block => blockIds.includes(block.id));
      
      // Store the blocks data for undo before deleting
      undoManager.addAction('delete', { blocks: blocksToDelete });
      
      // Delete all blocks
      await Promise.all(blockIds.map(id => apiRequest("DELETE", `/api/blocks/${id}`)));
      
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      selectionManager.clearSelection();
      toast({ title: `${blockIds.length} blocks deleted successfully` });
    } catch (error) {
      toast({ title: "Failed to delete blocks", variant: "destructive" });
    }
  };

  const handleUndo = async () => {
    const action = undoManager.getLastAction();
    if (!action) return;

    try {
      switch (action.type) {
        case 'delete':
          if (action.data.block) {
            // Restore single block
            await apiRequest("POST", "/api/blocks", action.data.block);
            toast({ title: "Block restored" });
          } else if (action.data.blocks) {
            // Restore multiple blocks
            await Promise.all(action.data.blocks.map((block: Block) => 
              apiRequest("POST", "/api/blocks", block)
            ));
            toast({ title: `${action.data.blocks.length} blocks restored` });
          }
          break;
        case 'create':
          // Delete the created block
          if (action.data.block) {
            await apiRequest("DELETE", `/api/blocks/${action.data.block.id}`);
            toast({ title: "Block creation undone" });
          }
          break;
        case 'update':
          // Restore the original block data
          if (action.data.originalBlock) {
            await apiRequest("PUT", `/api/blocks/${action.data.originalBlock.id}`, action.data.originalBlock);
            toast({ title: "Block update undone" });
          }
          break;
      }
      
      // Remove the action from history
      undoManager.undo();
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
    } catch (error) {
      toast({ title: "Failed to undo action", variant: "destructive" });
    }
  };

  const handleBlockSelect = (blockId: string, multiSelect: boolean = false) => {
    if (multiSelect) {
      selectionManager.toggleBlock(blockId);
    } else {
      selectionManager.selectBlock(blockId);
    }
  };

  const handleBlockCopy = (block: Block) => {
    // Create a new block with the same data but different ID and time
    const newBlock = {
      ...block,
      id: '', // Will be generated by server
      startTime: block.startTime,
      endTime: block.endTime,
      date: selectedDate,
    };
    
    setSelectedBlock(newBlock);
    setNewBlockTime({ start: block.startTime, end: block.endTime });
    setBlockModalOpen(true);
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
      <SelectionToolbar
        onDeleteSelected={handleBulkDelete}
        onUndo={handleUndo}
        totalBlocks={allBlocks.length}
      />
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
              <div className="text-xs text-muted-foreground">
                <span className="hidden sm:inline">Keyboard shortcuts: </span>
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+N</kbd> Add Block
                <span className="mx-2">•</span>
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> Clear Highlight
                <span className="mx-2">•</span>
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Del</kbd> Delete Block
              </div>
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

        <div ref={containerRef} className="flex-1 overflow-auto p-4 relative">
          {/* Entity Schedule Summary */}
          <EntityScheduleSummary
            entityId={highlightedEntityId || null}
            entityType={highlightedEntityType || null}
            blocks={filteredBlocks}
            getStudent={getStudent}
            getAide={getAide}
            getActivity={getActivity}
            formatTimeDisplay={formatTimeDisplay}
            onClose={clearHighlight}
          />
          
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
                        className={`timeline-hour flex items-center justify-center ${
                          timeSlot.isHour 
                            ? 'text-sm font-semibold text-foreground border-t-2 border-border bg-muted/20' 
                            : timeSlot.isQuarter
                            ? 'text-xs text-muted-foreground border-t border-dotted border-border/30'
                            : 'text-xs text-muted-foreground border-t border-dashed border-border/40'
                        }`}
                        style={{
                          position: "absolute",
                          top: `${topPosition}px`,
                          height: `${heightPerHour / 4}px`, // 15-minute slots
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
                        {/* Current time indicator for today */}
                        {date === getCurrentDate() && (
                          <CurrentTimeIndicator heightPerHour={heightPerHour} startHour={8} />
                        )}
                        
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
                              const blockStyle = getBlockStyle(block, dayIndex, blockIndex, dayBlocks);
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
                                onBlockEdit={handleBlockEdit}
                                onBlockDelete={handleBlockDelete}
                                onBlockCopy={handleBlockCopy}
                                isSelected={selectionManager.isSelected(block.id)}
                                onBlockSelect={handleBlockSelect}
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
                        className={`timeline-hour flex items-center justify-center cursor-pointer hover:bg-accent transition-colors ${
                          timeSlot.isHour 
                            ? 'text-sm font-semibold text-foreground border-t-2 border-border bg-muted/20' 
                            : timeSlot.isQuarter
                            ? 'text-xs text-muted-foreground border-t border-dotted border-border/30'
                            : 'text-xs text-muted-foreground border-t border-dashed border-border/40'
                        }`}
                        onClick={() => handleTimeSlotClick(timeSlot.time)}
                        data-testid={`timeslot-${timeSlot.time}`}
                        style={{
                          position: "absolute",
                          top: `${topPosition}px`,
                          height: `${heightPerHour / 4}px`, // 15-minute slots
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
                  {/* Current time indicator */}
                  <CurrentTimeIndicator heightPerHour={heightPerHour} startHour={8} />
                  
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
                        const blockStyle = getBlockStyle(block, undefined, blockIndex, filteredBlocks);
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
                          onBlockEdit={handleBlockEdit}
                          onBlockDelete={handleBlockDelete}
                          onBlockCopy={handleBlockCopy}
                          isSelected={selectionManager.isSelected(block.id)}
                          onBlockSelect={handleBlockSelect}
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
