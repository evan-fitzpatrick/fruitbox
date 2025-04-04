// Game State Manager - Updated for intuitive slider behavior
// This manages the central state of the game and ensures all dependent components stay in sync

class GameState {
  constructor() {
    // Core game state
    this.grid = [];
    this.score = 0;
    this.moveHistory = [];
    this.initialGrid = null;
    this.currentMoveIndex = -1;
    
    // Cached states for efficient navigation
    this.stateCache = {};
    
    // DOM elements (will be set during initialization)
    this.gameGridElement = null;
    this.scoreElement = null;
    
    // Callbacks
    this.onStateChangeCallbacks = [];
  }
  
  // Initialize with DOM elements
  init(gameGridElement, scoreElement) {
    this.gameGridElement = gameGridElement;
    this.scoreElement = scoreElement;
    return this;
  }
  
  // Register a callback to be called whenever the state changes
  onStateChange(callback) {
    if (typeof callback === 'function') {
      this.onStateChangeCallbacks.push(callback);
    }
    return this;
  }
  
  // Notify all listeners of a state change
  notifyStateChange() {
    // Execute all registered callbacks
    this.onStateChangeCallbacks.forEach(callback => callback(this));
    return this;
  }
  
  // Generate a random grid (replacing the server-side function)
  generateRandomGrid() {
    const grid = [];
    for (let row = 0; row < 10; row++) {
      const gridRow = [];
      for (let col = 0; col < 17; col++) {
        gridRow.push(Math.floor(Math.random() * 9) + 1); // Random number between 1-9
      }
      grid.push(gridRow);
    }
    return grid;
  }
  
  // Initialize a new game with a random grid
  newGame() {
    const newGrid = this.generateRandomGrid();
    this.setGrid(newGrid, true);
    return this;
  }
  
  // Load a new grid (either from server or from a file)
  setGrid(newGrid, resetMoveHistory = true) {
    this.grid = JSON.parse(JSON.stringify(newGrid)); // Deep copy
    
    if (resetMoveHistory) {
      this.initialGrid = JSON.parse(JSON.stringify(newGrid));
      this.moveHistory = [];
      this.currentMoveIndex = -1;
      this.score = 0;
      this.stateCache = {}; // Clear the cache
      
      // Add initial state to cache
      this.stateCache[-1] = {
        grid: JSON.parse(JSON.stringify(this.initialGrid)),
        score: 0
      };
    }
    
    this.updateScore();
    this.renderGrid();
    this.notifyStateChange();
    return this;
  }
  
  // Apply a move to the grid
  applyMove(move, recordMove = true) {
    if (!move || !move.cells || move.cells.length === 0) return this;
    
    const sum = move.cells.reduce((total, cell) => total + cell.value, 0);
    
    // Only apply valid moves (sum === 10)
    if (sum === 10) {
      // If this is the first move and we don't have an initial grid saved yet
      if (recordMove && !this.initialGrid && this.moveHistory.length === 0) {
        this.initialGrid = JSON.parse(JSON.stringify(this.grid));
        
        // Add initial state to cache
        this.stateCache[-1] = {
          grid: JSON.parse(JSON.stringify(this.initialGrid)),
          score: 0
        };
      }
      
      // Apply the move by setting cells to 0
      move.cells.forEach(cell => {
        this.grid[cell.row][cell.col] = 0;
      });
      
      // Update score
      this.score += move.cells.length;
      
      // Record the move if requested
      if (recordMove) {
        // UPDATED: Always truncate the move history at the current index
        // This ensures that when making a move at a previous state, future moves are discarded
        this.moveHistory = this.moveHistory.slice(0, this.currentMoveIndex + 1);
        
        // Clear cache entries beyond currentMoveIndex
        Object.keys(this.stateCache).forEach(index => {
          if (parseInt(index) > this.currentMoveIndex) {
            delete this.stateCache[index];
          }
        });
        
        this.moveHistory.push(JSON.parse(JSON.stringify(move)));
        this.currentMoveIndex = this.moveHistory.length - 1;
        
        // Cache the current state
        this.stateCache[this.currentMoveIndex] = {
          grid: JSON.parse(JSON.stringify(this.grid)),
          score: this.score
        };
      }
      
      // Update UI and notify listeners
      this.updateScore();
      this.renderGrid();
      this.notifyStateChange();
    }
    
    return this;
  }
  
