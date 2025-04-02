// Game Solver - Adapted from Python code
// This file contains heuristic solvers for the Fruit Box B game

// Global memoization table for DFS
let memo = {};

/**
 * Compute prefix sum matrix for a board
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @returns {Array<Array<number>>} - Prefix sum matrix
 */
function computePrefixSum(board) {
  const n = board.length;
  const m = board[0].length;
  const prefix = Array(n + 1).fill().map(() => Array(m + 1).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      prefix[i + 1][j + 1] = board[i][j] + prefix[i][j + 1] + prefix[i + 1][j] - prefix[i][j];
    }
  }
  
  return prefix;
}

/**
 * Compute prefix count matrix for non-zero entries
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @returns {Array<Array<number>>} - Prefix count matrix
 */
function computePrefixCount(board) {
  const n = board.length;
  const m = board[0].length;
  const prefix = Array(n + 1).fill().map(() => Array(m + 1).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      prefix[i + 1][j + 1] = (board[i][j] !== 0 ? 1 : 0) + prefix[i][j + 1] + prefix[i + 1][j] - prefix[i][j];
    }
  }
  
  return prefix;
}

/**
 * Get the sum for a rectangle defined by top-left and bottom-right corners
 * @param {Array<Array<number>>} prefix - Prefix sum matrix
 * @param {number} i - Top row index
 * @param {number} j - Left column index
 * @param {number} i2 - Bottom row index
 * @param {number} j2 - Right column index
 * @returns {number} - Sum of values in the rectangle
 */
function getRectSum(prefix, i, j, i2, j2) {
  return prefix[i2 + 1][j2 + 1] - prefix[i][j2 + 1] - prefix[i2 + 1][j] + prefix[i][j];
}

/**
 * Find all rectangular subarrays that sum to 10
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @returns {Array<Object>} - Array of valid moves with format {topLeft: [i,j], bottomRight: [i2,j2], points: number}
 */
function findValidMoves(board) {
  const moves = [];
  const n = board.length;
  const m = board[0].length;
  const prefixSum = computePrefixSum(board);
  const prefixCount = computePrefixCount(board);
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      for (let i2 = i; i2 < n; i2++) {
        for (let j2 = j; j2 < m; j2++) {
          const total = getRectSum(prefixSum, i, j, i2, j2);
          if (total === 10) {
            const points = getRectSum(prefixCount, i, j, i2, j2);
            if (points > 0) {
              moves.push({
                topLeft: [i, j],
                bottomRight: [i2, j2],
                points: points
              });
            }
          }
        }
      }
    }
  }
  
  return moves;
}

/**
 * Convert cell coordinates to cell objects format expected by game
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @param {Array} topLeft - [row, col] of top-left corner
 * @param {Array} bottomRight - [row, col] of bottom-right corner
 * @returns {Array<Object>} - Array of cell objects {row, col, value}
 */
function moveToCellsFormat(board, topLeft, bottomRight) {
  const cells = [];
  const [i, j] = topLeft;
  const [i2, j2] = bottomRight;
  
  for (let r = i; r <= i2; r++) {
    for (let c = j; c <= j2; c++) {
      if (board[r][c] !== 0) {
        cells.push({
          row: r,
          col: c,
          value: board[r][c]
        });
      }
    }
  }
  
  return cells;
}

/**
 * Create a string key for the board to use in memoization
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @returns {string} - String representation of the board
 */
function boardToKey(board) {
  return board.map(row => row.join(',')).join(';');
}

/**
 * Create a deep copy of a 2D array board
 * @param {Array<Array<number>>} board - 2D array to copy
 * @returns {Array<Array<number>>} - New copy of the board
 */
function copyBoard(board) {
  return board.map(row => [...row]);
}

/**
 * Recursive DFS that returns best score and move sequence for a given board
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @returns {Object} - {score: number, moves: Array} best score and moves
 */
function dfs(board) {
  const boardKey = boardToKey(board);
  
  if (memo[boardKey]) {
    return memo[boardKey];
  }
  
  const validMoves = findValidMoves(board);
  let bestScore = 0;
  let bestMoves = [];
  
  for (const move of validMoves) {
    const [i, j] = move.topLeft;
    const [i2, j2] = move.bottomRight;
    const points = move.points;
    
    // Create a new board with the move applied
    const newBoard = copyBoard(board);
    for (let r = i; r <= i2; r++) {
      for (let c = j; c <= j2; c++) {
        newBoard[r][c] = 0;
      }
    }
    
    // Recursive call
    const result = dfs(newBoard);
    const totalScore = points + result.score;
    
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMoves = [{ topLeft: [i, j], bottomRight: [i2, j2], points }].concat(result.moves);
    }
  }
  
  const result = { score: bestScore, moves: bestMoves };
  memo[boardKey] = result;
  return result;
}

/**
 * Solve optimally using DFS (suitable for small boards or windows)
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @returns {Object} - {score: number, moves: Array} best score and moves
 */
function solveWithDFS(board) {
  memo = {}; // Reset memoization
  return dfs(board);
}

/**
 * Analyze local windows to find move frequencies
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @param {number|Object} windowSize - Size of the sliding window or an object with {width, height}
 * @returns {Object} - Map of moves to their frequencies
 */
