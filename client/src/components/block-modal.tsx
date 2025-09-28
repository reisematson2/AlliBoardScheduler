import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Block, Student, Aide, Activity, insertBlockSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatTimeDisplay } from "@/lib/time-utils";

interface BlockModalProps {
  open: boolean;
  onClose: () => void;
  block?: Block | null;
  currentDate: string;
  initialStartTime?: string;
  initialEndTime?: string;
}

export function BlockModal({ 
  open, 
  onClose, 
  block, 
  currentDate,
  initialStartTime,
  initialEndTime 
}: BlockModalProps) {
  const { toast } = useToast();
  const isEditing = !!block;

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: aides = [] } = useQuery<Aide[]>({
    queryKey: ["/api/aides"],
  });

  const form = useForm({
    resolver: zodResolver(insertBlockSchema),
    defaultValues: {
      startTime: initialStartTime || "09:00",
      endTime: initialEndTime || "10:00",
      activityId: "",
      studentIds: [] as string[],
      aideIds: [] as string[],
      notes: "",
      recurrence: "none",
      date: currentDate,
    },
  });

  useEffect(() => {
    if (block) {
      form.reset({
        startTime: block.startTime,
        endTime: block.endTime,
        activityId: block.activityId,
        studentIds: block.studentIds,
        aideIds: block.aideIds,
        notes: block.notes || "",
        recurrence: block.recurrence || "none",
        date: block.date,
      });
    } else {
      form.reset({
        startTime: initialStartTime || "09:00",
        endTime: initialEndTime || "10:00",
        activityId: "",
        studentIds: [],
        aideIds: [],
        notes: "",
        recurrence: "none",
        date: currentDate,
      });
    }
  }, [block, form, currentDate, initialStartTime, initialEndTime]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/blocks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocks", currentDate] });
      toast({ title: "Schedule block created successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to create schedule block", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", `/api/blocks/${block!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocks", currentDate] });
      toast({ title: "Schedule block updated successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update schedule block", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/blocks/${block!.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocks", currentDate] });
      toast({ title: "Schedule block deleted successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to delete schedule block", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this schedule block?")) {
      deleteMutation.mutate();
    }
  };

  const handleStudentToggle = (studentId: string, checked: boolean) => {
    const currentStudents = form.getValues("studentIds");
    if (checked) {
      form.setValue("studentIds", [...currentStudents, studentId]);
    } else {
      form.setValue("studentIds", currentStudents.filter(id => id !== studentId));
    }
  };

  const handleAideToggle = (aideId: string, checked: boolean) => {
    const currentAides = form.getValues("aideIds");
    if (checked) {
      form.setValue("aideIds", [...currentAides, aideId]);
    } else {
      form.setValue("aideIds", currentAides.filter(id => id !== aideId));
    }
  };

  const getEntityColor = (color: string) => {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-block">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Schedule Block" : "Create Schedule Block"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Activity Selection */}
            <FormField
              control={form.control}
              name="activityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-activity">
                        <SelectValue placeholder="Select an activity" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activities.map((activity) => (
                        <SelectItem key={activity.id} value={activity.id}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${getColorDot(activity.color)}`} />
                            <span>{activity.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        data-testid="input-start-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        data-testid="input-end-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Students Assignment */}
            <FormField
              control={form.control}
              name="studentIds"
              render={() => (
                <FormItem>
                  <FormLabel>Assigned Students</FormLabel>
                  <FormControl>
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                      {students.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No students available</p>
                      ) : (
                        students.map((student) => (
                          <div key={student.id} className="flex items-center space-x-3">
                            <Checkbox
                              checked={form.watch("studentIds").includes(student.id)}
                              onCheckedChange={(checked) => 
                                handleStudentToggle(student.id, checked as boolean)
                              }
                              data-testid={`checkbox-student-${student.id}`}
                            />
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${getColorDot(student.color)}`} />
                              <span className="text-sm">{student.name}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Aides Assignment */}
            <FormField
              control={form.control}
              name="aideIds"
              render={() => (
                <FormItem>
                  <FormLabel>Assigned Aides</FormLabel>
                  <FormControl>
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                      {aides.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No aides available</p>
                      ) : (
                        aides.map((aide) => (
                          <div key={aide.id} className="flex items-center space-x-3">
                            <Checkbox
                              checked={form.watch("aideIds").includes(aide.id)}
                              onCheckedChange={(checked) => 
                                handleAideToggle(aide.id, checked as boolean)
                              }
                              data-testid={`checkbox-aide-${aide.id}`}
                            />
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${getColorDot(aide.color)}`} />
                              <span className="text-sm">{aide.name}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurrence */}
            <FormField
              control={form.control}
              name="recurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurrence</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-recurrence">
                        <SelectValue placeholder="Select recurrence" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No Repeat</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this session..."
                      rows={3}
                      {...field}
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-between pt-4">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-block"
                >
                  Delete Block
                </Button>
              )}
              <div className="flex space-x-3 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-block"
                >
                  {isEditing ? "Save Changes" : "Create Block"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
