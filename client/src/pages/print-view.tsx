import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Download,
  Printer,
  AlertTriangle,
  AlertCircle,
  StickyNote,
} from "lucide-react";
import { Block, Student, Aide, Activity } from "@shared/schema";
import { getCurrentDate, formatTimeDisplay, formatDateDisplay, generateTimeSlots } from "@/lib/time-utils";
import { detectConflicts } from "@/lib/conflicts";
import { useToast } from "@/hooks/use-toast";

export default function PrintView() {
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
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

  const getBlocksByTimeSlot = (timeSlot: string) => {
    return blocks.filter(block => {
      const blockStartHour = parseInt(block.startTime.split(':')[0]);
      const slotHour = parseInt(timeSlot.split(':')[0]);
      return blockStartHour === slotHour;
    });
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
          </div>
        </div>
      </header>

      <main className="p-6 print:p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Print Header */}
          <div className="text-center border-b border-border pb-4">
            <h1 className="text-3xl font-bold text-foreground print:text-black">
              Daily Schedule
            </h1>
            <p className="text-lg text-muted-foreground print:text-gray-600 mt-2">
              {formatDateDisplay(selectedDate)}
            </p>
          </div>

          {/* Schedule Content */}
          <Card className="print:shadow-none print:border-0">
            <div className="p-6 print:p-4">
              {blocks.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No Sessions Scheduled</h3>
                  <p className="text-muted-foreground">There are no sessions scheduled for this date.</p>
                </div>
              ) : (
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
                                          {conflict && (
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
                                          {block.notes && (
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
                                        {block.studentIds.length > 0 && (
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

                                        {block.aideIds.length > 0 && (
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

                                        {block.notes && (
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
              )}
            </div>
          </Card>

          {/* Summary Section - Print Only */}
          <div className="hidden print:block mt-8 pt-4 border-t border-gray-300">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="font-semibold">Total Sessions</p>
                <p className="text-2xl font-bold">{blocks.length}</p>
              </div>
              <div>
                <p className="font-semibold">Active Students</p>
                <p className="text-2xl font-bold">
                  {new Set(blocks.flatMap(block => block.studentIds)).size}
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
