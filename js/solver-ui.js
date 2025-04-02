// Solver UI Controller for Fruit Box B Game
class SolverUIController {
  constructor() {
    // UI elements
    this.solverButton = null;
    this.solverPanel = null;
    this.solverAlgorithmSelect = null;
    this.solveButton = null;
    this.solvingIndicator = null;
    
    // Reference to game state
    this.gameState = window.gameState;
    
    // Solvers
    this.solver = window.gameSolver;
    
    this.initUI();
  }
  
  initUI() {
    // Create solver toggle button
    this.solverButton = document.createElement('button');
    this.solverButton.id = 'solver-toggle';
    this.solverButton.className = 'bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-1 px-3 rounded text-sm';
    this.solverButton.textContent = 'Solver';
    
    // Create solver panel
    this.solverPanel = document.createElement('div');
    this.solverPanel.id = 'solver-panel';
    this.solverPanel.className = 'hidden mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg';
    
    // Create panel header
    const panelHeader = document.createElement('h3');
    panelHeader.className = 'font-bold mb-2';
    panelHeader.textContent = 'Puzzle Solver';
    this.solverPanel.appendChild(panelHeader);
    
    // Create algorithm selection
    const algorithmContainer = document.createElement('div');
    algorithmContainer.className = 'mb-3';
    
    const algorithmLabel = document.createElement('label');
    algorithmLabel.className = 'block text-sm font-medium mb-1';
    algorithmLabel.textContent = 'Choose heuristic:';
    algorithmContainer.appendChild(algorithmLabel);
    
    this.solverAlgorithmSelect = document.createElement('select');
    this.solverAlgorithmSelect.className = 'w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white';
    
    const algorithms = [
      { value: 'greedy', label: 'Greedy Search' },
      { value: 'frequency3', label: '3n Frequency' },
      { value: 'frequency4', label: '4n Frequency' },
      { value: 'frequency5', label: '5n Frequency' },
      { value: 'frequencyCustom', label: 'Custom Window Size' }
    ];
    
    algorithms.forEach(algo => {
      const option = document.createElement('option');
      option.value = algo.value;
      option.textContent = algo.label;
      this.solverAlgorithmSelect.appendChild(option);
    });
    
    algorithmContainer.appendChild(this.solverAlgorithmSelect);
    
    // Create custom window size inputs (initially hidden)
    const customSizeContainer = document.createElement('div');
    customSizeContainer.id = 'custom-window-size';
    customSizeContainer.className = 'mt-2 hidden';
    
    const customSizeLabel = document.createElement('label');
    customSizeLabel.className = 'block text-sm font-medium mb-1';
    customSizeLabel.textContent = 'Custom window size:';
    customSizeContainer.appendChild(customSizeLabel);
    
    // Create a flex container for width and height inputs
    const inputsContainer = document.createElement('div');
    inputsContainer.className = 'flex items-center gap-2';
    
    // Width input
    const widthContainer = document.createElement('div');
    widthContainer.className = 'flex-1';
    
    const widthLabel = document.createElement('label');
    widthLabel.className = 'block text-xs font-medium mb-1';
    widthLabel.textContent = 'Width (2-8):';
    widthContainer.appendChild(widthLabel);
    
    const widthInput = document.createElement('input');
    widthInput.type = 'number';
    widthInput.min = '2';
    widthInput.max = '8';
    widthInput.value = '5';
    widthInput.className = 'w-full p-1 border rounded bg-white dark:bg-gray-700 dark:text-white';
    widthContainer.appendChild(widthInput);
    
    // Height input
    const heightContainer = document.createElement('div');
    heightContainer.className = 'flex-1';
    
    const heightLabel = document.createElement('label');
    heightLabel.className = 'block text-xs font-medium mb-1';
    heightLabel.textContent = 'Height (2-8):';
    heightContainer.appendChild(heightLabel);
    
    const heightInput = document.createElement('input');
    heightInput.type = 'number';
    heightInput.min = '2';
    heightInput.max = '8';
    heightInput.value = '5';
    heightInput.className = 'w-full p-1 border rounded bg-white dark:bg-gray-700 dark:text-white';
    heightContainer.appendChild(heightInput);
    
    // Add containers to inputs container
    inputsContainer.appendChild(widthContainer);
    inputsContainer.appendChild(heightContainer);
    
    // Add inputs container to custom size container
    customSizeContainer.appendChild(inputsContainer);
    
    // Store references
    this.customSizeContainer = customSizeContainer;
    this.widthInput = widthInput;
    this.heightInput = heightInput;
    
    // Add event listener to show/hide custom size based on selection
    this.solverAlgorithmSelect.addEventListener('change', () => {
      if (this.solverAlgorithmSelect.value === 'frequencyCustom') {
        this.customSizeContainer.classList.remove('hidden');
      } else {
        this.customSizeContainer.classList.add('hidden');
      }
    });
    
    algorithmContainer.appendChild(customSizeContainer);
    this.solverPanel.appendChild(algorithmContainer);
    
    // Create solve button
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex items-center justify-between';
    
    this.solveButton = document.createElement('button');
    this.solveButton.className = 'bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded';
    this.solveButton.textContent = 'Find Solution';
    buttonContainer.appendChild(this.solveButton);
    
    // Create solving indicator (hidden initially)
    this.solvingIndicator = document.createElement('div');
    this.solvingIndicator.className = 'hidden text-sm ml-2';
    this.solvingIndicator.textContent = 'Solving...';
    buttonContainer.appendChild(this.solvingIndicator);
    
    this.solverPanel.appendChild(buttonContainer);
    
    // Create results info area
    this.resultsInfo = document.createElement('div');
    this.resultsInfo.className = 'mt-2 text-sm hidden';
    this.solverPanel.appendChild(this.resultsInfo);
    
    // Add explanation text
    const explanation = document.createElement('div');
    explanation.className = 'mt-2 text-xs text-gray-600 dark:text-gray-300';
    explanation.textContent = 'The solver finds a series of moves that maximize score. Solutions will be added to the move history for playback.';
    this.solverPanel.appendChild(explanation);
    
    // Add event listeners
    this.solverButton.addEventListener('click', () => this.toggleSolverPanel());
    this.solveButton.addEventListener('click', () => this.solvePuzzle());
    
    // Add the button to the UI (next to dark mode toggle)
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle && darkModeToggle.parentNode) {
      darkModeToggle.parentNode.appendChild(this.solverButton);
    }
    
