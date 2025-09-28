import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
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
import { getCurrentDate, formatDateDisplay } from "@/lib/time-utils";
import { detectConflicts } from "@/lib/conflicts";
import {
  saveTemplateToLocalStorage,
  loadTemplateFromLocalStorage,
  getTemplateNames,
  deleteTemplateFromLocalStorage,
} from "@/lib/templates";
import { useToast } from "@/hooks/use-toast";

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [viewMode, setViewMode] = useState<"master" | "student" | "aide">("master");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
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
    queryKey: ["/api/blocks", { date: selectedDate }],
  });

  const conflicts = detectConflicts(blocks, students, aides);
  const conflictCount = conflicts.size;

  const activeStudentsToday = new Set(
    blocks.filter(block => block.date === selectedDate)
      .flatMap(block => block.studentIds)
  ).size;

  const availableAides = aides.length;
  const templateNames = getTemplateNames();

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
                          <span>{"name" in entity ? entity.name : "title" in entity ? entity.title : ""}</span>
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

      <div className="flex h-screen">
        <Sidebar onEntityUpdate={() => {
          // Force refresh to update schedule when entities change
          window.location.reload();
        }} />

        <main className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
            <ScheduleGrid
              selectedDate={selectedDate}
              viewMode={viewMode}
              selectedEntityId={selectedEntityId}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Students</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-active-students">
                      {activeStudentsToday}
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <UserCheck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available Aides</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-available-aides">
                      {availableAides}
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${conflictCount > 0 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20'}`}>
                    <AlertTriangle className={`h-5 w-5 ${conflictCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conflicts</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-conflicts">
                      {conflictCount}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
