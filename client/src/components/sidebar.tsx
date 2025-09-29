import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useDraggable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, Users, UserCheck, ClipboardList, GripVertical } from "lucide-react";
import { Student, Aide, Activity } from "@shared/schema";
import { EntityModal } from "./entity-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  onEntityUpdate?: () => void;
}

// Color utility functions
const getEntityColorClasses = (color: string) => {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
    green: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
    purple: "bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800",
    orange: "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
    teal: "bg-teal-50 border-teal-200 dark:bg-teal-950 dark:border-teal-800",
    indigo: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950 dark:border-indigo-800",
    pink: "bg-pink-50 border-pink-200 dark:bg-pink-950 dark:border-pink-800",
    yellow: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
    red: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
  };
  return colorMap[color] || "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800";
};

const getColorDot = (color: string) => {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    teal: "bg-teal-500",
    indigo: "bg-indigo-500",
    pink: "bg-pink-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };
  return colorMap[color] || "bg-gray-500";
};

// Draggable Student Component
function DraggableStudent({ student, onEdit, onDelete }: { 
  student: Student; 
  onEdit: (student: Student, type: "student") => void;
  onDelete: (id: string, type: "student") => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `student-${student.id}`,
    data: {
      type: 'student',
      entity: student,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 ${getEntityColorClasses(student.color)} ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground/50" />
          </div>
          <div className={`w-3 h-3 rounded-full ${getColorDot(student.color)}`} />
          <span className="font-medium text-sm" data-testid={`student-name-${student.id}`}>
            {student.name}
          </span>
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(student, "student")}
            data-testid={`button-edit-student-${student.id}`}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(student.id, "student")}
            data-testid={`button-delete-student-${student.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Draggable Aide Component
function DraggableAide({ aide, onEdit, onDelete }: { 
  aide: Aide; 
  onEdit: (aide: Aide, type: "aide") => void;
  onDelete: (id: string, type: "aide") => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `aide-${aide.id}`,
    data: {
      type: 'aide',
      entity: aide,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 ${getEntityColorClasses(aide.color)} ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground/50" />
          </div>
          <div className={`w-3 h-3 rounded-full ${getColorDot(aide.color)}`} />
          <span className="font-medium text-sm" data-testid={`aide-name-${aide.id}`}>
            {aide.name}
          </span>
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(aide, "aide")}
            data-testid={`button-edit-aide-${aide.id}`}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(aide.id, "aide")}
            data-testid={`button-delete-aide-${aide.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function Sidebar({ onEntityUpdate }: SidebarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"student" | "aide" | "activity">("student");
  const [editingEntity, setEditingEntity] = useState<Student | Aide | Activity | null>(null);
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

  const deleteStudentMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Student deleted successfully" });
      onEntityUpdate?.();
    },
    onError: () => {
      toast({ title: "Failed to delete student", variant: "destructive" });
    },
  });

  const deleteAideMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/aides/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/aides"] });
      toast({ title: "Aide deleted successfully" });
      onEntityUpdate?.();
    },
    onError: () => {
      toast({ title: "Failed to delete aide", variant: "destructive" });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/activities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({ title: "Activity deleted successfully" });
      onEntityUpdate?.();
    },
    onError: () => {
      toast({ title: "Failed to delete activity", variant: "destructive" });
    },
  });

  const handleAdd = (type: "student" | "aide" | "activity") => {
    setModalType(type);
    setEditingEntity(null);
    setModalOpen(true);
  };

  const handleEdit = (entity: Student | Aide | Activity, type: "student" | "aide" | "activity") => {
    setModalType(type);
    setEditingEntity(entity);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, type: "student" | "aide" | "activity") => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      switch (type) {
        case "student":
          await deleteStudentMutation.mutateAsync(id);
          break;
        case "aide":
          await deleteAideMutation.mutateAsync(id);
          break;
        case "activity":
          await deleteActivityMutation.mutateAsync(id);
          break;
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingEntity(null);
    onEntityUpdate?.();
  };

  return (
    <>
      <aside className="w-80 bg-card border-r border-border p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Students Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground flex items-center">
                <Users className="mr-2 h-5 w-5 text-blue-500" />
                Students
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAdd("student")}
                data-testid="button-add-student"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {students.length === 0 ? (
                <Card className="p-3 text-center">
                  <p className="text-sm text-muted-foreground">No students added yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleAdd("student")}
                    data-testid="button-add-first-student"
                  >
                    Add First Student
                  </Button>
                </Card>
              ) : (
                students.map((student) => (
                  <DraggableStudent
                    key={student.id}
                    student={student}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>

          {/* Aides Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground flex items-center">
                <UserCheck className="mr-2 h-5 w-5 text-orange-500" />
                Aides
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAdd("aide")}
                data-testid="button-add-aide"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {aides.length === 0 ? (
                <Card className="p-3 text-center">
                  <p className="text-sm text-muted-foreground">No aides added yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleAdd("aide")}
                    data-testid="button-add-first-aide"
                  >
                    Add First Aide
                  </Button>
                </Card>
              ) : (
                aides.map((aide) => (
                  <DraggableAide
                    key={aide.id}
                    aide={aide}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>

          {/* Activities Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground flex items-center">
                <ClipboardList className="mr-2 h-5 w-5 text-indigo-500" />
                Activities
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAdd("activity")}
                data-testid="button-add-activity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {activities.length === 0 ? (
                <Card className="p-3 text-center">
                  <p className="text-sm text-muted-foreground">No activities added yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleAdd("activity")}
                    data-testid="button-add-first-activity"
                  >
                    Add First Activity
                  </Button>
                </Card>
              ) : (
                activities.map((activity) => (
                  <Card
                    key={activity.id}
                    className={`p-3 ${getEntityColorClasses(activity.color)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getColorDot(activity.color)}`} />
                        <span className="font-medium text-sm" data-testid={`activity-title-${activity.id}`}>
                          {activity.title}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(activity, "activity")}
                          data-testid={`button-edit-activity-${activity.id}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(activity.id, "activity")}
                          data-testid={`button-delete-activity-${activity.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>

      <EntityModal
        open={modalOpen}
        onClose={handleModalClose}
        type={modalType}
        entity={editingEntity}
      />
    </>
  );
}