    // Add the panel to the UI (after animation controls)
    // We'll do this after a short delay to ensure animation controls are created first
    setTimeout(() => {
      const animationControls = document.getElementById('animation-controls');
      if (animationControls && animationControls.parentNode) {
        animationControls.parentNode.insertBefore(this.solverPanel, animationControls.nextSibling);
      } else {
        // Fallback: add after debug panel
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel && debugPanel.parentNode) {
          debugPanel.parentNode.insertBefore(this.solverPanel, debugPanel.nextSibling);
        }
      }
    }, 600); // Slightly longer than the animation-controller initialization delay
  }
  
  toggleSolverPanel() {
    const isHidden = this.solverPanel.classList.contains('hidden');
    if (isHidden) {
      this.solverPanel.classList.remove('hidden');
      this.solverButton.textContent = 'Hide Solver';
    } else {
      this.solverPanel.classList.add('hidden');
      this.solverButton.textContent = 'Solver';
    }
  }
  
  solvePuzzle() {
    // Get current game board
    const board = this.gameState.grid;
    
    // Show solving indicator
    this.solvingIndicator.classList.remove('hidden');
    this.solveButton.disabled = true;
    this.solverAlgorithmSelect.disabled = true;
    this.resultsInfo.classList.add('hidden');
    
    // Use setTimeout to allow UI to update before starting computation
    setTimeout(() => {
      // Get selected algorithm
      const algorithm = this.solverAlgorithmSelect.value;
      let solution;
      
      try {
        // Solve using selected algorithm
        switch (algorithm) {
          case 'greedy':
            solution = this.solver.solveGreedy(board);
            break;
          case 'frequency3':
            solution = this.solver.solveWithFrequencyAnalysis(board, 3);
            break;
          case 'frequency4':
            solution = this.solver.solveWithFrequencyAnalysis(board, 4);
            break;
          case 'frequency5':
            solution = this.solver.solveWithFrequencyAnalysis(board, 5);
            break;
          case 'frequencyCustom':
            // Get custom window width and height (with validation)
            let width = parseInt(this.widthInput.value, 10);
            let height = parseInt(this.heightInput.value, 10);
            
            // Validate width
            if (isNaN(width) || width < 2) {
              width = 2;
            } else if (width > 8) {
              width = 8;
            }
            
            // Validate height
            if (isNaN(height) || height < 2) {
              height = 2;
            } else if (height > 8) {
              height = 8;
            }
            
            // Update UI with validated values
            this.widthInput.value = width;
            this.heightInput.value = height;
            
            // Create window size object
            const windowSize = { width, height };
            
            // Update results info to include window dimensions
            this.resultsInfo.textContent = `Using frequency analysis with ${width}×${height} window...`;
            
            solution = this.solver.solveWithFrequencyAnalysis(board, windowSize);
            break;
          default:
            solution = this.solver.solveGreedy(board);
        }
        
        // Add moves to move history if solution found
        if (solution && solution.moves && solution.moves.length > 0) {
          this.addSolutionToGameState(solution);
          
          // Show results info
          this.resultsInfo.textContent = `Found solution with ${solution.score} points (${solution.moves.length} moves).`;
          this.resultsInfo.classList.remove('hidden');
        } else {
          this.resultsInfo.textContent = 'No valid moves found.';
          this.resultsInfo.classList.remove('hidden');
        }
      } catch (error) {
        console.error('Error solving puzzle:', error);
        this.resultsInfo.textContent = 'Error finding solution. Try a different algorithm.';
        this.resultsInfo.classList.remove('hidden');
      }
      
      // Hide solving indicator and re-enable controls
      this.solvingIndicator.classList.add('hidden');
      this.solveButton.disabled = false;
      this.solverAlgorithmSelect.disabled = false;
    }, 50);
  }
  
  addSolutionToGameState(solution) {
    // Make sure we have the initial grid saved
    if (!this.gameState.initialGrid) {
      this.gameState.initialGrid = JSON.parse(JSON.stringify(this.gameState.grid));
    }
    
    // Format solution moves if necessary
    const formattedMoves = solution.moves.map(move => {
      // If the move is already in the correct format, return it as is
      if (move.cells) {
        return move;
      }
      // Otherwise, format it properly
      return {
        cells: move.cells || moveToCellsFormat(this.gameState.grid, move.topLeft, move.bottomRight)
      };
    });
    
    // Use the new addSolutionMoves method to handle the solution
    this.gameState.addSolutionMoves({
      moves: formattedMoves
    });
  }
}

// Wait for DOM to be ready before creating the controller
document.addEventListener('DOMContentLoaded', () => {
  // Create the solver UI controller after a short delay to ensure other components are ready
  setTimeout(() => {
    window.solverUIController = new SolverUIController();
  }, 500);
});
