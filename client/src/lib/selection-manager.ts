/**
 * Selection Manager for handling block selection
 */

export interface SelectionState {
  selectedBlocks: Set<string>;
  isMultiSelectMode: boolean;
}

class SelectionManager {
  private state: SelectionState = {
    selectedBlocks: new Set(),
    isMultiSelectMode: false,
  };

  private listeners: Set<(state: SelectionState) => void> = new Set();

  /**
   * Subscribe to selection changes
   */
  subscribe(listener: (state: SelectionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state changes
   */
  private notify(): void {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  /**
   * Select a block
   */
  selectBlock(blockId: string): void {
    if (!this.state.isMultiSelectMode) {
      this.state.selectedBlocks.clear();
    }
    this.state.selectedBlocks.add(blockId);
    this.notify();
  }

  /**
   * Deselect a block
   */
  deselectBlock(blockId: string): void {
    this.state.selectedBlocks.delete(blockId);
    this.notify();
  }

  /**
   * Toggle block selection
   */
  toggleBlock(blockId: string): void {
    if (this.state.selectedBlocks.has(blockId)) {
      this.deselectBlock(blockId);
    } else {
      this.selectBlock(blockId);
    }
  }

  /**
   * Select multiple blocks
   */
  selectBlocks(blockIds: string[]): void {
    this.state.selectedBlocks.clear();
    blockIds.forEach(id => this.state.selectedBlocks.add(id));
    this.notify();
  }

  /**
   * Select all blocks
   */
  selectAllBlocks(allBlockIds: string[]): void {
    this.state.selectedBlocks.clear();
    allBlockIds.forEach(id => this.state.selectedBlocks.add(id));
    this.notify();
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.state.selectedBlocks.clear();
    this.notify();
  }

  /**
   * Check if a block is selected
   */
  isSelected(blockId: string): boolean {
    return this.state.selectedBlocks.has(blockId);
  }

  /**
   * Get selected block IDs
   */
  getSelectedBlocks(): string[] {
    return Array.from(this.state.selectedBlocks);
  }

  /**
   * Get selection count
   */
  getSelectionCount(): number {
    return this.state.selectedBlocks.size;
  }

  /**
   * Check if any blocks are selected
   */
  hasSelection(): boolean {
    return this.state.selectedBlocks.size > 0;
  }

  /**
   * Enable/disable multi-select mode
   */
  setMultiSelectMode(enabled: boolean): void {
    this.state.isMultiSelectMode = enabled;
    if (!enabled) {
      // If disabling multi-select, keep only the first selected item
      const selected = Array.from(this.state.selectedBlocks);
      this.state.selectedBlocks.clear();
      if (selected.length > 0) {
        this.state.selectedBlocks.add(selected[0]);
      }
    }
    this.notify();
  }

  /**
   * Get current state
   */
  getState(): SelectionState {
    return { ...this.state };
  }
}

// Export singleton instance
export const selectionManager = new SelectionManager();

