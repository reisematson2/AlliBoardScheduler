import { RecurrencePattern } from './schema';
import { addDays, addWeeks, format, parseISO, isAfter, isBefore } from 'date-fns';

// Parse recurrence pattern from text field (JSON string)
export function parseRecurrencePattern(recurrenceText: string): RecurrencePattern {
  try {
    return JSON.parse(recurrenceText);
  } catch {
    // Fallback for legacy "none" text values
    return { type: 'none' };
  }
}

// Serialize recurrence pattern to text field (JSON string)
export function serializeRecurrencePattern(pattern: RecurrencePattern): string {
  return JSON.stringify(pattern);
}

// Generate dates for a recurrence pattern starting from a base date
export function generateRecurrenceDates(
  baseDate: string, // ISO date string (YYYY-MM-DD)
  pattern: RecurrencePattern,
  maxDates: number = 365 // Limit to prevent infinite generation
): string[] {
  if (pattern.type === 'none') {
    return [baseDate];
  }

  const dates: string[] = [baseDate];
  const startDate = parseISO(baseDate);
  let currentDate = startDate;
  let occurrenceCount = 1;

  while (dates.length < maxDates && occurrenceCount < (pattern.maxOccurrences || maxDates)) {
    let nextDate: Date | null = null;

    switch (pattern.type) {
      case 'daily': {
        const interval = pattern.interval || 1;
        nextDate = addDays(currentDate, interval);
        break;
      }
      
      case 'weekly': {
        const interval = pattern.interval || 1;
        nextDate = addWeeks(currentDate, interval);
        break;
      }
      
      case 'custom': {
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          // Find the next day that matches one of the specified days of the week
          let daysToAdd = 1;
          let foundMatch = false;
          
          for (let i = 1; i <= 7 && !foundMatch; i++) {
            const testDate = addDays(currentDate, i);
            const dayOfWeek = testDate.getDay();
            
            if (pattern.daysOfWeek.includes(dayOfWeek)) {
              nextDate = testDate;
              foundMatch = true;
            }
          }
          
          if (!foundMatch) {
            // If no matching day found in the next week, skip
            break;
          }
        } else {
          // Default to weekly if no days specified
          const interval = pattern.interval || 1;
          nextDate = addWeeks(currentDate, interval);
        }
        break;
      }
    }

    if (!nextDate) break;

    // Check if we've exceeded the end date
    if (pattern.endDate && isAfter(nextDate, parseISO(pattern.endDate))) {
      break;
    }

    const nextDateString = format(nextDate, 'yyyy-MM-dd');
    dates.push(nextDateString);
    currentDate = nextDate;
    occurrenceCount++;
  }

  return dates;
}

// Get display text for a recurrence pattern
export function getRecurrenceDisplayText(pattern: RecurrencePattern): string {
  switch (pattern.type) {
    case 'none':
      return 'No recurrence';
    
    case 'daily':
      const dailyInterval = pattern.interval || 1;
      if (dailyInterval === 1) {
        return 'Daily';
      }
      return `Every ${dailyInterval} days`;
    
    case 'weekly':
      const weeklyInterval = pattern.interval || 1;
      if (weeklyInterval === 1) {
        return 'Weekly';
      }
      return `Every ${weeklyInterval} weeks`;
    
    case 'custom': {
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDays = pattern.daysOfWeek
          .sort()
          .map(day => dayNames[day])
          .join(', ');
        return `Custom: ${selectedDays}`;
      }
      return 'Custom pattern';
    }
    
    default:
      return 'No recurrence';
  }
}

// Check if a date matches a recurrence pattern
export function dateMatchesRecurrence(
  date: string,
  baseDate: string,
  pattern: RecurrencePattern
): boolean {
  if (pattern.type === 'none') {
    return date === baseDate;
  }

  const generatedDates = generateRecurrenceDates(baseDate, pattern, 1000);
  return generatedDates.includes(date);
}