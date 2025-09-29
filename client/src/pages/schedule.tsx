import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { DndContext, DragEndEvent, rectIntersection } from "@dnd-kit/core";
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
import { apiRequest } from "@/lib/queryClient";

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [viewMode, setViewMode] = useState<"master" | "student" | "aide">("master");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [calendarView, setCalendarView] = useState<"day" | "week">("day");
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const { toast } = useToast();

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

  const conflicts = detectConflicts(blocks, students, aides);
  const conflictCount = conflicts.size;

  const activeStudentsToday = new Set(
    blocks.filter(block => block.date === selectedDate)
      .flatMap(block => block.studentIds)
  ).size;

  const availableAides = aides.length;
  const templateNames = getTemplateNames();

  // Drag and drop mutations
  const updateBlockMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Block }) => 
      apiRequest("PUT", `/api/blocks/${id}`, data),
    onSuccess: () => {
      // Invalidate blocks query to refresh data
      window.location.reload();
    },
    onError: () => {
      toast({ title: "Failed to update block", variant: "destructive" });
    },
  });

  const handleEntityDrop = (activeId: string, destinationId: string) => {
    // Extract entity type and ID from activeId
    const isStudent = activeId.startsWith('student-');
    const entityId = activeId.replace(/^(student-|aide-)/, '');
    
    // Find the target block
    const blockId = destinationId.replace('block-', '');
    const targetBlock = blocks.find(block => block.id === blockId);
    
    if (!targetBlock) {
      console.log('Target block not found for ID:', blockId);
      return;
    }

    // Update the block with the new entity
    const updatedBlock = { ...targetBlock };
    
    if (isStudent) {
      // Add student if not already present
      if (!updatedBlock.studentIds.includes(entityId)) {
        updatedBlock.studentIds = [...updatedBlock.studentIds, entityId];
      }
    } else {
      // Add aide if not already present
      if (!updatedBlock.aideIds.includes(entityId)) {
        updatedBlock.aideIds = [...updatedBlock.aideIds, entityId];
      }
    }

    // Update the block
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

  const onDragEnd = (event: DragEndEvent) => {
    console.log('onDragEnd called with event:', event);
    
    if (!event.over) {
      console.log('No destination, exiting');
      return;
    }

    const activeId = event.active.id as string;
    const destinationId = event.over.id as string;

    // Check if we're dragging a student or aide from the sidebar
    if (activeId.startsWith('student-') || activeId.startsWith('aide-')) {
      handleEntityDrop(activeId, destinationId);
      return;
    }

    // For block dragging, we'll let the ScheduleGrid handle it
    // by passing the event down
    console.log('Block drag detected, passing to ScheduleGrid');
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

            {/* Date Picker */}
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
                data-testid="input-date"
              />
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
        onDragEnd={onDragEnd}
        collisionDetection={rectIntersection}
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
      </DndContext>
    </div>
  );
}
