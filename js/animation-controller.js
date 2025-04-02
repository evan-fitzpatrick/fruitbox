// Animation Controller for Fruit Box B Game
class AnimationController {
  constructor() {
    // Animation state
    this.isAnimating = false;
    this.animationSpeed = 500; // milliseconds per move
    this.highlightTimeout = null;
    
    // Animation controls
    this.controlsContainer = null;
    this.sliderElement = null;
    this.moveCounter = null;
    this.playButton = null;
    this.pauseButton = null;
    this.stopButton = null;
    this.speedControl = null;
    
    // Reference to the game state
    this.gameState = window.gameState;
    
    // Initialize controls
    this.initControls();
    
    // Listen for game state changes
    this.gameState.onStateChange(this.handleStateChange.bind(this));
  }
  
  initControls() {
    // Create animation controls container if it doesn't exist
    if (!document.getElementById('animation-controls')) {
      const container = document.createElement('div');
      container.id = 'animation-controls';
      container.className = 'hidden mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg';
      this.controlsContainer = container;
      
      // Create slider
      const sliderContainer = document.createElement('div');
      sliderContainer.className = 'flex items-center mb-3';
      
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '0';
      slider.value = '0';
      slider.className = 'w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer';
      slider.id = 'move-slider';
      this.sliderElement = slider;
      
      const moveCounter = document.createElement('span');
      moveCounter.className = 'ml-3 text-sm';
      moveCounter.textContent = '0 / 0';
      moveCounter.id = 'move-counter';
      this.moveCounter = moveCounter;
      
      sliderContainer.appendChild(slider);
      sliderContainer.appendChild(moveCounter);
      
      // Create playback controls
      const controls = document.createElement('div');
      controls.className = 'flex gap-2 mb-3';
      
      this.playButton = document.createElement('button');
      this.playButton.innerHTML = '▶️ Play';
      this.playButton.className = 'bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-sm';
      
      this.pauseButton = document.createElement('button');
      this.pauseButton.innerHTML = '⏸️ Pause';
      this.pauseButton.className = 'bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-sm';
      
      this.stopButton = document.createElement('button');
      this.stopButton.innerHTML = '⏪ Reset';
      this.stopButton.className = 'bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm';
      
      // Create speed control
      this.speedControl = document.createElement('select');
      this.speedControl.className = 'ml-auto bg-white dark:bg-gray-700 border border-gray-300 rounded px-2 py-1 text-sm';
      
      const speeds = [
        { label: 'Slow', value: 1000 },
        { label: 'Normal', value: 500 },
        { label: 'Fast', value: 250 },
        { label: 'Very Fast', value: 100 }
      ];
      
      speeds.forEach(speed => {
        const option = document.createElement('option');
        option.value = speed.value;
        option.textContent = speed.label;
        if (speed.value === this.animationSpeed) {
          option.selected = true;
        }
        this.speedControl.appendChild(option);
      });
      
      controls.appendChild(this.playButton);
      controls.appendChild(this.pauseButton);
      controls.appendChild(this.stopButton);
      controls.appendChild(this.speedControl);
      
      // Append all elements to the container
      container.appendChild(sliderContainer);
      container.appendChild(controls);
      
      // Add container after the debug panel
      const debugPanel = document.getElementById('debug-panel');
      debugPanel.parentNode.insertBefore(container, debugPanel.nextSibling);
      
      // Add event listeners
      this.sliderElement.addEventListener('input', this.handleSliderChange.bind(this));
      this.playButton.addEventListener('click', this.playAnimation.bind(this));
      this.pauseButton.addEventListener('click', this.pauseAnimation.bind(this));
      this.stopButton.addEventListener('click', this.stopAnimation.bind(this));
      this.speedControl.addEventListener('change', this.updateAnimationSpeed.bind(this));
    }
  }
  
  // Handle game state changes
  handleStateChange(gameState) {
    this.updateControls();
  }
  
  updateControls() {
    if (this.gameState.hasMoveHistory()) {
      this.showControls();
      this.updateSlider();
    } else {
      this.hideControls();
    }
  }
  
  showControls() {
    if (this.controlsContainer) {
      this.controlsContainer.classList.remove('hidden');
    }
  }
  
  hideControls() {
    if (this.controlsContainer) {
      this.controlsContainer.classList.add('hidden');
    }
    this.pauseAnimation();
  }
  
  updateSlider() {
    if (!this.sliderElement || !this.moveCounter) return;
    
    const totalMoves = this.gameState.moveHistory.length;
    
    // Slider positions: 
    // 0 = before any moves (initial state)
    // 1 = after first move
    // ...
    // N = after Nth move
    
    // When currentMoveIndex is -1, that means we're at the initial state (slider position 0)
    // When currentMoveIndex is 0, that means we're after the first move (slider position 1)
    const sliderPosition = this.gameState.currentMoveIndex + 1;
    
    console.log(`Current move index: ${this.gameState.currentMoveIndex}, Slider position: ${sliderPosition}`);
    
    // Set slider max value to the total number of moves
    this.sliderElement.max = totalMoves;
    
    // Set the current value to match the current move index (converting from 0-based to 1-based)
    this.sliderElement.value = sliderPosition;
    
    // Update the text display
    this.moveCounter.textContent = `${sliderPosition} / ${totalMoves}`;
  }
  
