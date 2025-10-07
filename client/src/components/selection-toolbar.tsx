import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, X, CheckSquare, Square, Undo } from 'lucide-react';
import { selectionManager, SelectionState } from '@/lib/selection-manager';
import { undoManager } from '@/lib/undo-manager';

interface SelectionToolbarProps {
  onDeleteSelected: (blockIds: string[]) => void;
  onUndo: () => void;
  totalBlocks: number;
}

export function SelectionToolbar({ onDeleteSelected, onUndo, totalBlocks }: SelectionToolbarProps) {
  const [selectionState, setSelectionState] = useState<SelectionState>(selectionManager.getState());
  const [canUndo, setCanUndo] = useState(undoManager.canUndo());

  useEffect(() => {
    const unsubscribeSelection = selectionManager.subscribe(setSelectionState);
    const unsubscribeUndo = undoManager.subscribe(() => {
      setCanUndo(undoManager.canUndo());
    });

    return () => {
      unsubscribeSelection();
      unsubscribeUndo();
    };
  }, []);

  const handleSelectAll = () => {
    // This would need to be passed from parent component with all block IDs
    // For now, we'll just toggle multi-select mode
    selectionManager.setMultiSelectMode(!selectionState.isMultiSelectMode);
  };

  const handleClearSelection = () => {
    selectionManager.clearSelection();
  };

  const handleDeleteSelected = () => {
    const selectedBlocks = selectionManager.getSelectedBlocks();
    if (selectedBlocks.length > 0) {
      onDeleteSelected(selectedBlocks);
    }
  };

  const handleUndo = () => {
    onUndo();
  };

  if (!selectionState.selectedBlocks.size && !canUndo) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 border-b">
      {/* Selection info */}
      {selectionState.selectedBlocks.size > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {selectionState.selectedBlocks.size} selected
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="h-6 px-2 text-xs"
          >
            {selectionState.isMultiSelectMode ? (
              <>
                <CheckSquare className="h-3 w-3 mr-1" />
                Multi-select
              </>
            ) : (
              <>
                <Square className="h-3 w-3 mr-1" />
                Select All
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            className="h-6 px-2 text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Undo button */}
      {canUndo && (
        <div className="flex items-center gap-2">
          {selectionState.selectedBlocks.size > 0 && <div className="w-px h-4 bg-border" />}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            className="h-6 px-2 text-xs"
          >
            <Undo className="h-3 w-3 mr-1" />
            Undo
          </Button>
        </div>
      )}
    </div>
  );
}

