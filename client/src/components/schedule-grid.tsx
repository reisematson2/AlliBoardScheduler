import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface ScheduleGridProps {
  selectedDate: string;
  viewMode: "master" | "student" | "aide";
  selectedEntityId?: string;
}

export function ScheduleGrid({ selectedDate, viewMode, selectedEntityId }: ScheduleGridProps) {
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [newBlockTime, setNewBlockTime] = useState<{ start: string; end: string } | null>(null);
  const { toast } = useToast();

  const { data: blocks = [], isLoading: blocksLoading } = useQuery<Block[]>({
    queryKey: ["/api/blocks", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/blocks?date=${selectedDate}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
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
      queryClient.invalidateQueries({ queryKey: ["/api/blocks", selectedDate] });
      toast({ title: "Block updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update block", variant: "destructive" });
    },
  });

  const timeSlots = generateTimeSlots(8, 16);
  const conflicts = detectConflicts(blocks, students, aides);

  const filteredBlocks = useMemo(() => {
    if (viewMode === "master") return blocks;
    
    if (viewMode === "student" && selectedEntityId) {
      return blocks.filter(block => block.studentIds.includes(selectedEntityId));
    }
    
    if (viewMode === "aide" && selectedEntityId) {
      return blocks.filter(block => block.aideIds.includes(selectedEntityId));
    }
    
    return blocks;
  }, [blocks, viewMode, selectedEntityId]);

  const getActivity = (activityId: string) => {
    return activities.find(a => a.id === activityId);
  };

  const getStudent = (studentId: string) => {
    return students.find(s => s.id === studentId);
  };

  const getAide = (aideId: string) => {
    return aides.find(a => a.id === aideId);
  };

  const getBlockStyle = (block: Block) => {
    const position = getBlockPosition(block.startTime, block.endTime);
    const activity = getActivity(block.activityId);
    const conflict = conflicts.get(block.id);
    
    let className = "schedule-block absolute rounded-md p-3 m-1 cursor-pointer shadow-sm border-l-4 ";
    
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

    return {
      className,
      style: {
        top: `${position.top}px`,
        left: "8px",
        right: "8px",
        height: `${position.height}px`,
        minHeight: "48px",
        zIndex: 10,
      },
    };
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

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const blockId = result.draggableId;
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    // Parse the destination to get the target time
    const destinationId = result.destination.droppableId;
    let newStartTime: string;

    if (destinationId === "schedule-grid") {
      // If dropped on the main grid, calculate time based on the position
      // For now, we'll keep the block at its current time since we can't determine
      // the exact time slot without more complex calculation
      return;
    } else if (destinationId.startsWith("timeslot-")) {
      // If we had individual time slot droppables, parse the time
      const timeSlotIndex = parseInt(destinationId.replace("timeslot-", ""));
      const startHour = 8 + timeSlotIndex;
      newStartTime = `${startHour.toString().padStart(2, "0")}:00`;
    } else {
      return;
    }

    // Calculate the duration of the block
    const originalDuration = timeToMinutes(block.endTime) - timeToMinutes(block.startTime);
    const newEndTime = timeToMinutes(newStartTime) + originalDuration;
    const newEndTimeStr = `${Math.floor(newEndTime / 60).toString().padStart(2, "0")}:${(newEndTime % 60).toString().padStart(2, "0")}`;

    // Update the block with new time
    updateBlockMutation.mutate({
      id: blockId,
      data: {
        ...block,
        startTime: newStartTime,
        endTime: newEndTimeStr,
      },
    });
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
              <h2 className="text-xl font-semibold text-foreground">Daily Schedule</h2>
              <p className="text-sm text-muted-foreground">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
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
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-[80px_1fr] gap-0 min-h-[600px]">
              {/* Time Column */}
              <div className="border-r border-border">
                {timeSlots.map((time, index) => (
                  <div
                    key={time}
                    className="timeline-hour h-16 flex items-center justify-center text-sm text-muted-foreground cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleTimeSlotClick(time)}
                    data-testid={`timeslot-${time}`}
                  >
                    {formatTimeDisplay(time)}
                  </div>
                ))}
              </div>

              {/* Schedule Content */}
              <div className="relative" style={{ minHeight: "512px" }}>
                {/* Individual Time Slot Droppables */}
                {timeSlots.map((time, index) => (
                  <Droppable key={`timeslot-${index}`} droppableId={`timeslot-${index}`}>
                    {(provided: any, snapshot: any) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`droppable-area h-16 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors ${
                          snapshot.isDraggingOver ? "bg-primary/10 border-primary" : ""
                        }`}
                        onClick={() => handleTimeSlotClick(time)}
                        style={{ 
                          position: "relative",
                          top: `${index * 64}px`
                        }}
                      >
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}

                {/* Schedule Blocks */}
                <Droppable droppableId="blocks-container">
                  {(provided: any) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="absolute inset-0 pointer-events-none"
                    >
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
                                className={`${blockStyle.className} pointer-events-auto`}
                                style={{
                                  ...blockStyle.style,
                                  ...provided.draggableProps.style,
                                  opacity: snapshot.isDragging ? 0.8 : 1,
                                }}
                                onClick={() => handleBlockClick(block)}
                                data-testid={`block-${block.id}`}
                              >
                                <div className="flex items-center justify-between h-full">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium truncate">
                                      {activity?.title || "Unknown Activity"}
                                    </h4>
                                    <div className="flex items-center mt-1 space-x-1 flex-wrap">
                                      {/* Students */}
                                      {block.studentIds.slice(0, 3).map((studentId) => {
                                        const student = getStudent(studentId);
                                        if (!student) return null;
                                        return (
                                          <Badge
                                            key={studentId}
                                            variant="secondary"
                                            className={`text-xs px-2 py-0.5 ${getEntityBadgeClass(student.color)}`}
                                          >
                                            {student.name}
                                          </Badge>
                                        );
                                      })}
                                      {block.studentIds.length > 3 && (
                                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                          +{block.studentIds.length - 3}
                                        </Badge>
                                      )}
                                      
                                      {/* Aides */}
                                      {block.aideIds.slice(0, 2).map((aideId) => {
                                        const aide = getAide(aideId);
                                        if (!aide) return null;
                                        return (
                                          <Badge
                                            key={aideId}
                                            variant="secondary"
                                            className={`text-xs px-2 py-0.5 ${getEntityBadgeClass(aide.color)}`}
                                          >
                                            {aide.name}
                                          </Badge>
                                        );
                                      })}
                                      {block.aideIds.length > 2 && (
                                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                          +{block.aideIds.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1 ml-2">
                                    {conflict && (
                                      <div className="flex items-center">
                                        {conflict.type === "aide" ? (
                                          <AlertCircle 
                                            className="h-3 w-3 text-red-600"
                                          />
                                        ) : (
                                          <AlertTriangle 
                                            className="h-3 w-3 text-yellow-600"
                                          />
                                        )}
                                      </div>
                                    )}
                                    {block.notes && (
                                      <StickyNote 
                                        className="h-3 w-3 text-muted-foreground"
                                      />
                                    )}
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </DragDropContext>
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
