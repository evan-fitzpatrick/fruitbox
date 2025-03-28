document.addEventListener('DOMContentLoaded', () => {
  // Game elements
  const gameGrid = document.getElementById('game-grid');
  const scoreElement = document.getElementById('score');
  const sumElement = document.getElementById('sum');
  const resetButton = document.getElementById('reset-btn');
  const selectionBox = document.getElementById('selection-box');
  const gameContainer = document.getElementById('game-container');

  // Game state
  let grid = [];
  let score = 0;
  let isSelecting = false;
  let startCell = null;
  let currentCell = null;
  let selectedCells = [];

  // Prevent default browser selection behavior
  gameContainer.addEventListener('selectstart', (e) => e.preventDefault());

  // Selection coordinates
  let startX, startY, currentX, currentY;

  // Initialize the game
  initGame();

  // Calculate and set cell size based on screen dimensions
  function setCellSize() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Calculate available space (adjust these values based on your layout)
    const availableWidth = Math.min(screenWidth - 80, 1200);
    const availableHeight = screenHeight - 240;

    // For a 17x10 grid, there are 16 gaps horizontally and 9 gaps vertically (each gap = 4px)
    const cellWidthBased = Math.floor((availableWidth - (16 * 4)) / 17);
    const cellHeightBased = Math.floor((availableHeight - (9 * 4)) / 10);

    // Use the smaller cell size to ensure the grid fits both dimensions
    const cellSize = Math.max(Math.min(cellWidthBased, cellHeightBased), 25); // Minimum size of 25px

    // Set the CSS variable so that CSS uses the dynamic cell size
    document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);

    console.log(`Cell size set to ${cellSize}px based on screen size: ${screenWidth}x${screenHeight}`);

    // Update game container dimensions to exactly wrap the grid
    const containerWidth = (cellSize * 17) + (4 * 16);
    const containerHeight = (cellSize * 10) + (4 * 9);
    gameContainer.style.width = `${containerWidth}px`;
    gameContainer.style.height = `${containerHeight}px`;
  }

  // Call setCellSize initially and on window resize
  setCellSize();
  window.addEventListener('resize', () => {
    setCellSize();
    renderGrid(); // Re-render grid after resize
  });

  // Event listeners
  resetButton.addEventListener('click', initGame);

  gameContainer.addEventListener('mousedown', startSelection);
  gameContainer.addEventListener('mousemove', updateSelection);
  gameContainer.addEventListener('mouseup', endSelection);
  gameContainer.addEventListener('mouseleave', endSelection);

  // Add touch support
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

  // Functions
  function initGame() {
    score = 0;
    scoreElement.textContent = score;
    sumElement.textContent = '0';

    // Fetch grid from backend
    fetch('/generate-grid')
      .then((response) => response.json())
      .then((data) => {
        grid = data.grid;
        console.log('Grid loaded:', grid);
        renderGrid();
      })
      .catch((error) => {
        console.error('Error loading grid:', error);
      });
  }

  function renderGrid() {
    gameGrid.innerHTML = '';

    // Create a grid of cells, including empty placeholders
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const cell = document.createElement('div');
        cell.dataset.row = row;
        cell.dataset.col = col;

        // Position the cell in the grid
        cell.style.gridRow = row + 1;
        cell.style.gridColumn = col + 1;

        if (grid[row][col] === 0) {
          // Empty cell - just a placeholder
          cell.className = 'grid-cell empty';
        } else {
          // Cell with a value
          cell.className = 'grid-cell';
          cell.dataset.value = grid[row][col];

          const img = document.createElement('img');
          img.src = '/static/images/icon.png';
          img.alt = 'Icon';
          img.draggable = false; // Prevent dragging of icons

          const number = document.createElement('div');
          number.className = 'number';
          number.textContent = grid[row][col];

          cell.appendChild(img);
          cell.appendChild(number);
        }

        gameGrid.appendChild(cell);
      }
    }

    console.log(
      'Grid rendered with active cells:',
      document.querySelectorAll('.grid-cell:not(.empty)').length
    );
    console.log(
      'Total cells (including empty):',
      document.querySelectorAll('.grid-cell').length
    );
  }

  function startSelection(event) {
    // Check if the click is within the game container
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

      // Clear previous selection
      clearSelection();
    }
  }

  function updateSelection(event) {
    if (!isSelecting) return;
    event.preventDefault();

    const rect = gameContainer.getBoundingClientRect();
    currentX = event.clientX - rect.left;
    currentY = event.clientY - rect.top;

    // Calculate selection box dimensions
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    // Update selection box position and size
    selectionBox.style.left = Math.min(startX, currentX) + 'px';
    selectionBox.style.top = Math.min(startY, currentY) + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';

    // Update selected cells
    updateSelectedCells();
  }

  function updateSelectedCells() {
    // Clear previous selection
    clearSelection();

    const minX = Math.min(startX, currentX);
    const maxX = Math.max(startX, currentX);
    const minY = Math.min(startY, currentY);
    const maxY = Math.max(startY, currentY);

    // Find cells within the selection (only non-empty cells)
    const cells = document.querySelectorAll('.grid-cell:not(.empty)');
    selectedCells = [];

    cells.forEach((cell) => {
      const rect = cell.getBoundingClientRect();
      const gameContainerRect = gameContainer.getBoundingClientRect();

      const cellCenterX = rect.left + rect.width / 2 - gameContainerRect.left;
      const cellCenterY = rect.top + rect.height / 2 - gameContainerRect.top;

      if (
        cellCenterX >= minX &&
        cellCenterX <= maxX &&
        cellCenterY >= minY &&
        cellCenterY <= maxY
      ) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const value = parseInt(cell.dataset.value);

        cell.classList.add('selected');
        selectedCells.push({ row, col, value });
      }
    });

    // Calculate sum of selected cells
    const sum = selectedCells.reduce((total, cell) => total + cell.value, 0);
    sumElement.textContent = sum.toString();

    console.log('Selected cells:', selectedCells.length, 'Sum:', sum);
  }

  function clearSelection() {
    document.querySelectorAll('.grid-cell.selected').forEach((cell) => {
      cell.classList.remove('selected');
    });
    selectedCells = [];
    sumElement.textContent = '0';
  }

  function endSelection(event) {
    if (!isSelecting) return;
    if (event) {
      event.preventDefault();
    }
    isSelecting = false;
    selectionBox.classList.add('hidden');

    // Check if sum is 10
    const sum = selectedCells.reduce((total, cell) => total + cell.value, 0);
    console.log('Sum:', sum, 'Selected cells:', selectedCells.length);

    if (sum === 10 && selectedCells.length > 0) {
      console.log('Match found! Removing cells and updating score.');
      // Remove selected cells
      selectedCells.forEach((cell) => {
        grid[cell.row][cell.col] = 0;
      });
      // Update score
      score += selectedCells.length;
      scoreElement.textContent = score.toString();
      // Render the updated grid
      renderGrid();
    } else {
      console.log('No match found or no cells selected.');
    }
    clearSelection();
  }
});
