import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Download,
  Printer,
  AlertTriangle,
  AlertCircle,
  StickyNote,
  Filter,
  Users,
  UserCheck,
  FileText,
} from "lucide-react";
import { Block, Student, Aide, Activity } from "@shared/schema";
import { getCurrentDate, formatTimeDisplay, formatDateDisplay, generateTimeSlots, timeToMinutes, minutesToTime } from "@/lib/time-utils";
import { detectConflicts } from "@/lib/conflicts";
import { useToast } from "@/hooks/use-toast";

export default function PrintView() {
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [printMode, setPrintMode] = useState<'master' | 'individual'>('master');
  const [printFormat, setPrintFormat] = useState<'list' | 'calendar'>('list');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedAides, setSelectedAides] = useState<string[]>([]);
  const [showStudents, setShowStudents] = useState(true);
  const [showAides, setShowAides] = useState(true);
  const [showConflicts, setShowConflicts] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
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

  const timeSlots = generateTimeSlots(8, 16);
  const conflicts = detectConflicts(blocks, students, aides);

  const getActivity = (activityId: string) => {
    return activities.find(a => a.id === activityId);
  };

  const getStudent = (studentId: string) => {
    return students.find(s => s.id === studentId);
  };

  const getAide = (aideId: string) => {
    return aides.find(a => a.id === aideId);
  };

  const getEntityBadgeClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800",
      green: "bg-green-100 text-green-800",
      purple: "bg-purple-100 text-purple-800",
      orange: "bg-orange-100 text-orange-800",
      teal: "bg-teal-100 text-teal-800",
      indigo: "bg-indigo-100 text-indigo-800",
      pink: "bg-pink-100 text-pink-800",
      yellow: "bg-yellow-100 text-yellow-800",
      red: "bg-red-100 text-red-800",
    };
    return colorMap[color] || "bg-gray-100 text-gray-800";
  };

  // Filter blocks based on selected students/aides and display options
  const getFilteredBlocks = () => {
    return blocks.filter(block => {
      // If we have any selections (students or aides), apply filtering
      if (selectedStudents.length > 0 || selectedAides.length > 0) {
        // Check if block involves any selected students or aides
        const hasSelectedStudents = selectedStudents.length > 0 && 
          block.studentIds.some(id => selectedStudents.includes(id));
        const hasSelectedAides = selectedAides.length > 0 && 
          block.aideIds.some(id => selectedAides.includes(id));
        
        return hasSelectedStudents || hasSelectedAides;
      }
      
      // If no selections made, show all blocks (master mode behavior)
      return true;
    });
  };

  const getBlocksByTimeSlot = (timeSlot: string) => {
    const filteredBlocks = getFilteredBlocks();
    return filteredBlocks.filter(block => {
      const blockStartHour = parseInt(block.startTime.split(':')[0]);
      const slotHour = parseInt(timeSlot.split(':')[0]);
      return blockStartHour === slotHour;
    });
  };

  // Get blocks for a specific student
  const getStudentBlocks = (studentId: string) => {
    return blocks.filter(block => block.studentIds.includes(studentId));
  };

  // Get blocks for a specific aide
  const getAideBlocks = (aideId: string) => {
    return blocks.filter(block => block.aideIds.includes(aideId));
  };

  // Handle student selection
  const handleStudentToggle = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  // Handle aide selection
  const handleAideToggle = (aideId: string, checked: boolean) => {
    if (checked) {
      setSelectedAides(prev => [...prev, aideId]);
    } else {
      setSelectedAides(prev => prev.filter(id => id !== aideId));
    }
  };

  // Select all students
  const selectAllStudents = () => {
    setSelectedStudents(students.map(s => s.id));
  };

  // Select all aides
  const selectAllAides = () => {
    setSelectedAides(aides.map(a => a.id));
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedStudents([]);
    setSelectedAides([]);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // For a production app, you would implement PDF generation here
    // For now, we'll use the browser's print to PDF functionality
    toast({ 
      title: "PDF Download", 
      description: "Use your browser's print function and select 'Save as PDF' as the destination." 
    });
    window.print();
  };

  // Calendar format rendering functions
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

  const getDayNames = (): string[] => {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  };

  const getBlockPosition = (block: Block, timeSlots: string[]): { top: number; minHeight: number } => {
    const startMinutes = timeToMinutes(block.startTime);
    const endMinutes = timeToMinutes(block.endTime);
    const firstSlotMinutes = timeToMinutes(timeSlots[0]);
    
    // Calculate position relative to the first time slot
    const top = Math.max(0, (startMinutes - firstSlotMinutes) * 2); // 2px per minute
    const minHeight = Math.max(40, (endMinutes - startMinutes) * 2); // Minimum height based on duration
    
    return { top, minHeight };
  };

  const renderCalendarDayView = (filteredBlocks: Block[]) => {
    const timeSlots = generateTimeSlots();
    const dayBlocks = filteredBlocks.filter(block => block.date === selectedDate);
    
    // Sort blocks by start time
    const sortedBlocks = dayBlocks.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    
    return (
      <div className="calendar-print-view">
        <div className="border border-gray-300">
          {/* Header */}
          <div className="grid grid-cols-[80px_1fr] gap-0">
            <div className="bg-gray-100 border-b border-gray-300 p-2 text-center font-semibold">
              Time
            </div>
            <div className="bg-gray-100 border-b border-gray-300 p-2 text-center font-semibold">
              {formatDateDisplay(selectedDate)}
            </div>
          </div>
          
          {/* Schedule blocks */}
          {sortedBlocks.map((block) => {
            const activity = getActivity(block.activityId);
            const conflict = conflicts.get(block.id);
            
            return (
              <div key={block.id} className="grid grid-cols-[80px_1fr] gap-0 border-b border-gray-300">
                {/* Time column */}
                <div className="bg-gray-50 border-r border-gray-300 p-2 text-sm font-medium">
                  {formatTimeDisplay(block.startTime)} - {formatTimeDisplay(block.endTime)}
                </div>
                
                {/* Activity block */}
                <div 
                  className="p-3 text-sm"
                  style={{
                    backgroundColor: activity?.color === 'blue' ? '#dbeafe' :
                                   activity?.color === 'green' ? '#dcfce7' :
                                   activity?.color === 'purple' ? '#e9d5ff' :
                                   activity?.color === 'orange' ? '#fed7aa' :
                                   activity?.color === 'teal' ? '#ccfbf1' :
                                   activity?.color === 'indigo' ? '#e0e7ff' :
                                   activity?.color === 'pink' ? '#fce7f3' :
                                   activity?.color === 'yellow' ? '#fef3c7' :
                                   activity?.color === 'red' ? '#fee2e2' :
                                   activity?.color === 'gray' ? '#f3f4f6' : '#f3f4f6'
                  }}
                >
                  <div className="font-semibold text-base mb-2">
                    {activity?.title || "Unknown Activity"}
                  </div>
                  
                  {block.studentIds.length > 0 && showStudents && (
                    <div className="mb-2">
                      <div className="font-medium text-sm mb-1">Students:</div>
                      <div className="flex flex-wrap gap-1">
                        {block.studentIds.map((studentId) => {
                          const student = getStudent(studentId);
                          return student ? (
                            <span key={studentId} className="text-xs bg-blue-100 px-2 py-1 rounded">
                              {student.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  {block.aideIds.length > 0 && showAides && (
                    <div className="mb-2">
                      <div className="font-medium text-sm mb-1">Aides:</div>
                      <div className="flex flex-wrap gap-1">
                        {block.aideIds.map((aideId) => {
                          const aide = getAide(aideId);
                          return aide ? (
                            <span key={aideId} className="text-xs bg-green-100 px-2 py-1 rounded">
                              {aide.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  {conflict && showConflicts && (
                    <div className="mb-2 text-red-600 text-sm">
                      ⚠ {conflict.type === 'aide' ? 'Aide Conflict' : 'Student Conflict'}
                    </div>
                  )}
                  
                  {block.notes && showNotes && (
                    <div className="text-sm opacity-75">
                      📝 {block.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalendarWeekView = (filteredBlocks: Block[]) => {
    const weekDates = getWeekDates(selectedDate);
    const dayNames = getDayNames();
    
    return (
      <div className="calendar-print-view">
        <div className="border border-gray-300">
          {/* Header row */}
          <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-0">
            <div className="bg-gray-100 border-b border-gray-300 p-2 text-center font-semibold">
              Time
            </div>
            {dayNames.map((dayName, index) => (
              <div key={dayName} className="bg-gray-100 border-b border-gray-300 p-2 text-center font-semibold">
                <div>{dayName}</div>
                <div className="text-sm font-normal text-gray-600">
                  {formatDateDisplay(weekDates[index])}
                </div>
              </div>
            ))}
          </div>
          
          {/* Schedule blocks grouped by day */}
          {weekDates.map((date) => {
            const dayBlocks = filteredBlocks
              .filter(block => block.date === date)
              .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
            
            if (dayBlocks.length === 0) {
              return (
                <div key={date} className="grid grid-cols-[80px_repeat(5,1fr)] gap-0 border-b border-gray-300">
                  <div className="bg-gray-50 border-r border-gray-300 p-2 text-sm font-medium text-gray-500">
                    No sessions
                  </div>
                  {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="p-2 text-sm text-gray-500 text-center">
                      {i === weekDates.indexOf(date) ? "No sessions scheduled" : ""}
                    </div>
                  ))}
                </div>
              );
            }
            
            return dayBlocks.map((block, blockIndex) => {
              const activity = getActivity(block.activityId);
              const conflict = conflicts.get(block.id);
              const dayIndex = weekDates.indexOf(date);
              
              return (
                <div key={block.id} className="grid grid-cols-[80px_repeat(5,1fr)] gap-0 border-b border-gray-300">
                  {/* Time column */}
                  <div className="bg-gray-50 border-r border-gray-300 p-2 text-sm font-medium">
                    {formatTimeDisplay(block.startTime)} - {formatTimeDisplay(block.endTime)}
                  </div>
                  
                  {/* Day columns */}
                  {weekDates.map((dayDate, colIndex) => {
                    if (colIndex === dayIndex) {
                      // This is the day with the block
                      return (
                        <div 
                          key={dayDate}
                          className="p-3 text-sm"
                          style={{
                            backgroundColor: activity?.color === 'blue' ? '#dbeafe' :
                                           activity?.color === 'green' ? '#dcfce7' :
                                           activity?.color === 'purple' ? '#e9d5ff' :
                                           activity?.color === 'orange' ? '#fed7aa' :
                                           activity?.color === 'teal' ? '#ccfbf1' :
                                           activity?.color === 'indigo' ? '#e0e7ff' :
                                           activity?.color === 'pink' ? '#fce7f3' :
                                           activity?.color === 'yellow' ? '#fef3c7' :
                                           activity?.color === 'red' ? '#fee2e2' :
                                           activity?.color === 'gray' ? '#f3f4f6' : '#f3f4f6'
                          }}
                        >
                          <div className="font-semibold text-base mb-2">
                            {activity?.title || "Unknown Activity"}
                          </div>
                          
                          {block.studentIds.length > 0 && showStudents && (
                            <div className="mb-2">
                              <div className="font-medium text-sm mb-1">Students:</div>
                              <div className="flex flex-wrap gap-1">
                                {block.studentIds.map((studentId) => {
                                  const student = getStudent(studentId);
                                  return student ? (
                                    <span key={studentId} className="text-xs bg-blue-100 px-2 py-1 rounded">
                                      {student.name}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                          
                          {block.aideIds.length > 0 && showAides && (
                            <div className="mb-2">
                              <div className="font-medium text-sm mb-1">Aides:</div>
                              <div className="flex flex-wrap gap-1">
                                {block.aideIds.map((aideId) => {
                                  const aide = getAide(aideId);
                                  return aide ? (
                                    <span key={aideId} className="text-xs bg-green-100 px-2 py-1 rounded">
                                      {aide.name}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                          
                          {conflict && showConflicts && (
                            <div className="mb-2 text-red-600 text-sm">
                              ⚠ {conflict.type === 'aide' ? 'Aide Conflict' : 'Student Conflict'}
                            </div>
                          )}
                          
                          {block.notes && showNotes && (
                            <div className="text-sm opacity-75">
                              📝 {block.notes}
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      // Empty column for other days
                      return (
                        <div key={dayDate} className="p-2 text-sm text-gray-400 text-center">
                          {/* Empty space */}
                        </div>
                      );
                    }
                  })}
                </div>
              );
            });
          })}
        </div>
      </div>
    );
  };

  // Bulk print all student schedules
  const handleBulkPrintStudents = () => {
    if (students.length === 0) {
      toast({ title: "No Students", description: "No students available to print." });
      return;
    }
    
    setPrintMode('individual');
    setSelectedStudents(students.map(s => s.id));
    setSelectedAides([]);
    
    toast({ 
      title: "Printing Student Schedules", 
      description: `Preparing to print ${students.length} student schedules. Use your browser's print function.` 
    });
    
    // Small delay to ensure state updates
    setTimeout(() => window.print(), 100);
  };

  // Bulk print all aide schedules
  const handleBulkPrintAides = () => {
    if (aides.length === 0) {
      toast({ title: "No Aides", description: "No aides available to print." });
      return;
    }
    
    setPrintMode('individual');
    setSelectedAides(aides.map(a => a.id));
    setSelectedStudents([]);
    
    toast({ 
      title: "Printing Aide Schedules", 
      description: `Preparing to print ${aides.length} aide schedules. Use your browser's print function.` 
    });
    
    // Small delay to ensure state updates
    setTimeout(() => window.print(), 100);
  };

  if (blocksLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Hidden in print */}
      <header className="bg-card border-b border-border px-6 py-4 shadow-sm print:hidden">
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
              <Link href="/schedule">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:bg-accent hover:text-accent-foreground" 
                  data-testid="nav-schedule"
                >
                  Schedule
                </Button>
              </Link>
              <Button 
                variant="default" 
                size="sm" 
                className="bg-primary text-primary-foreground" 
                data-testid="nav-print"
              >
                Print View
              </Button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
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
            
            {/* Print Mode Selector */}
            <div className="flex items-center space-x-2">
              <Select value={printMode} onValueChange={(value: 'master' | 'individual') => setPrintMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="master">Master</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Print Format Selector */}
            <div className="flex items-center space-x-2">
              <Select value={printFormat} onValueChange={(value: 'list' | 'calendar') => setPrintFormat(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">List Format</SelectItem>
                  <SelectItem value="calendar">Calendar Format</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Print Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handlePrint}
                data-testid="button-print"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button
                onClick={handleDownloadPDF}
                data-testid="button-download-pdf"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>

            {/* Bulk Print Controls */}
            <div className="flex items-center space-x-2 border-l border-border pl-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkPrintStudents}
                disabled={students.length === 0}
              >
                <Users className="mr-2 h-4 w-4" />
                All Students
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkPrintAides}
                disabled={aides.length === 0}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                All Aides
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 print:p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Print Header */}
          <div className="text-center border-b border-border pb-4">
            <h1 className="text-3xl font-bold text-foreground print:text-black">
              {(selectedStudents.length > 0 || selectedAides.length > 0) ? 'Individual Schedules' : 'Master Schedule'}
            </h1>
            <p className="text-lg text-muted-foreground print:text-gray-600 mt-2">
              {formatDateDisplay(selectedDate)}
            </p>
            
            {/* Selection Status - Hidden in print */}
            {(selectedStudents.length > 0 || selectedAides.length > 0) && (
              <div className="print:hidden mt-3 flex justify-center space-x-4 text-sm">
                {selectedStudents.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-600 font-medium">
                      {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {selectedAides.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">
                      {selectedAides.length} Aide{selectedAides.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {selectedStudents.length === 0 && selectedAides.length === 0 && (
                  <div className="flex items-center space-x-1">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-500">No selections</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Filter Controls - Hidden in print */}
          <div className="print:hidden">
            <Tabs defaultValue="filters" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="filters">Filters & Options</TabsTrigger>
                <TabsTrigger value="individual">Individual Selection</TabsTrigger>
              </TabsList>
              
              <TabsContent value="filters" className="space-y-4">
                <Card className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-students"
                        checked={showStudents}
                        onCheckedChange={(checked) => setShowStudents(checked as boolean)}
                      />
                      <label htmlFor="show-students" className="text-sm font-medium">
                        Show Students
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-aides"
                        checked={showAides}
                        onCheckedChange={(checked) => setShowAides(checked as boolean)}
                      />
                      <label htmlFor="show-aides" className="text-sm font-medium">
                        Show Aides
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-conflicts"
                        checked={showConflicts}
                        onCheckedChange={(checked) => setShowConflicts(checked as boolean)}
                      />
                      <label htmlFor="show-conflicts" className="text-sm font-medium">
                        Show Conflicts
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-notes"
                        checked={showNotes}
                        onCheckedChange={(checked) => setShowNotes(checked as boolean)}
                      />
                      <label htmlFor="show-notes" className="text-sm font-medium">
                        Show Notes
                      </label>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="individual" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Student Selection */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold flex items-center">
                        <Users className="mr-2 h-5 w-5" />
                        Students
                      </h3>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={selectAllStudents}>
                          Select All
                        </Button>
                        <Button size="sm" variant="outline" onClick={clearAllSelections}>
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`student-${student.id}`}
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={(checked) => handleStudentToggle(student.id, checked as boolean)}
                          />
                          <label htmlFor={`student-${student.id}`} className="text-sm flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${getEntityBadgeClass(student.color).split(' ')[0]}`} />
                            {student.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Aide Selection */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold flex items-center">
                        <UserCheck className="mr-2 h-5 w-5" />
                        Aides
                      </h3>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={selectAllAides}>
                          Select All
                        </Button>
                        <Button size="sm" variant="outline" onClick={clearAllSelections}>
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {aides.map((aide) => (
                        <div key={aide.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`aide-${aide.id}`}
                            checked={selectedAides.includes(aide.id)}
                            onCheckedChange={(checked) => handleAideToggle(aide.id, checked as boolean)}
                          />
                          <label htmlFor={`aide-${aide.id}`} className="text-sm flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${getEntityBadgeClass(aide.color).split(' ')[0]}`} />
                            {aide.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Schedule Content */}
          <Card className="print:shadow-none print:border-0">
            <div className="p-6 print:p-4">
              {(() => {
                const filteredBlocks = getFilteredBlocks();
                
                if (blocks.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground">No Sessions Scheduled</h3>
                      <p className="text-muted-foreground">There are no sessions scheduled for this date.</p>
                    </div>
                  );
                }
                
                if ((selectedStudents.length > 0 || selectedAides.length > 0) && filteredBlocks.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground">No Sessions Match Selection</h3>
                      <p className="text-muted-foreground">
                        {selectedStudents.length === 0 && selectedAides.length === 0
                          ? "Please select students or aides to view their schedules."
                          : "No sessions found for the selected students and aides."}
                      </p>
                    </div>
                  );
                }
                
                // Render based on print format
                if (printFormat === 'calendar') {
                  // For calendar format, we need to determine if we're showing a single day or week
                  // For now, we'll show the week view if we have blocks spanning multiple days
                  const uniqueDates = [...new Set(filteredBlocks.map(block => block.date))];
                  const isWeekView = uniqueDates.length > 1;
                  
                  if (isWeekView) {
                    return renderCalendarWeekView(filteredBlocks);
                  } else {
                    return renderCalendarDayView(filteredBlocks);
                  }
                } else {
                  // List format (original)
                  return (
                    <div className="space-y-4">
                      {timeSlots.map((timeSlot) => {
                        const timeBlocks = getBlocksByTimeSlot(timeSlot);
                        
                        return (
                          <div key={timeSlot} className="border-b border-border last:border-b-0 pb-4 last:pb-0">
                            <div className="flex items-start space-x-6">
                              {/* Time */}
                              <div className="w-24 flex-shrink-0">
                                <p className="text-lg font-medium text-foreground print:text-black">
                                  {formatTimeDisplay(timeSlot)}
                                </p>
                              </div>

                              {/* Sessions */}
                              <div className="flex-1">
                                {timeBlocks.length === 0 ? (
                                  <p className="text-muted-foreground italic print:text-gray-500">
                                    No sessions
                                  </p>
                                ) : (
                                  <div className="space-y-3">
                                    {timeBlocks.map((block) => {
                                      const activity = getActivity(block.activityId);
                                      const conflict = conflicts.get(block.id);

                                      return (
                                        <div
                                          key={block.id}
                                          className="border border-border rounded-lg p-4 print:border-gray-300"
                                          data-testid={`print-block-${block.id}`}
                                        >
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                              <h3 className="text-lg font-semibold text-foreground print:text-black">
                                                {activity?.title || "Unknown Activity"}
                                              </h3>
                                              <div className="text-sm text-muted-foreground print:text-gray-600">
                                                {formatTimeDisplay(block.startTime)} - {formatTimeDisplay(block.endTime)}
                                              </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-2">
                                              {conflict && showConflicts && (
                                                <div className="flex items-center space-x-1">
                                                  {conflict.type === "aide" ? (
                                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                                  ) : (
                                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                  )}
                                                  <span className="text-xs text-muted-foreground print:text-gray-600">
                                                    {conflict.type === "aide" ? "Aide Conflict" : "Student Conflict"}
                                                  </span>
                                                </div>
                                              )}
                                              {block.notes && showNotes && (
                                                <div className="flex items-center space-x-1">
                                                  <StickyNote className="h-4 w-4 text-muted-foreground" />
                                                  <span className="text-xs text-muted-foreground print:text-gray-600">
                                                    Has Notes
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* Students and Aides */}
                                          <div className="space-y-2">
                                            {block.studentIds.length > 0 && showStudents && (
                                              <div>
                                                <p className="text-sm font-medium text-foreground print:text-black mb-1">
                                                  Students:
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                  {block.studentIds.map((studentId) => {
                                                    const student = getStudent(studentId);
                                                    if (!student) return null;
                                                    return (
                                                      <Badge
                                                        key={studentId}
                                                        variant="secondary"
                                                        className={`print:bg-gray-100 print:text-black ${getEntityBadgeClass(student.color)}`}
                                                      >
                                                        {student.name}
                                                      </Badge>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}

                                            {block.aideIds.length > 0 && showAides && (
                                              <div>
                                                <p className="text-sm font-medium text-foreground print:text-black mb-1">
                                                  Aides:
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                  {block.aideIds.map((aideId) => {
                                                    const aide = getAide(aideId);
                                                    if (!aide) return null;
                                                    return (
                                                      <Badge
                                                        key={aideId}
                                                        variant="secondary"
                                                        className={`print:bg-gray-100 print:text-black ${getEntityBadgeClass(aide.color)}`}
                                                      >
                                                        {aide.name}
                                                      </Badge>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}

                                            {block.notes && showNotes && (
                                              <div>
                                                <p className="text-sm font-medium text-foreground print:text-black mb-1">
                                                  Notes:
                                                </p>
                                                <p className="text-sm text-muted-foreground print:text-gray-700">
                                                  {block.notes}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
              })()}
            </div>
          </Card>

          {/* Summary Section - Print Only */}
          <div className="hidden print:block mt-8 pt-4 border-t border-gray-300">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="font-semibold">Total Sessions</p>
                <p className="text-2xl font-bold">{getFilteredBlocks().length}</p>
              </div>
              <div>
                <p className="font-semibold">Active Students</p>
                <p className="text-2xl font-bold">
                  {new Set(getFilteredBlocks().flatMap(block => block.studentIds)).size}
                </p>
              </div>
              <div>
                <p className="font-semibold">Conflicts</p>
                <p className="text-2xl font-bold">{conflicts.size}</p>
              </div>
            </div>
          </div>

          {/* Print Footer */}
          <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
            <p>Generated by AlliBoard • {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
