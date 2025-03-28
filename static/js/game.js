document.addEventListener('DOMContentLoaded', () => {
  // Game elements
  const gameGrid = document.getElementById('game-grid');
  const scoreElement = document.getElementById('score');
  const resetButton = document.getElementById('reset-btn');
  const selectionBox = document.getElementById('selection-box');
  const gameContainer = document.getElementById('game-container');
  const darkModeToggle = document.getElementById('dark-mode-toggle');

  // Game state
  let grid = [];
  let score = 0;
  let isSelecting = false;
  let selectedCells = [];
  let debugMode = false;

  // Prevent default browser selection behavior
  gameContainer.addEventListener('selectstart', (e) => e.preventDefault());

  let startX, startY, currentX, currentY;

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
    renderGrid();
  });

  resetButton.addEventListener('click', initGame);
  darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    darkModeToggle.textContent = document.body.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
  });

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

  document.getElementById('debug-toggle').addEventListener('click', toggleDebugMode);
  document.getElementById('save-btn').addEventListener('click', saveGameState);
  document.getElementById('load-btn').addEventListener('click', () => {
    document.getElementById('load-file').click();
  });
  document.getElementById('load-file').addEventListener('change', loadGameState);

  function initGame() {
    score = 0;
    scoreElement.textContent = score;
    // Removed sumElement update since the Current Sum section has been removed.

    fetch('/generate-grid')
      .then((response) => response.json())
      .then((data) => {
        grid = data.grid;
        renderGrid();
      })
      .catch((error) => {
        console.error('Error loading grid:', error);
      });
  }

  function renderGrid() {
    gameGrid.innerHTML = '';
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const cell = document.createElement('div');
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.style.gridRow = row + 1;
        cell.style.gridColumn = col + 1;
        if (grid[row][col] === 0) {
          cell.className = 'grid-cell empty';
        } else {
          cell.className = 'grid-cell';
          cell.dataset.value = grid[row][col];
          const img = document.createElement('img');
          img.src = '/static/images/icon.png';
          img.alt = 'Icon';
          img.draggable = false;
          const number = document.createElement('div');
          number.className = 'number';
          number.textContent = grid[row][col];
          cell.appendChild(img);
          cell.appendChild(number);
        }
        gameGrid.appendChild(cell);
      }
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
    updateSelectedCells();
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
    // Removed updating the Current Sum UI element.
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
    const sum = selectedCells.reduce((total, cell) => total + cell.value, 0);
    if (sum === 10 && selectedCells.length > 0) {
      selectedCells.forEach((cell) => {
        grid[cell.row][cell.col] = 0;
      });
      score += selectedCells.length;
      scoreElement.textContent = score.toString();
      renderGrid();
    }
    clearSelection();
  }

  function toggleDebugMode() {
    debugMode = !debugMode;
    const debugPanel = document.getElementById('debug-panel');
    if (debugMode) {
      debugPanel.classList.remove('hidden');
      document.getElementById('debug-toggle').textContent = 'Hide Debug Tools';
    } else {
      debugPanel.classList.add('hidden');
      document.getElementById('debug-toggle').textContent = 'Show Debug Tools';
    }
  }

  function saveGameState() {
    let csvContent = '';
    for (let row = 0; row < grid.length; row++) {
      csvContent += grid[row].join(',') + '\n';
    }
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
      const rows = csvContent.split('\n').filter(row => row.trim().length > 0);
      const newGrid = [];
      for (let row of rows) {
        const values = row.split(',').map(val => parseInt(val.trim(), 10));
        if (values.length === 17) {
          newGrid.push(values);
        }
      }
      if (newGrid.length === 10) {
        grid = newGrid;
        renderGrid();
      } else {
        alert('Invalid grid dimensions in CSV file. Expected 10 rows x 17 columns.');
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  }
});
