/**
 * Editor Utilities (Undo/Redo & Clipboard)
 */

window.EditorHistory = class {
  constructor() {
    this.past = [];
    this.future = [];
  }

  // Action format: { undo: () => {}, redo: () => {} }
  push(action) {
    this.past.push(action);
    if(this.past.length > 50) {
      this.past.shift(); // remove oldest to keep max 50 snapshots
    }
    this.future = []; // clear future on new action
  }

  undo() {
    if (this.past.length === 0) return;
    const action = this.past.pop();
    action.undo();
    this.future.push(action);
  }

  redo() {
    if (this.future.length === 0) return;
    const action = this.future.pop();
    action.redo();
    this.past.push(action);
  }

  canUndo() { return this.past.length > 0; }
  canRedo() { return this.future.length > 0; }
  clear() {
    this.past = [];
    this.future = [];
  }
};

window.EditorClipboard = {
  data: null, // Stores serialized element data

  copy(elementData) {
    this.data = JSON.parse(JSON.stringify(elementData));
    if(window.showToast) window.showToast('Copied to clipboard');
  },

  paste() {
    if (!this.data) return null;
    const pasted = JSON.parse(JSON.stringify(this.data));
    pasted.id = 'el-' + Date.now(); // Generate new ID
    // offset position slightly so it doesn't paste exactly on top
    if(pasted.x !== undefined) pasted.x += 20;
    if(pasted.y !== undefined) pasted.y += 20;
    return pasted;
  },

  duplicate(elementData) {
    if (!elementData) return null;
    const duplicated = JSON.parse(JSON.stringify(elementData));
    duplicated.id = 'el-' + Date.now(); // Generate new ID
    // instant inline copy placed right beside it
    if(duplicated.x !== undefined) duplicated.x += 20;
    if(duplicated.y !== undefined) duplicated.y += 20;
    return duplicated;
  }
};

// Global instance for active board
window.activeHistory = new window.EditorHistory();

// Global Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  // Don't trigger if user is typing in an input or textarea
  if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
    return;
  }

  if (window.activeRole === 'client') return; // Clients cannot edit

  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z') {
      e.preventDefault();
      window.activeHistory.undo();
    } else if (e.key === 'y') {
      e.preventDefault();
      window.activeHistory.redo();
    } else if (e.key === 'c') {
      // Logic for copying active element will be handled per view
      if(window.handleGlobalCopy) window.handleGlobalCopy(e);
    } else if (e.key === 'v') {
      // Logic for pasting active element will be handled per view
      if(window.handleGlobalPaste) window.handleGlobalPaste(e);
    }
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if(window.handleGlobalDelete) window.handleGlobalDelete(e);
  }
});