  // Go to a specific move in the history
  goToMove(targetIndex) {
    if (!this.initialGrid) return this;
    
    // Validate the move index
    if (targetIndex < -1 || targetIndex >= this.moveHistory.length) {
      console.error(`Invalid move index: ${targetIndex}, valid range: -1 to ${this.moveHistory.length - 1}`);
      return this;
    }
    
    console.log(`Going to move index: ${targetIndex}`);
    
    // Optimization: Check if we have the target state cached
    if (this.stateCache[targetIndex]) {
      this.grid = JSON.parse(JSON.stringify(this.stateCache[targetIndex].grid));
      this.score = this.stateCache[targetIndex].score;
      this.currentMoveIndex = targetIndex;
      
      this.updateScore();
      this.renderGrid();
      this.notifyStateChange();
      return this;
    }
    
    // Optimization: Find the closest cached state before the target
    let startIndex = -1;
    let startState = null;
    
    for (let i = targetIndex - 1; i >= -1; i--) {
      if (this.stateCache[i]) {
        startIndex = i;
        startState = this.stateCache[i];
        break;
      }
    }
    
    if (!startState) {
      // Fallback: Start from initial state if no closer cached state found
      startIndex = -1;
      startState = {
        grid: JSON.parse(JSON.stringify(this.initialGrid)),
        score: 0
      };
      
      // Cache this state
      this.stateCache[-1] = startState;
    }
    
    // Apply moves starting from the closest cached state
    this.grid = JSON.parse(JSON.stringify(startState.grid));
    this.score = startState.score;
    
    // Apply moves from startIndex+1 to targetIndex
    for (let i = startIndex + 1; i <= targetIndex; i++) {
      if (i < this.moveHistory.length) {
        this.moveHistory[i].cells.forEach(cell => {
          this.grid[cell.row][cell.col] = 0;
        });
        this.score += this.moveHistory[i].cells.length;
      }
      
      // Cache intermediate states every 5 moves to prevent cache explosion
      if (i % 5 === 0 || i === targetIndex) {
        this.stateCache[i] = {
          grid: JSON.parse(JSON.stringify(this.grid)),
          score: this.score
        };
      }
    }
    
    this.currentMoveIndex = targetIndex;
    this.updateScore();
    this.renderGrid();
    this.notifyStateChange();
    
    return this;
  }
  
  // NEW METHOD: Add solution moves to replace future moves
  addSolutionMoves(solution) {
    if (!solution || !solution.moves || solution.moves.length === 0) return this;
    
    // First, truncate move history to the current state
    this.moveHistory = this.moveHistory.slice(0, this.currentMoveIndex + 1);
    
    // Clear cache entries beyond currentMoveIndex
    Object.keys(this.stateCache).forEach(index => {
      if (parseInt(index) > this.currentMoveIndex) {
        delete this.stateCache[index];
      }
    });
    
    // Add the solution moves to the move history
    for (const move of solution.moves) {
      this.moveHistory.push(move);
    }
    
    // Notify state change to update UI
    this.notifyStateChange();
    
    return this;
  }
  
  // Update the score display
  updateScore() {
    if (this.scoreElement) {
      this.scoreElement.textContent = this.score.toString();
    }
    return this;
  }
  
  // Render the grid
  renderGrid() {
    if (!this.gameGridElement) return this;
    
    this.gameGridElement.innerHTML = '';
    
    for (let row = 0; row < this.grid.length; row++) {
      for (let col = 0; col < this.grid[row].length; col++) {
        const cell = document.createElement('div');
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.style.gridRow = row + 1;
        cell.style.gridColumn = col + 1;
        
        if (this.grid[row][col] === 0) {
          cell.className = 'grid-cell empty';
        } else {
          cell.className = 'grid-cell';
          cell.dataset.value = this.grid[row][col];
          
          // Use the image icon instead of CSS-based circle
          const img = document.createElement('img');
          img.src = 'images/icon.png'; // Path to your icon
          img.alt = 'Icon';
          img.draggable = false;
          
          const number = document.createElement('div');
          number.className = 'number';
          number.textContent = this.grid[row][col];
          
          cell.appendChild(img);
          cell.appendChild(number);
        }
        
        this.gameGridElement.appendChild(cell);
      }
    }
    
    return this;
  }
  
  // Save the current game state to CSV
  saveToCSV() {
    // First line is a header that indicates the file format version
    let csvContent = 'FruitBoxB,v2\n';
    
    // Second line is the initial state of the grid (flattened)
    if (this.initialGrid) {
      const initialGridFlat = this.initialGrid.flat().join(',');
      csvContent += initialGridFlat + '\n';
    } else {
      const gridFlat = this.grid.flat().join(',');
      csvContent += gridFlat + '\n';
    }
    
    // Subsequent lines are the move sequences (if any)
    if (this.moveHistory.length > 0) {
      this.moveHistory.forEach(move => {
        const moveCells = move.cells.map(cell => `${cell.row},${cell.col},${cell.value}`).join(';');
        csvContent += moveCells + '\n';
      });
    }
    
    return csvContent;
  }
  
