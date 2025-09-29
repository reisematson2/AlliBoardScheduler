import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Calendar, 
  Users, 
  UserCheck, 
  ClipboardList, 
  AlertTriangle,
  Clock,
  Plus,
  Eye,
  Printer,
  CheckCircle,
  XCircle,
  ArrowRight
} from "lucide-react";
import { Student, Aide, Activity, Block } from "@shared/schema";
import { detectConflicts } from "@/lib/conflicts";
import { getCurrentDate, formatTimeDisplay, formatDateDisplay } from "@/lib/time-utils";

export default function Home() {
  const currentDate = getCurrentDate();

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
    queryKey: ["/api/blocks", currentDate],
    queryFn: async () => {
      const res = await fetch(`/api/blocks?date=${currentDate}`, {
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

  const todayBlocks = blocks.filter(block => block.date === currentDate);
  const activeStudentsToday = new Set(
    todayBlocks.flatMap(block => block.studentIds)
  ).size;
  const activeAidesToday = new Set(
    todayBlocks.flatMap(block => block.aideIds)
  ).size;

  // Sort today's blocks by start time
  const sortedTodayBlocks = [...todayBlocks].sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  );

  // Get next upcoming activity
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const nextActivity = sortedTodayBlocks.find(block => block.startTime > currentTime);

  // Get students and aides not scheduled today
  const scheduledStudentIds = new Set(todayBlocks.flatMap(block => block.studentIds));
  const scheduledAideIds = new Set(todayBlocks.flatMap(block => block.aideIds));
  const availableStudents = students.filter(student => !scheduledStudentIds.has(student.id));
  const availableAides = aides.filter(aide => !scheduledAideIds.has(aide.id));

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
              <Button variant="ghost" size="sm" className="text-muted-foreground" data-testid="nav-dashboard">
                Dashboard
              </Button>
              <Link href="/schedule">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-accent hover:text-accent-foreground" data-testid="nav-schedule">
                  Schedule
                </Button>
              </Link>
              <Link href="/print">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-accent hover:text-accent-foreground" data-testid="nav-print">
                  Print View
                </Button>
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/schedule">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-go-to-schedule">
                <Calendar className="mr-2 h-4 w-4" />
                Go to Schedule
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Welcome Section */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Good morning! Here's your day</h2>
                <p className="text-muted-foreground mt-1">
                  {formatDateDisplay(currentDate)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Current Time</p>
                <p className="text-lg font-medium text-foreground">
                  {new Date().toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Students Today</p>
                    <p className="text-2xl font-bold text-foreground">
                      {activeStudentsToday}/{students.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <UserCheck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aides Today</p>
                    <p className="text-2xl font-bold text-foreground">
                      {activeAidesToday}/{aides.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                    <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sessions</p>
                    <p className="text-2xl font-bold text-foreground">
                      {todayBlocks.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${conflictCount > 0 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20'}`}>
                    <AlertTriangle className={`h-5 w-5 ${conflictCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conflicts</p>
                    <p className="text-2xl font-bold text-foreground">
                      {conflictCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Schedule Timeline */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-5 w-5" />
                      Today's Schedule
                    </div>
                    <Link href="/schedule">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Full Schedule
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sortedTodayBlocks.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No sessions scheduled</h3>
                      <p className="text-muted-foreground mb-4">Start planning your day by adding some activities</p>
                      <Link href="/schedule">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Add First Session
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortedTodayBlocks.map((block) => {
                        const activity = activities.find(a => a.id === block.activityId);
                        const blockStudents = students.filter(s => block.studentIds.includes(s.id));
                        const blockAides = aides.filter(a => block.aideIds.includes(a.id));
                        const isNext = nextActivity?.id === block.id;
                        
                        return (
                          <div 
                            key={block.id} 
                            className={`p-4 rounded-lg border-2 transition-all ${
                              isNext 
                                ? 'border-primary bg-primary/5 shadow-md' 
                                : 'border-border bg-card'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="font-medium text-foreground">
                                    {formatTimeDisplay(block.startTime)} - {formatTimeDisplay(block.endTime)}
                                  </span>
                                  {isNext && (
                                    <Badge variant="default" className="bg-primary text-primary-foreground">
                                      Next
                                    </Badge>
                                  )}
                                </div>
                                
                                <h4 className="font-semibold text-foreground mb-2">
                                  {activity?.title || 'Unknown Activity'}
                                </h4>
                                
                                {block.notes && (
                                  <p className="text-sm text-muted-foreground mb-3">{block.notes}</p>
                                )}
                                
                                <div className="flex flex-wrap gap-2">
                                  {blockStudents.map((student) => (
                                    <Badge key={student.id} variant="secondary" className="text-xs">
                                      <div className={`w-2 h-2 rounded-full bg-${student.color}-500 mr-1`} />
                                      {student.name}
                                    </Badge>
                                  ))}
                                  {blockAides.map((aide) => (
                                    <Badge key={aide.id} variant="outline" className="text-xs">
                                      <div className={`w-2 h-2 rounded-full bg-${aide.color}-500 mr-1`} />
                                      {aide.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ClipboardList className="mr-2 h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Link href="/schedule">
                      <Button variant="outline" className="w-full justify-start">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Session
                      </Button>
                    </Link>
                    
                    <Link href="/print">
                      <Button variant="outline" className="w-full justify-start">
                        <Printer className="mr-2 h-4 w-4" />
                        Print Schedule
                      </Button>
                    </Link>
                    
                    {conflictCount > 0 && (
                      <Link href="/schedule">
                        <Button variant="outline" className="w-full justify-start text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Resolve Conflicts ({conflictCount})
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Student Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Student Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Scheduled</span>
                      <span className="font-medium text-green-600">{activeStudentsToday}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Available</span>
                      <span className="font-medium text-blue-600">{availableStudents.length}</span>
                    </div>
                    
                    {availableStudents.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">Available today:</p>
                        <div className="space-y-1">
                          {availableStudents.slice(0, 3).map((student) => (
                            <div key={student.id} className="flex items-center text-xs">
                              <div className={`w-2 h-2 rounded-full bg-${student.color}-500 mr-2`} />
                              <span className="text-muted-foreground">{student.name}</span>
                            </div>
                          ))}
                          {availableStudents.length > 3 && (
                            <p className="text-xs text-muted-foreground">+{availableStudents.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Aide Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCheck className="mr-2 h-5 w-5" />
                    Aide Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Scheduled</span>
                      <span className="font-medium text-green-600">{activeAidesToday}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Available</span>
                      <span className="font-medium text-blue-600">{availableAides.length}</span>
                    </div>
                    
                    {availableAides.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">Available today:</p>
                        <div className="space-y-1">
                          {availableAides.slice(0, 3).map((aide) => (
                            <div key={aide.id} className="flex items-center text-xs">
                              <div className={`w-2 h-2 rounded-full bg-${aide.color}-500 mr-2`} />
                              <span className="text-muted-foreground">{aide.name}</span>
                            </div>
                          ))}
                          {availableAides.length > 3 && (
                            <p className="text-xs text-muted-foreground">+{availableAides.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Setup Required Notice */}
          {(students.length === 0 || aides.length === 0 || activities.length === 0) && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/10">
              <CardHeader>
                <CardTitle className="text-orange-800 dark:text-orange-200">Setup Required</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-orange-700 dark:text-orange-300 mb-4">
                  To start creating schedules, you'll need to set up the following:
                </p>
                <div className="space-y-2">
                  {students.length === 0 && (
                    <div className="flex items-center text-orange-700 dark:text-orange-300">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Add students to your roster</span>
                    </div>
                  )}
                  {aides.length === 0 && (
                    <div className="flex items-center text-orange-700 dark:text-orange-300">
                      <UserCheck className="mr-2 h-4 w-4" />
                      <span>Add aides to your team</span>
                    </div>
                  )}
                  {activities.length === 0 && (
                    <div className="flex items-center text-orange-700 dark:text-orange-300">
                      <ClipboardList className="mr-2 h-4 w-4" />
                      <span>Create activity types</span>
                    </div>
                  )}
                </div>
                <Link href="/schedule">
                  <Button className="mt-4">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Complete Setup
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