function localFrequencyAnalysis(board, windowSize = 5) {
  const freq = {};
  const n = board.length;
  const m = board[0].length;
  
  // Handle different window size formats
  let windowWidth, windowHeight;
  
  if (typeof windowSize === 'object' && windowSize.width && windowSize.height) {
    // If window size is specified as {width, height}
    windowWidth = windowSize.width;
    windowHeight = windowSize.height;
  } else {
    // If window size is a single number, use it for both dimensions
    windowWidth = windowHeight = windowSize;
  }
  
  // Make sure the window fits within the board
  const effectiveWidth = (m >= windowWidth) ? windowWidth : m;
  const effectiveHeight = (n >= windowHeight) ? windowHeight : n;
  
  for (let i = 0; i <= n - effectiveHeight; i++) {
    for (let j = 0; j <= m - effectiveWidth; j++) {
      // Extract the sub-board
      const subBoard = [];
      for (let r = i; r < i + effectiveHeight; r++) {
        const row = [];
        for (let c = j; c < j + effectiveWidth; c++) {
          row.push(board[r][c]);
        }
        subBoard.push(row);
      }
      
      // Run DFS on the sub-board
      const localSol = solveWithDFS(subBoard);
      
      for (const move of localSol.moves) {
        const [r1, c1] = move.topLeft;
        const [r2, c2] = move.bottomRight;
        
        // Convert local move coordinates to global board coordinates
        const globalMove = JSON.stringify({
          topLeft: [i + r1, j + c1],
          bottomRight: [i + r2, j + c2]
        });
        
        freq[globalMove] = (freq[globalMove] || 0) + 1;
      }
    }
  }
  
  return freq;
}

/**
 * Global solver using frequency analysis
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @param {number|Object} windowSize - Size of the sliding window or an object with {width, height}
 * @returns {Object} - Solution with score and moves
 */
function solveWithFrequencyAnalysis(board, windowSize = 5) {
  let score = 0;
  const moves = [];
  const currentBoard = copyBoard(board);
  
  while (true) {
    const validMoves = findValidMoves(currentBoard);
    if (validMoves.length === 0) {
      break;
    }
    
    // Analyze local windows to score moves
    const freq = localFrequencyAnalysis(currentBoard, windowSize);
    
    // Choose move with highest frequency
    let bestMove = null;
    let bestFreq = -1;
    
    for (const move of validMoves) {
      const moveKey = JSON.stringify({
        topLeft: move.topLeft,
        bottomRight: move.bottomRight
      });
      
      const f = freq[moveKey] || 0;
      
      if (f > bestFreq || (f === bestFreq && move.points > (bestMove ? bestMove.points : 0))) {
        bestMove = move;
        bestFreq = f;
      }
    }
    
    if (!bestMove) {
      break;
    }
    
    const [i, j] = bestMove.topLeft;
    const [i2, j2] = bestMove.bottomRight;
    
    score += bestMove.points;
    moves.push({
      topLeft: bestMove.topLeft,
      bottomRight: bestMove.bottomRight,
      points: bestMove.points,
      cells: moveToCellsFormat(currentBoard, bestMove.topLeft, bestMove.bottomRight)
    });
    
    // Update the board: zero out the selected subarray
    for (let r = i; r <= i2; r++) {
      for (let c = j; c <= j2; c++) {
        currentBoard[r][c] = 0;
      }
    }
  }
  
  return { score, moves, board: currentBoard };
}

/**
 * Simple greedy approach - select move with most/fewest points
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @returns {Object} - Solution with score and moves
 */
function solveGreedy(board, inverse = true) {
  let score = 0;
  const moves = [];
  const currentBoard = copyBoard(board);
  
  while (true) {
    const validMoves = findValidMoves(currentBoard);
    if (validMoves.length === 0) {
      break;
    }
    
    // Choose move with highest immediate points
    let bestMove = validMoves[0];
    for (let i = 1; i < validMoves.length; i++) {
      if (!inverse && validMoves[i].points > bestMove.points) {
        bestMove = validMoves[i];
      } else if (inverse && validMoves[i].points < bestMove.points) {
        bestMove = validMoves[i];
      }
    }
    
    const [i, j] = bestMove.topLeft;
    const [i2, j2] = bestMove.bottomRight;
    
    score += bestMove.points;
    moves.push({
      topLeft: bestMove.topLeft,
      bottomRight: bestMove.bottomRight,
      points: bestMove.points,
      cells: moveToCellsFormat(currentBoard, bestMove.topLeft, bestMove.bottomRight)
    });
    
    // Update the board: zero out the selected subarray
    for (let r = i; r <= i2; r++) {
      for (let c = j; c <= j2; c++) {
        currentBoard[r][c] = 0;
      }
    }
  }
  
  return { score, moves, board: currentBoard };
}

/**
 * Main solver function - choose which algorithm to use
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @param {string} method - 'dfs', 'frequency', or 'greedy'
 * @param {number|Object} windowSize - Size of the sliding window (for frequency method) or an object with {width, height}
 * @returns {Object} - Solution with score and moves
 */
function solvePuzzle(board, method = 'frequency', windowSize = 5) {
  const n = board.length;
  const m = board[0].length;
  
  if (method === 'dfs' && n <= 5 && m <= 5) {
    return solveWithDFS(board);
  } else if (method === 'frequency') {
    return solveWithFrequencyAnalysis(board, windowSize);
  } else {
    return solveGreedy(board);
  }
}

// Export solver functions
window.gameSolver = {
  solveGreedy,
  solveWithFrequencyAnalysis,
  solveWithDFS,
  solvePuzzle
};
