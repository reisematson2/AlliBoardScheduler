export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function getBlockPosition(startTime: string, endTime: string) {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const duration = endMinutes - startMinutes;
  
  // Assuming 8:00 AM is the start of the day (480 minutes)
  const dayStart = 8 * 60; // 8:00 AM in minutes
  const topOffset = ((startMinutes - dayStart) / 60) * 64; // 64px per hour
  const height = (duration / 60) * 64; // 64px per hour
  
  return {
    top: topOffset,
    height: Math.max(height, 32), // Minimum height of 32px
  };
}

export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDateDisplay(date: string): string {
  const dateObj = new Date(date + 'T00:00:00');
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function generateTimeSlots(startHour: number = 8, endHour: number = 16): string[] {
  const slots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    const time = `${hour.toString().padStart(2, "0")}:00`;
    slots.push(time);
  }
  return slots;
}