  // Load game state from CSV content
  loadFromCSV(csvContent) {
    const rows = csvContent.split('\n').filter(row => row.trim().length > 0);
    
    // Check if this is the new format with header
    if (rows[0].startsWith('FruitBoxB,v2')) {
      // New format with move sequences
      this.loadNewFormatGame(rows);
    } else {
      // Legacy format, just a grid
      this.loadLegacyFormatGame(rows);
    }
    
    return this;
  }
  
  // Load legacy format (just a grid)
  loadLegacyFormatGame(rows) {
    const newGrid = [];
    for (let row of rows) {
      const values = row.split(',').map(val => parseInt(val.trim(), 10));
      if (values.length === 17) {
        newGrid.push(values);
      }
    }
    
    if (newGrid.length === 10) {
      // Compute score as the number of cells with a value of 0 (open spaces)
      let computedScore = 0;
      newGrid.forEach(row => {
        row.forEach(val => {
          if (val === 0) computedScore++;
        });
      });
      
      // Set the grid and update everything
      this.grid = newGrid;
      this.score = computedScore;
      this.initialGrid = null;
      this.moveHistory = [];
      this.currentMoveIndex = -1;
      this.stateCache = {}; // Clear the cache
      
      this.updateScore();
      this.renderGrid();
      this.notifyStateChange();
      
      return true;
    }
    
    return false;
  }
  
  // Load new format game (initial grid + moves)
  loadNewFormatGame(rows) {
    // Row 1 is the header (already checked), Row 2 is the initial grid state
    const initialGridFlat = rows[1].split(',').map(val => parseInt(val.trim(), 10));
    
    if (initialGridFlat.length !== 170) { // 10x17 = 170 cells
      return false;
    }
    
    // Convert flat array to 2D grid
    const initialGrid = [];
    for (let i = 0; i < 10; i++) {
      initialGrid.push(initialGridFlat.slice(i * 17, (i + 1) * 17));
    }
    
    // Parse move sequences (if any)
    const moves = [];
    for (let i = 2; i < rows.length; i++) {
      const moveCells = rows[i].split(';');
      const cells = [];
      
      for (let cellData of moveCells) {
        const [row, col, value] = cellData.split(',').map(val => parseInt(val.trim(), 10));
        cells.push({ row, col, value });
      }
      
      moves.push({ cells });
    }
    
    // Set the initial grid state
    this.initialGrid = initialGrid;
    this.grid = JSON.parse(JSON.stringify(initialGrid));
    this.moveHistory = moves;
    this.currentMoveIndex = -1; // Start at the beginning (before any moves)
    this.score = 0;
    this.stateCache = {}; // Clear the cache
    
    // Pre-compute and cache states every 10 moves
    this.stateCache[-1] = {
      grid: JSON.parse(JSON.stringify(initialGrid)),
      score: 0
    };
    
    // If there are a lot of moves, pre-compute some cache points to improve slider performance
    if (moves.length > 20) {
      const cacheInterval = Math.max(5, Math.floor(moves.length / 10)); // Cache at least 10 points
      
      // Use setTimeout to avoid blocking the UI
      setTimeout(() => {
        let currentGrid = JSON.parse(JSON.stringify(initialGrid));
        let currentScore = 0;
        
        for (let i = 0; i < moves.length; i++) {
          // Apply the move
          moves[i].cells.forEach(cell => {
            currentGrid[cell.row][cell.col] = 0;
          });
          currentScore += moves[i].cells.length;
          
          // Cache at regular intervals and at the end
          if (i % cacheInterval === 0 || i === moves.length - 1) {
            this.stateCache[i] = {
              grid: JSON.parse(JSON.stringify(currentGrid)),
              score: currentScore
            };
          }
        }
        
        console.log(`Pre-computed ${Object.keys(this.stateCache).length} cache points for ${moves.length} moves`);
      }, 100);
    }
    
    this.updateScore();
    this.renderGrid();
    this.notifyStateChange();
    
    return true;
  }
  
  // Check if we have a move history
  hasMoveHistory() {
    return this.moveHistory.length > 0 && this.initialGrid !== null;
  }
  
  // Get the current state for export
  getState() {
    return {
      grid: this.grid,
      score: this.score,
      moveHistory: this.moveHistory,
      initialGrid: this.initialGrid,
      currentMoveIndex: this.currentMoveIndex
    };
  }
}

// Export a singleton instance
window.gameState = new GameState();
