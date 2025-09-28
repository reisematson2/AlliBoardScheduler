import { useState } from "react";
import { RecurrencePattern } from "@shared/schema";
import { parseRecurrencePattern, serializeRecurrencePattern, getRecurrenceDisplayText } from "@shared/recurrence-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar, Repeat, X } from "lucide-react";

interface RecurrencePatternEditorProps {
  value: string; // JSON string from database
  onChange: (value: string) => void;
  onClose?: () => void;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function RecurrencePatternEditor({ value, onChange, onClose }: RecurrencePatternEditorProps) {
  const initialPattern = parseRecurrencePattern(value);
  const [pattern, setPattern] = useState<RecurrencePattern>(initialPattern);

  const handlePatternChange = (newPattern: RecurrencePattern) => {
    setPattern(newPattern);
    onChange(serializeRecurrencePattern(newPattern));
  };

  const handleTypeChange = (type: RecurrencePattern['type']) => {
    let newPattern: RecurrencePattern = { type };
    
    // Set sensible defaults based on type
    if (type === 'daily' || type === 'weekly') {
      newPattern.interval = 1;
    } else if (type === 'custom') {
      newPattern.daysOfWeek = [];
    }
    
    handlePatternChange(newPattern);
  };

  const handleIntervalChange = (interval: number) => {
    handlePatternChange({ ...pattern, interval });
  };

  const handleDayToggle = (dayIndex: number) => {
    const currentDays = pattern.daysOfWeek || [];
    let newDays: number[];
    
    if (currentDays.includes(dayIndex)) {
      newDays = currentDays.filter(day => day !== dayIndex);
    } else {
      newDays = [...currentDays, dayIndex].sort();
    }
    
    handlePatternChange({ ...pattern, daysOfWeek: newDays });
  };

  const handleEndDateChange = (endDate: string) => {
    handlePatternChange({ 
      ...pattern, 
      endDate: endDate || undefined 
    });
  };

  const handleMaxOccurrencesChange = (maxOccurrences: number | undefined) => {
    handlePatternChange({ 
      ...pattern, 
      maxOccurrences: maxOccurrences || undefined 
    });
  };

  return (
    <Card className="w-full" data-testid="recurrence-pattern-editor">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Repeat className="h-5 w-5" />
          Recurrence Pattern
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-recurrence">
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Pattern Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="recurrence-type">Repeat Type</Label>
          <Select value={pattern.type} onValueChange={handleTypeChange}>
            <SelectTrigger data-testid="select-recurrence-type">
              <SelectValue placeholder="Select recurrence type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No recurrence</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Interval Setting for Daily/Weekly */}
        {(pattern.type === 'daily' || pattern.type === 'weekly') && (
          <div className="space-y-2">
            <Label htmlFor="interval">Every</Label>
            <div className="flex items-center gap-2">
              <Input
                id="interval"
                type="number"
                min="1"
                max="365"
                value={pattern.interval || 1}
                onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                className="w-20"
                data-testid="input-recurrence-interval"
              />
              <span className="text-sm text-muted-foreground">
                {pattern.type === 'daily' ? 'days' : 'weeks'}
              </span>
            </div>
          </div>
        )}

        {/* Days of Week Selection for Custom */}
        {pattern.type === 'custom' && (
          <div className="space-y-2">
            <Label>Days of Week</Label>
            <div className="grid grid-cols-2 gap-2">
              {dayNames.map((dayName, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${index}`}
                    checked={pattern.daysOfWeek?.includes(index) || false}
                    onCheckedChange={() => handleDayToggle(index)}
                    data-testid={`checkbox-day-${index}`}
                  />
                  <Label htmlFor={`day-${index}`} className="text-sm">
                    {dayName}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* End Conditions */}
        {pattern.type !== 'none' && (
          <div className="space-y-4 border-t pt-4">
            <Label className="text-sm font-medium">End Conditions (Optional)</Label>
            
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={pattern.endDate || ''}
                onChange={(e) => handleEndDateChange(e.target.value)}
                data-testid="input-end-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-occurrences" className="text-sm">Max Occurrences</Label>
              <Input
                id="max-occurrences"
                type="number"
                min="1"
                max="1000"
                value={pattern.maxOccurrences || ''}
                onChange={(e) => handleMaxOccurrencesChange(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="No limit"
                className="w-32"
                data-testid="input-max-occurrences"
              />
            </div>
          </div>
        )}

        {/* Pattern Preview */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">Preview:</span>
            <span data-testid="text-recurrence-preview">
              {getRecurrenceDisplayText(pattern)}
            </span>
          </div>
          
          {pattern.endDate && (
            <div className="text-xs text-muted-foreground mt-1">
              Until: {new Date(pattern.endDate).toLocaleDateString()}
            </div>
          )}
          
          {pattern.maxOccurrences && (
            <div className="text-xs text-muted-foreground mt-1">
              Max: {pattern.maxOccurrences} occurrences
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}