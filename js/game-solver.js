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
 * Solve using a Maximum Options heuristic
 * Selects moves that result in the most future valid moves
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @returns {Object} - Solution with score and moves
 */
function solveMaxOptions(board) {
  let score = 0;
  const moves = [];
  const currentBoard = copyBoard(board);
  
  while (true) {
    const validMoves = findValidMoves(currentBoard);
    if (validMoves.length === 0) {
      break;
    }
    
    // Score each move by how many options it leaves open
    let bestMove = null;
    let maxFutureMoves = -1;
    
    for (const move of validMoves) {
      const [i, j] = move.topLeft;
      const [i2, j2] = move.bottomRight;
      
      // Create a new board with the move applied
      const newBoard = copyBoard(currentBoard);
      for (let r = i; r <= i2; r++) {
        for (let c = j; c <= j2; c++) {
          newBoard[r][c] = 0;
        }
      }
      
      // Count how many valid moves would be available after this move
      const futureValidMoves = findValidMoves(newBoard);
      const numFutureMoves = futureValidMoves.length;
      
      // Select move with most future options
      // If tied, prefer moves with fewer points (smaller rectangles)
      if (numFutureMoves > maxFutureMoves || 
          (numFutureMoves === maxFutureMoves && move.points < bestMove.points)) {
        maxFutureMoves = numFutureMoves;
        bestMove = move;
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
 * Calculate potential value for each fruit on the board
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @returns {Array<Array<number>>} - 2D array with potential values
 */
function calculatePotentialValues(board) {
  const n = board.length;
  const m = board[0].length;
  const potentialValues = Array(n).fill().map(() => Array(m).fill(0));
  
  // For each fruit, calculate its potential value
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (board[i][j] === 0) continue; // Skip empty cells
      
      let potentialValue = 0;
      
      // Examine all other fruits on the board
      for (let i2 = 0; i2 < n; i2++) {
        for (let j2 = 0; j2 < m; j2++) {
          if (i === i2 && j === j2) continue; // Skip self
          if (board[i2][j2] === 0) continue; // Skip empty cells
          
          const value1 = board[i][j];
          const value2 = board[i2][j2];
          const sum = value1 + value2;
          
          // Calculate g(f_i, f_j)
          let g = 0;
          if (sum === 10) g = 2;
          else if (sum < 10) g = 1;
          
          // Calculate N(f_i, f_j) - the number of fruits between i and j
          const minRow = Math.min(i, i2);
          const maxRow = Math.max(i, i2);
          const minCol = Math.min(j, j2);
          const maxCol = Math.max(j, j2);
          
          let fruitsInBetween = 0;
          
          // Count fruits in the rectangle between the two fruits
          for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
              if (board[r][c] !== 0 && !(r === i && c === j) && !(r === i2 && c === j2)) {
                fruitsInBetween++;
              }
            }
          }
          
          // Avoid division by zero by adding 1 to the denominator
          const N = fruitsInBetween + 1;
          
          // Add to the potential value
          potentialValue += g / N;
        }
      }
      
      potentialValues[i][j] = potentialValue;
    }
  }
  
  return potentialValues;
}

/**
 * Calculate the total potential value lost by making a move
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @param {Array<Array<number>>} potentialValues - 2D array with potential values
 * @param {Object} move - The move to evaluate
 * @returns {number} - The total potential value lost
 */
function calculatePotentialLost(board, potentialValues, move) {
  const [i, j] = move.topLeft;
  const [i2, j2] = move.bottomRight;
  let totalLost = 0;
  
  // Sum the potential values of all fruits in the move
  for (let r = i; r <= i2; r++) {
    for (let c = j; c <= j2; c++) {
      if (board[r][c] !== 0) {
        totalLost += potentialValues[r][c];
      }
    }
  }
  
  return totalLost;
}

/**
 * Solve using minimum potential value loss heuristic
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @returns {Object} - Solution with score and moves
 */
function solveWithMinPotentialLoss(board) {
  let score = 0;
  const moves = [];
  const currentBoard = copyBoard(board);
  
  while (true) {
    const validMoves = findValidMoves(currentBoard);
    if (validMoves.length === 0) {
      break;
    }
    
    // Calculate potential values for all fruits
    const potentialValues = calculatePotentialValues(currentBoard);
    
    // Score each move by how much potential value it removes
    let bestMove = null;
    let minPotentialLoss = Infinity;
    
    for (const move of validMoves) {
      const potentialLoss = calculatePotentialLost(currentBoard, potentialValues, move);
      
      // Normalize by the number of points to prefer moves that remove
      // less potential per fruit removed
      const normalizedLoss = potentialLoss / move.points;
      
      if (normalizedLoss < minPotentialLoss) {
        minPotentialLoss = normalizedLoss;
        bestMove = move;
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
  } else if (method === 'maxoptions') {
    return solveWithMaxOptions(board);
  } else if (method === 'minpotentialloss') {
    return solveWithMinPotentialLoss(board);
  } else {
    return solveGreedy(board);
  }
}


// Export solver functions
window.gameSolver = {
  solveGreedy,
  solveWithFrequencyAnalysis,
  solveWithDFS,
  solveMaxOptions,
  solveWithMinPotentialLoss,
  solvePuzzle
};
