import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
  disabled?: boolean;
}

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#8B5CF6', // purple
  '#F59E0B', // orange
  '#14B8A6', // teal
  '#6366F1', // indigo
  '#EC4899', // pink
  '#EAB308', // yellow
  '#EF4444', // red
  '#6B7280', // gray
  '#F97316', // orange-500
  '#84CC16', // lime
  '#06B6D4', // cyan
  '#8B5A2B', // brown
  '#EC4899', // rose
  '#A855F7', // violet
];

export function ColorPicker({ value, onChange, className, disabled }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorChange = (color: string) => {
    onChange(color);
  };

  const handlePresetClick = (color: string) => {
    onChange(color);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: value || '#3B82F6' }}
            />
            <span>{value || 'Select color'}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Color Wheel</h4>
            <div className="flex justify-center">
              <HexColorPicker
                color={value || '#3B82F6'}
                onChange={handleColorChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Preset Colors</h4>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                    value === color ? "border-gray-900" : "border-gray-300"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handlePresetClick(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Custom Color</h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <div
                className="w-8 h-8 rounded border border-gray-300"
                style={{ backgroundColor: value || '#3B82F6' }}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
