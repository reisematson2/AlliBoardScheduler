import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Calendar, 
  Users, 
  UserCheck, 
  ClipboardList, 
  AlertTriangle,
  TrendingUp,
  Clock
} from "lucide-react";
import { Student, Aide, Activity, Block } from "@shared/schema";
import { detectConflicts } from "@/lib/conflicts";
import { getCurrentDate } from "@/lib/time-utils";

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
    queryKey: ["/api/blocks", { date: currentDate }],
  });

  const conflicts = detectConflicts(blocks, students, aides);
  const conflictCount = conflicts.size;

  const todayBlocks = blocks.filter(block => block.date === currentDate);
  const activeStudentsToday = new Set(
    todayBlocks.flatMap(block => block.studentIds)
  ).size;

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
                <h2 className="text-2xl font-semibold text-foreground">Welcome to AlliBoard</h2>
                <p className="text-muted-foreground mt-1">
                  Manage your educational schedules with ease
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-lg font-medium text-foreground">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-total-students">
                      {students.length}
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
                    <p className="text-sm text-muted-foreground">Total Aides</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-total-aides">
                      {aides.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                    <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Activities</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-total-activities">
                      {activities.length}
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
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-conflicts">
                      {conflictCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Today's Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Scheduled Sessions</span>
                    <span className="font-medium" data-testid="today-sessions">{todayBlocks.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Students</span>
                    <span className="font-medium" data-testid="today-active-students">{activeStudentsToday}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Conflicts to Resolve</span>
                    <span className={`font-medium ${conflictCount > 0 ? 'text-destructive' : 'text-green-600'}`} data-testid="today-conflicts">
                      {conflictCount}
                    </span>
                  </div>
                </div>
                
                {todayBlocks.length === 0 ? (
                  <div className="mt-4 p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">No sessions scheduled for today</p>
                    <Link href="/schedule">
                      <Button variant="outline" size="sm" className="mt-2" data-testid="button-create-first-session">
                        Create your first session
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="mt-4">
                    <Link href="/schedule">
                      <Button variant="outline" className="w-full" data-testid="button-view-schedule">
                        View Full Schedule
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/schedule">
                    <Button variant="outline" className="w-full justify-start" data-testid="action-manage-schedule">
                      <Calendar className="mr-2 h-4 w-4" />
                      Manage Today's Schedule
                    </Button>
                  </Link>
                  
                  <Link href="/schedule">
                    <Button variant="outline" className="w-full justify-start" data-testid="action-add-session">
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Add New Session
                    </Button>
                  </Link>
                  
                  <Link href="/print">
                    <Button variant="outline" className="w-full justify-start" data-testid="action-print-schedule">
                      <Users className="mr-2 h-4 w-4" />
                      Print Schedule
                    </Button>
                  </Link>
                  
                  {conflictCount > 0 && (
                    <Link href="/schedule">
                      <Button variant="outline" className="w-full justify-start text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground" data-testid="action-resolve-conflicts">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Resolve Conflicts ({conflictCount})
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Entity Status */}
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
                  <Button className="mt-4" data-testid="button-complete-setup">
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
