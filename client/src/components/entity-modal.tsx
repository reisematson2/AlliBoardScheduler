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
import { ColorPicker } from "@/components/ui/color-picker";
import { Student, Aide, Activity, insertStudentSchema, insertAideSchema, insertActivitySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EntityModalProps {
  open: boolean;
  onClose: () => void;
  type: "student" | "aide" | "activity";
  entity?: Student | Aide | Activity | null;
}

// Color mapping for backward compatibility
const colorNameToHex: Record<string, string> = {
  blue: "#3B82F6",
  green: "#10B981", 
  purple: "#8B5CF6",
  orange: "#F59E0B",
  teal: "#14B8A6",
  indigo: "#6366F1",
  pink: "#EC4899",
  yellow: "#EAB308",
  red: "#EF4444",
};

const hexToColorName: Record<string, string> = {
  "#3B82F6": "blue",
  "#10B981": "green",
  "#8B5CF6": "purple", 
  "#F59E0B": "orange",
  "#14B8A6": "teal",
  "#6366F1": "indigo",
  "#EC4899": "pink",
  "#EAB308": "yellow",
  "#EF4444": "red",
};

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
      color: "#3B82F6", // Default to blue hex
    },
  });

  useEffect(() => {
    if (entity) {
      // Convert named color to hex if needed
      const colorValue = entity.color.startsWith('#') ? entity.color : colorNameToHex[entity.color] || "#3B82F6";
      
      if (type === "activity") {
        form.reset({
          title: (entity as Activity).title,
          color: colorValue,
        });
      } else {
        form.reset({
          name: (entity as Student | Aide).name,
          color: colorValue,
        });
      }
    } else {
      form.reset({
        name: "",
        title: "",
        color: "#3B82F6",
      });
    }
  }, [entity, form, type]);

  const getPlural = (entityType: string) => {
    switch (entityType) {
      case "activity":
        return "activities";
      default:
        return `${entityType}s`;
    }
  };

  const convertColorForSubmission = (color: string) => {
    // Convert hex color back to named color for backward compatibility
    return hexToColorName[color] || color;
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const endpoint = `/api/${getPlural(type)}`;
      const processedData = {
        ...data,
        color: convertColorForSubmission(data.color)
      };
      return apiRequest("POST", endpoint, processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${getPlural(type)}`] });
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully` });
      onClose();
    },
    onError: () => {
      toast({ title: `Failed to create ${type}`, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      const endpoint = `/api/${getPlural(type)}/${entity!.id}`;
      const processedData = {
        ...data,
        color: convertColorForSubmission(data.color)
      };
      return apiRequest("PUT", endpoint, processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${getPlural(type)}`] });
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
                  <FormControl>
                    <ColorPicker
                      value={field.value || "#3B82F6"}
                      onChange={field.onChange}
                    />
                  </FormControl>
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
