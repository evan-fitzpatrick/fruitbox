document.addEventListener('DOMContentLoaded', () => {
  // Game elements
  const gameGrid = document.getElementById('game-grid');
  const scoreElement = document.getElementById('score');
  const resetButton = document.getElementById('reset-btn');
  const selectionBox = document.getElementById('selection-box');
  const gameContainer = document.getElementById('game-container');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const advancedToggle = document.getElementById('debug-toggle');
  const saveButton = document.getElementById('save-btn');
  const loadButton = document.getElementById('load-btn');
  const fileInput = document.getElementById('load-file');

  // Initialize the game state
  const gameState = window.gameState.init(gameGrid, scoreElement);
  
  // Selection state
  let isSelecting = false;
  let selectedCells = [];
  let advancedMode = false;
  let startX, startY, currentX, currentY;

  // Prevent default browser selection behavior
  gameContainer.addEventListener('selectstart', (e) => e.preventDefault());

  // Initialize the game
  initGame();
  
  function setCellSize() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const availableWidth = Math.min(screenWidth - 80, 1200);
    const availableHeight = screenHeight - 240;
    const cellWidthBased = Math.floor((availableWidth - (16 * 4)) / 17);
    const cellHeightBased = Math.floor((availableHeight - (9 * 4)) / 10);
    const cellSize = Math.max(Math.min(cellWidthBased, cellHeightBased), 25);
    document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
    const containerWidth = (cellSize * 17) + (4 * 16);
    const containerHeight = (cellSize * 10) + (4 * 9);
    gameContainer.style.width = `${containerWidth}px`;
    gameContainer.style.height = `${containerHeight}px`;
  }

  setCellSize();
  window.addEventListener('resize', () => {
    setCellSize();
    gameState.renderGrid();
  });

  // Event Listeners
  resetButton.addEventListener('click', initGame);
  darkModeToggle.addEventListener('click', toggleDarkMode);
  advancedToggle.addEventListener('click', toggleAdvancedMode);
  saveButton.addEventListener('click', saveGameState);
  loadButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', loadGameState);

  // Touch and mouse event handling
  gameContainer.addEventListener('mousedown', startSelection);
  gameContainer.addEventListener('mousemove', updateSelection);
  gameContainer.addEventListener('mouseup', endSelection);
  gameContainer.addEventListener('mouseleave', endSelection);

  gameContainer.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    startSelection(mouseEvent);
    e.preventDefault();
  });

  gameContainer.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    updateSelection(mouseEvent);
    e.preventDefault();
  });

  gameContainer.addEventListener('touchend', (e) => {
    endSelection();
    e.preventDefault();
  });

  // Game functions
  function initGame() {
    fetch('/generate-grid')
      .then((response) => response.json())
      .then((data) => {
        gameState.setGrid(data.grid, true);
      })
      .catch((error) => {
        console.error('Error loading grid:', error);
      });
  }

  function toggleDarkMode() {
    document.body.classList.toggle('dark');
    darkModeToggle.textContent = document.body.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
  }

  function toggleAdvancedMode() {
    advancedMode = !advancedMode;
    const debugPanel = document.getElementById('debug-panel');
    if (advancedMode) {
      debugPanel.classList.remove('hidden');
      advancedToggle.textContent = 'Hide Advanced Tools';
    } else {
      debugPanel.classList.add('hidden');
      advancedToggle.textContent = 'Show Advanced Tools';
    }
  }

  function startSelection(event) {
    if (event.target === gameContainer || event.target.closest('#game-grid')) {
      event.preventDefault();
      isSelecting = true;
      const rect = gameContainer.getBoundingClientRect();
      startX = event.clientX - rect.left;
      startY = event.clientY - rect.top;
      selectionBox.style.left = startX + 'px';
      selectionBox.style.top = startY + 'px';
      selectionBox.style.width = '0px';
      selectionBox.style.height = '0px';
      selectionBox.classList.remove('hidden');
      clearSelection();
    }
  }

  function updateSelection(event) {
    if (!isSelecting) return;
    event.preventDefault();
    const rect = gameContainer.getBoundingClientRect();
    currentX = event.clientX - rect.left;
    currentY = event.clientY - rect.top;
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    selectionBox.style.left = Math.min(startX, currentX) + 'px';
    selectionBox.style.top = Math.min(startY, currentY) + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
    
    // Only update the selected cells if the selection box has changed significantly
    // This prevents flickering during small mouse movements
    const minChange = 2; // pixels
    if (Math.abs(event.movementX) > minChange || Math.abs(event.movementY) > minChange) {
      updateSelectedCells();
    }
  }

  function updateSelectedCells() {
    clearSelection();
    const minX = Math.min(startX, currentX);
    const maxX = Math.max(startX, currentX);
    const minY = Math.min(startY, currentY);
    const maxY = Math.max(startY, currentY);
    const cells = document.querySelectorAll('.grid-cell:not(.empty)');
    selectedCells = [];
    cells.forEach((cell) => {
      const rect = cell.getBoundingClientRect();
      const gameContainerRect = gameContainer.getBoundingClientRect();
      const cellCenterX = rect.left + rect.width / 2 - gameContainerRect.left;
      const cellCenterY = rect.top + rect.height / 2 - gameContainerRect.top;
      if (cellCenterX >= minX && cellCenterX <= maxX && cellCenterY >= minY && cellCenterY <= maxY) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const value = parseInt(cell.dataset.value);
        cell.classList.add('selected');
        selectedCells.push({ row, col, value });
      }
    });
    console.log('Selected cells:', selectedCells.length, 'Sum:', selectedCells.reduce((total, cell) => total + cell.value, 0));
  }

  function clearSelection() {
    document.querySelectorAll('.grid-cell.selected').forEach((cell) => {
      cell.classList.remove('selected');
    });
    selectedCells = [];
  }

  function endSelection(event) {
    if (!isSelecting) return;
    if (event) event.preventDefault();
    isSelecting = false;
    selectionBox.classList.add('hidden');
    
    if (selectedCells.length > 0) {
      const sum = selectedCells.reduce((total, cell) => total + cell.value, 0);
      if (sum === 10) {
        // Apply the move using the game state
        gameState.applyMove({ cells: selectedCells }, true);
      }
    }
    
    clearSelection();
  }

  // Save and load
  function saveGameState() {
    const csvContent = gameState.saveToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `game-state-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function loadGameState(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const csvContent = e.target.result;
      const success = gameState.loadFromCSV(csvContent);
      
      if (!success) {
        alert('Invalid file format or dimensions.');
      }
      
      event.target.value = '';
    };
    reader.readAsText(file);
  }
});
