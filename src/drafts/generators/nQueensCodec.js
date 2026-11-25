const cellVar = (r, c) => `x_${r}_${c}`

/**
 * Generates .eproto code for the N-Queens problem with optional pre-placed queens.
 *
 * @param {number} boardSize - Board dimension N (N >= 1)
 * @param {Array<{ r: number, c: number }>} pinnedQueens - Fixed queen positions
 * @returns {string} Generated E0 code
 */
export function generateNQueensCode(boardSize, pinnedQueens = []) {
  const n = Math.max(1, Math.floor(Number(boardSize) || 8))
  const intSize = Math.max(2, n.toString(2).length + 1)

  let code = `// ${n}-Queens Puzzle (${n}x${n} board)\n\n`
  code += `size + ${intSize} 0\n\n`

  if (pinnedQueens.length > 0) {
    code += '// Pinned queens\n'
    for (const { r, c } of pinnedQueens) {
      if (r >= 0 && r < n && c >= 0 && c < n) {
        code += `${cellVar(r, c)} == true\n`
      }
    }
    code += '\n'
  }

  code += '// Row constraints (exactly 1 queen per row)\n'
  for (let r = 0; r < n; r++) {
    const rowVars = []
    for (let c = 0; c < n; c++) {
      rowVars.push(cellVar(r, c))
    }
    code += `1 += ${rowVars.join(' ')}\n`
  }

  code += '\n// Column constraints (exactly 1 queen per column)\n'
  for (let c = 0; c < n; c++) {
    const colVars = []
    for (let r = 0; r < n; r++) {
      colVars.push(cellVar(r, c))
    }
    code += `1 += ${colVars.join(' ')}\n`
  }

  let diagIdx = 1

  code += '\n// Diagonal constraints (top-left to bottom-right)\n'
  // Start from bottom-left (r = n-2, c = 0) up to (0, 0), then across top row (0, 1) to (0, n-2)
  const mainStarts = []
  for (let r = n - 2; r >= 0; r--) mainStarts.push([r, 0])
  for (let c = 1; c <= n - 2; c++) mainStarts.push([0, c])

  for (const [startR, startC] of mainStarts) {
    const diagVars = []
    let r = startR
    let c = startC
    while (r < n && c < n) {
      diagVars.push(cellVar(r, c))
      r++
      c++
    }
    if (diagVars.length >= 2) {
      const vName = `d${diagIdx++}`
      code += `${vName} <= 1; ${vName} += ${diagVars.join(' ')}\n`
    }
  }

  code += '\n// Anti-diagonal constraints (top-right to bottom-left)\n'
  // Start from bottom-right (r = n-2, c = n-1) up to (0, n-1), then across top row (0, n-2) down to (0, 1)
  const antiStarts = []
  for (let r = n - 2; r >= 0; r--) antiStarts.push([r, n - 1])
  for (let c = n - 2; c >= 1; c--) antiStarts.push([0, c])

  for (const [startR, startC] of antiStarts) {
    const diagVars = []
    let r = startR
    let c = startC
    while (r < n && c >= 0) {
      diagVars.push(cellVar(r, c))
      r++
      c--
    }
    if (diagVars.length >= 2) {
      const vName = `d${diagIdx++}`
      code += `${vName} <= 1; ${vName} += ${diagVars.join(' ')}\n`
    }
  }

  return code
}

/**
 * Decodes solver variables into an NxN boolean matrix of queen placements.
 *
 * @param {number} boardSize
 * @param {Record<string, any> | false} inputVarsResults
 * @returns {{ size: number, queens: Array<{ r: number, c: number }> } | null}
 */
export function decodeNQueensSolution(boardSize, inputVarsResults) {
  if (!inputVarsResults || inputVarsResults === false) {
    return null
  }

  const queens = []
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const raw = inputVarsResults[cellVar(r, c)]
      if (raw === true || raw === 'true' || raw === 1 || raw === '1') {
        queens.push({ r, c })
      }
    }
  }

  return {
    size: boardSize,
    queens
  }
}