  handleSliderChange(event) {
    // The slider value is 1-based (1 to N), but our move index is 0-based (0 to N-1)
    // Additionally, position 0 on the slider means "before any moves"
    const sliderValue = parseInt(event.target.value);
    const newMoveIndex = sliderValue - 1; // Convert to 0-based index
    
    console.log(`Slider value: ${sliderValue}, New move index: ${newMoveIndex}`);
    
    if (newMoveIndex !== this.gameState.currentMoveIndex) {
      this.goToMove(newMoveIndex);
    }
  }
  
  goToMove(moveIndex) {
    // Stop any ongoing animation
    this.pauseAnimation();
    
    // Let the game state handle the move navigation
    this.gameState.goToMove(moveIndex);
    
    // After going to a specific move, highlight the NEXT move that will be applied
    // This shows the user what will happen next
    this.highlightCurrentMove();
  }
  
  // Highlight the cells of the current move
  highlightCurrentMove() {
    // For the current position, we want to highlight the NEXT move that will be applied
    // If we're at the last move, there's nothing to highlight
    const nextMoveIndex = this.gameState.currentMoveIndex + 1;
    
    if (nextMoveIndex >= this.gameState.moveHistory.length) {
      // No next move to highlight
      document.querySelectorAll('.grid-cell.selected').forEach(cell => {
        cell.classList.remove('selected');
      });
      return;
    }
    
    const move = this.gameState.moveHistory[nextMoveIndex];
    
    // Clear any existing highlights first
    document.querySelectorAll('.grid-cell.selected').forEach(cell => {
      cell.classList.remove('selected');
    });
    
    // Highlight cells from the next move
    move.cells.forEach(cell => {
      const domCell = document.querySelector(`.grid-cell[data-row="${cell.row}"][data-col="${cell.col}"]`);
      if (domCell) {
        domCell.classList.add('selected');
      }
    });
    
    // Remove the highlight after 5 seconds
    clearTimeout(this.highlightTimeout);
    this.highlightTimeout = setTimeout(() => {
      document.querySelectorAll('.grid-cell.selected').forEach(cell => {
        cell.classList.remove('selected');
      });
    }, 5000);
  }
  
  applyNextMove() {
    if (!this.isAnimating) return;
    
    // Determine the next move index
    const nextMoveIndex = this.gameState.currentMoveIndex + 1;
    
    if (nextMoveIndex >= this.gameState.moveHistory.length) {
      // End of animation
      this.pauseAnimation();
      return;
    }
    
    console.log(`Applying next move: ${nextMoveIndex}`);
    
    // Get the next move
    const nextMove = this.gameState.moveHistory[nextMoveIndex];
    
    // Clear any existing highlights first
    document.querySelectorAll('.grid-cell.selected').forEach(cell => {
      cell.classList.remove('selected');
    });
    
    // Highlight cells that are part of the move
    nextMove.cells.forEach(cell => {
      const domCell = document.querySelector(`.grid-cell[data-row="${cell.row}"][data-col="${cell.col}"]`);
      if (domCell) {
        domCell.classList.add('selected');
      }
    });
    
    // Wait for animation timing then apply the move
    setTimeout(() => {
      if (!this.isAnimating) return;
      
      // Go to this move
      this.gameState.goToMove(nextMoveIndex);
      
      // Continue animation if still in play mode and not at the end
      if (this.isAnimating && nextMoveIndex < this.gameState.moveHistory.length - 1) {
        this.applyNextMove();
      } else if (nextMoveIndex >= this.gameState.moveHistory.length - 1) {
        this.pauseAnimation();
      }
    }, this.animationSpeed);
  }
  
  playAnimation() {
    if (this.isAnimating) return;
    
    if (this.gameState.currentMoveIndex >= this.gameState.moveHistory.length - 1) {
      // If at the end, start over
      this.goToMove(-1);
    }
    
    this.isAnimating = true;
    
    // Short delay before starting the animation to ensure UI is ready
    setTimeout(() => {
      if (this.isAnimating) {
        this.applyNextMove();
      }
    }, 100);
  }
  
  pauseAnimation() {
    this.isAnimating = false;
  }
  
  stopAnimation() {
    this.isAnimating = false;
    this.goToMove(-1);
  }
  
  updateAnimationSpeed(event) {
    this.animationSpeed = parseInt(event.target.value);
  }
}

// Wait for DOM to be ready before creating the controller
document.addEventListener('DOMContentLoaded', () => {
  // Create the animation controller
  window.animationController = new AnimationController();
});
