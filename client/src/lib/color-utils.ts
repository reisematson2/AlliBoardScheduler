/**
 * Utility functions for color manipulation and text contrast
 */

/**
 * Converts a hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculates the relative luminance of a color
 * Based on WCAG guidelines: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Determines if a color is dark or light
 * Returns true if the color is dark (needs light text)
 */
export function isDarkColor(color: string): boolean {
  // Handle named colors - these are the base colors, but the schedule uses light variants
  const namedColors: Record<string, string> = {
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

  // For schedule blocks, we need to check if the actual background is light or dark
  // The schedule uses light variants (bg-*-100) which are always light backgrounds
  const hexColor = color.startsWith('#') ? color : namedColors[color] || "#3B82F6";
  const rgb = hexToRgb(hexColor);
  
  if (!rgb) return false;
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  // For named colors used in schedule blocks (which use light backgrounds), always return false
  // This ensures we use dark text on light backgrounds
  if (!color.startsWith('#')) {
    return false;
  }
  
  return luminance < 0.3;
}

/**
 * Gets appropriate text color class for a given background color
 */
export function getTextColorClass(color: string): string {
  return isDarkColor(color) 
    ? "text-white" 
    : "text-gray-800 dark:text-gray-200";
}

/**
 * Gets appropriate text color for muted text on a given background color
 */
export function getMutedTextColorClass(color: string): string {
  return isDarkColor(color) 
    ? "text-white/90" 
    : "text-gray-600 dark:text-gray-400";
}
