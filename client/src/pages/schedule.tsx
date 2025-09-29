import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Save,
  AlertTriangle,
  Users,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { ScheduleGrid } from "@/components/schedule-grid";
import { Student, Aide, Activity, Block } from "@shared/schema";
import { getCurrentDate, formatDateDisplay, timeToMinutes } from "@/lib/time-utils";
import { detectConflicts } from "@/lib/conflicts";
import {
  saveTemplateToLocalStorage,
  loadTemplateFromLocalStorage,
  getTemplateNames,
  deleteTemplateFromLocalStorage,
} from "@/lib/templates";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Helper function to get the current week start date (Monday)
const getCurrentWeekStartDate = (): string => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate days to Monday (start of week)
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, so go back 6 days to get Monday
  
  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() + daysToMonday);
  return currentMonday.toISOString().split('T')[0];
};

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [viewMode, setViewMode] = useState<"master" | "student" | "aide">("master");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [calendarView, setCalendarView] = useState<"day" | "week">("day");
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();

  // Navigation functions
  const goToPreviousWeek = () => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    currentDate.setDate(currentDate.getDate() - 7);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToNextWeek = () => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    currentDate.setDate(currentDate.getDate() + 7);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToPreviousDay = () => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    currentDate.setDate(currentDate.getDate() - 1);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    currentDate.setDate(currentDate.getDate() + 1);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    if (calendarView === "week") {
      setSelectedDate(getCurrentWeekStartDate());
    } else {
      setSelectedDate(getCurrentDate());
    }
  };

  // Update selectedDate when calendar view changes
  React.useEffect(() => {
    if (calendarView === "week") {
      setSelectedDate(getCurrentWeekStartDate());
    } else {
      setSelectedDate(getCurrentDate());
    }
  }, [calendarView]);

  // Helper function to get week dates
  const getWeekDates = (selectedDate: string): string[] => {
    const date = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Find the Monday of the week containing the selected date
    const startOfWeek = new Date(date);
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, so go back 6 days to get Monday
    startOfWeek.setDate(date.getDate() + daysToMonday);
    
    const weekDates = [];
    for (let i = 0; i < 5; i++) { // Only 5 days: Monday to Friday
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      weekDates.push(weekDate.toISOString().split('T')[0]);
    }
    return weekDates;
  };

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: aides = [] } = useQuery<Aide[]>({
    queryKey: ["/api/aides"],
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: blocks = [] } = useQuery<Block[]>({
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
        const datesToFetch = getWeekDates(selectedDate);
        const promises = datesToFetch.map(date => 
          fetch(`/api/blocks?date=${date}`, { credentials: "include" })
            .then(res => res.ok ? res.json() : [])
        );
        const results = await Promise.all(promises);
        return results.flat();
      }
    },
  });

  const conflicts = detectConflicts(blocks, students, aides);
  const conflictCount = conflicts.size;

  const activeStudentsToday = new Set(
    blocks.filter(block => block.date === selectedDate)
      .flatMap(block => block.studentIds)
  ).size;

  const availableAides = aides.length;
  const templateNames = getTemplateNames();

  // Block update mutation with optimistic updates
  const updateBlockMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Block }) => {
      console.log('🚀 API call starting:', { id, data });
      return apiRequest("PUT", `/api/blocks/${id}`, data);
    },
    onMutate: async ({ id, data }) => {
      console.log('🔄 Optimistic update starting for block:', id);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/blocks"] });
      
      // Snapshot the previous value
      const previousBlocks = queryClient.getQueryData(["/api/blocks", calendarView, selectedDate]);
      
      // Optimistically update the cache
      queryClient.setQueryData(["/api/blocks", calendarView, selectedDate], (old: Block[] = []) => {
        console.log('🔄 Optimistic update - old data:', old);
        const updated = old.map(block => 
          block.id === id ? { ...block, ...data } : block
        );
        console.log('🔄 Optimistic update - new data:', updated);
        return updated;
      });
      
      return { previousBlocks };
    },
    onSuccess: (result) => {
      console.log('✅ Block update successful:', result);
      // Invalidate all block queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      toast({ title: "Block moved successfully" });
    },
    onError: (error, variables, context) => {
      console.error('❌ Block update failed:', error);
      
      // Rollback optimistic update
      if (context?.previousBlocks) {
        queryClient.setQueryData(["/api/blocks", calendarView, selectedDate], context.previousBlocks);
      }
      
      toast({ title: "Failed to move block", variant: "destructive" });
    },
  });

  // Drag handlers
  const onDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const onDragEnd = (event: DragEndEvent) => {
    console.log('🎯 onDragEnd called:', event);
    setActiveId(null);
    
    if (!event.over) {
      console.log('❌ No drop target found');
      return;
    }

    const activeId = event.active.id as string;
    const destinationId = event.over.id as string;
    
    console.log('📍 Drag details:', { activeId, destinationId });

    // Only handle entity drops (students/aides to blocks)
    if (activeId.startsWith('student-') || activeId.startsWith('aide-')) {
      console.log('👥 Handling entity drop');
      handleEntityDrop(activeId, destinationId);
      return;
    }

    // Block dragging is disabled - just log for debugging
    console.log('📦 Block dragging disabled - ignoring drag operation');
  };

  const handleEntityDrop = (activeId: string, destinationId: string) => {
    const isStudent = activeId.startsWith('student-');
    const entityId = activeId.replace(/^(student-|aide-)/, '');
    const blockId = destinationId.replace('block-', '');
    
    const targetBlock = blocks.find(block => block.id === blockId);
    if (!targetBlock) return;

    const updatedBlock = { ...targetBlock };
    if (isStudent) {
      if (!updatedBlock.studentIds.includes(entityId)) {
        updatedBlock.studentIds = [...updatedBlock.studentIds, entityId];
      }
    } else {
      if (!updatedBlock.aideIds.includes(entityId)) {
        updatedBlock.aideIds = [...updatedBlock.aideIds, entityId];
      }
    }

    updateBlockMutation.mutate({
      id: blockId,
      data: updatedBlock,
    });

    const activity = activities.find(a => a.id === targetBlock.activityId);
    toast({ 
      title: `${isStudent ? 'Student' : 'Aide'} added to block`,
      description: `Added to ${activity?.title || 'activity'}`
    });
  };




  const handleViewModeChange = (mode: string) => {
    setViewMode(mode as "master" | "student" | "aide");
    setSelectedEntityId("");
  };

  const handleEntitySelect = (entityId: string) => {
    setSelectedEntityId(entityId);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({ title: "Please enter a template name", variant: "destructive" });
      return;
    }

    try {
      saveTemplateToLocalStorage(templateName, blocks);
      toast({ title: `Template "${templateName}" saved successfully` });
      setTemplateName("");
    } catch (error) {
      toast({ title: "Failed to save template", variant: "destructive" });
    }
  };

  const handleLoadTemplate = async (templateName: string) => {
    if (!templateName) return;

    try {
      const templateBlocks = loadTemplateFromLocalStorage(templateName, selectedDate);
      if (!templateBlocks) {
        toast({ title: "Template not found", variant: "destructive" });
        return;
      }

      // Create blocks from template
      for (const blockData of templateBlocks) {
        const response = await fetch("/api/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(blockData),
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to create block");
        }
      }

      toast({ title: `Template "${templateName}" loaded successfully` });
      setSelectedTemplate("");
      
      // Refresh blocks data
      window.location.reload();
    } catch (error) {
      toast({ title: "Failed to load template", variant: "destructive" });
    }
  };

  const getViewEntities = () => {
    switch (viewMode) {
      case "student":
        return students;
      case "aide":
        return aides;
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-primary flex items-center">
              <Calendar className="mr-2 h-7 w-7" />
              AlliBoard
            </h1>
            
            <nav className="flex space-x-1">
              <Link href="/">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:bg-accent hover:text-accent-foreground" 
                  data-testid="nav-dashboard"
                >
                  Dashboard
                </Button>
              </Link>
              <Button 
                variant="default" 
                size="sm" 
                className="bg-primary text-primary-foreground" 
                data-testid="nav-schedule"
              >
                Schedule
              </Button>
              <Link href="/print">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:bg-accent hover:text-accent-foreground" 
                  data-testid="nav-print"
                >
                  Print View
                </Button>
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Calendar View Toggle */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-muted-foreground">Calendar:</label>
              <Select value={calendarView} onValueChange={(value: "day" | "week") => setCalendarView(value)}>
                <SelectTrigger className="w-20" data-testid="select-calendar-view">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-muted-foreground">View:</label>
              <Select value={viewMode} onValueChange={handleViewModeChange}>
                <SelectTrigger className="w-32" data-testid="select-view-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="master">Master View</SelectItem>
                  <SelectItem value="student">By Student</SelectItem>
                  <SelectItem value="aide">By Aide</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entity Filter for Student/Aide views */}
            {(viewMode === "student" || viewMode === "aide") && (
              <div className="flex items-center space-x-2">
                <Select value={selectedEntityId} onValueChange={handleEntitySelect}>
                  <SelectTrigger className="w-40" data-testid="select-entity-filter">
                    <SelectValue placeholder={`Select ${viewMode}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getViewEntities().map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full bg-${entity.color}-500`} />
                          <span>{entity.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center space-x-2">
              {calendarView === "week" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousWeek}
                    data-testid="button-previous-week"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    data-testid="button-today"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextWeek}
                    data-testid="button-next-week"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousDay}
                    data-testid="button-previous-day"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    data-testid="button-today"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextDay}
                    data-testid="button-next-day"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            {/* Template Controls */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Input
                  placeholder="Template name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-32"
                  data-testid="input-template-name"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim() || blocks.length === 0}
                  data-testid="button-save-template"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              
              <Select value={selectedTemplate} onValueChange={handleLoadTemplate}>
                <SelectTrigger className="w-40" data-testid="select-template">
                  <SelectValue placeholder="Load Template..." />
                </SelectTrigger>
                <SelectContent>
                  {templateNames.length === 0 ? (
                    <SelectItem value="no-templates" disabled>
                      No templates saved
                    </SelectItem>
                  ) : (
                    templateNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <DndContext 
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        collisionDetection={closestCenter}
      >
        <div className="flex h-screen">
          <Sidebar onEntityUpdate={() => {
            // Force refresh to update schedule when entities change
            window.location.reload();
          }} />

          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden p-6">
              <ScheduleGrid
                selectedDate={selectedDate}
                viewMode={viewMode}
                selectedEntityId={selectedEntityId}
                calendarView={calendarView}
              />
            </div>
          </main>
        </div>
        
        <DragOverlay>
          {activeId ? (
            <div className="bg-primary text-primary-foreground p-2 rounded shadow-lg opacity-90">
              {activeId.startsWith('student-') ? 'Student' : 
               activeId.startsWith('aide-') ? 'Aide' : 'Block'}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
