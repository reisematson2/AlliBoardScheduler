import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Student, Aide, Activity, insertStudentSchema, insertAideSchema, insertActivitySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EntityModalProps {
  open: boolean;
  onClose: () => void;
  type: "student" | "aide" | "activity";
  entity?: Student | Aide | Activity | null;
}

const colorOptions = [
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
  { value: "orange", label: "Orange" },
  { value: "teal", label: "Teal" },
  { value: "indigo", label: "Indigo" },
  { value: "pink", label: "Pink" },
  { value: "yellow", label: "Yellow" },
  { value: "red", label: "Red" },
];

export function EntityModal({ open, onClose, type, entity }: EntityModalProps) {
  const { toast } = useToast();
  const isEditing = !!entity;

  const getSchema = () => {
    switch (type) {
      case "student":
        return insertStudentSchema;
      case "aide":
        return insertAideSchema;
      case "activity":
        return insertActivitySchema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      name: "",
      title: "",
      color: "blue",
    },
  });

  useEffect(() => {
    if (entity) {
      if (type === "activity") {
        form.reset({
          title: (entity as Activity).title,
          color: entity.color,
        });
      } else {
        form.reset({
          name: (entity as Student | Aide).name,
          color: entity.color,
        });
      }
    } else {
      form.reset({
        name: "",
        title: "",
        color: "blue",
      });
    }
  }, [entity, form, type]);

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const endpoint = `/api/${type}s`;
      return apiRequest("POST", endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${type}s`] });
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully` });
      onClose();
    },
    onError: () => {
      toast({ title: `Failed to create ${type}`, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      const endpoint = `/api/${type}s/${entity!.id}`;
      return apiRequest("PUT", endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${type}s`] });
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully` });
      onClose();
    },
    onError: () => {
      toast({ title: `Failed to update ${type}`, variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const getTitle = () => {
    const entityName = type.charAt(0).toUpperCase() + type.slice(1);
    return isEditing ? `Edit ${entityName}` : `Add New ${entityName}`;
  };

  const getNameField = () => {
    return type === "activity" ? "title" : "name";
  };

  const getNameLabel = () => {
    return type === "activity" ? "Activity Title" : "Name";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid={`modal-${type}`}>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name={getNameField()}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getNameLabel()}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`Enter ${type} ${getNameField()}`}
                      {...field}
                      data-testid={`input-${type}-${getNameField()}`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid={`select-${type}-color`}>
                        <SelectValue placeholder="Select a color" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-3 h-3 rounded-full bg-${color.value}-500`}
                            />
                            <span>{color.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid={`button-cancel-${type}`}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid={`button-save-${type}`}
              >
                {isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
