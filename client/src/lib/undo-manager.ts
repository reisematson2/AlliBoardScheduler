/**
 * Undo Manager for tracking and undoing actions
 */

export interface UndoAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export interface UndoState {
  actions: UndoAction[];
  currentIndex: number;
  maxHistory: number;
}

class UndoManager {
  private state: UndoState = {
    actions: [],
    currentIndex: -1,
    maxHistory: 50, // Limit to 50 actions to prevent memory issues
  };

  private listeners: Set<() => void> = new Set();

  /**
   * Subscribe to undo state changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state changes
   */
  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Add an action to the undo history
   */
  addAction(type: 'create' | 'update' | 'delete', data: any): void {
    const action: UndoAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
    };

    // Remove any actions after current index (when user did something new after undoing)
    this.state.actions = this.state.actions.slice(0, this.state.currentIndex + 1);
    
    // Add new action
    this.state.actions.push(action);
    this.state.currentIndex = this.state.actions.length - 1;

    // Limit history size
    if (this.state.actions.length > this.state.maxHistory) {
      this.state.actions = this.state.actions.slice(-this.state.maxHistory);
      this.state.currentIndex = this.state.actions.length - 1;
    }

    this.notify();
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.state.currentIndex >= 0;
  }

  /**
   * Get the last action for undoing
   */
  getLastAction(): UndoAction | null {
    if (!this.canUndo()) return null;
    return this.state.actions[this.state.currentIndex];
  }

  /**
   * Undo the last action
   */
  undo(): UndoAction | null {
    if (!this.canUndo()) return null;
    
    const action = this.state.actions[this.state.currentIndex];
    this.state.currentIndex--;
    this.notify();
    return action;
  }

  /**
   * Clear all undo history
   */
  clear(): void {
    this.state.actions = [];
    this.state.currentIndex = -1;
    this.notify();
  }

  /**
   * Get undo history for debugging
   */
  getHistory(): UndoAction[] {
    return [...this.state.actions];
  }

  /**
   * Get current state
   */
  getState(): UndoState {
    return { ...this.state };
  }
}

// Export singleton instance
export const undoManager = new UndoManager();
