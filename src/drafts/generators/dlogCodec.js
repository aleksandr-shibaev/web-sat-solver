function calcUpperBound(m) {
  let r = 2n
  while (r < m) {
    r *= 2n
  }
  return r
}

/**
 * Generates .eproto code for the Discrete Logarithm problem: a^x = b (mod m)
 * using binary exponentiation over bits of x.
 *
 * @param {string | number | bigint} rawA - Base a
 * @param {string | number | bigint} rawB - Target b
 * @param {string | number | bigint} rawM - Modulus m (m >= 2)
 * @returns {string} Generated E0 code
 */
export function generateDLogCode(rawA, rawB, rawM) {
  const m = BigInt(rawM)
  if (m < 2n) {
    throw new Error('Modulus m must be an integer >= 2.')
  }

  const a = ((BigInt(rawA) % m) + m) % m
  const b = ((BigInt(rawB) % m) + m) % m

  const steps = m.toString(2).length
  const intSize = 2 * steps
  const upperBound = calcUpperBound(m)

  let code = `// Discrete Logarithm: ${a}^x = ${b} (mod ${m})\n\n`
  code += `size + ${intSize} 0\n`
  code += `x >= 0\n`
  code += `x < ${upperBound}\n\n`

  if (steps === 1) {
    code += `x:0 ? ${a} : 1 = ${b}\n`
    return code
  }

  code += `x:0 ? ${a} : 1 = v1\n`

  let v = a
  for (let i = 1; i < steps - 1; i++) {
    v = (v * v) % m
    code += `x:${i} ? (v${i} * ${v} % ${m}) : v${i} = v${i + 1}\n`
  }

  v = (v * v) % m
  code += `x:${steps - 1} ? (v${steps - 1} * ${v} % ${m}) : v${steps - 1} = ${b}\n`

  return code
}

/**
 * Decodes solver output for Discrete Logarithm
 *
 * @param {Record<string, any> | false} inputVarsResults
 * @returns {{ x: string } | null}
 */
export function decodeDLogSolution(inputVarsResults) {
  if (!inputVarsResults || inputVarsResults === false) {
    return null
  }

  if (inputVarsResults.x === undefined || inputVarsResults.x === null) {
    return null
  }

  return {
    x: String(inputVarsResults.x)
  }
}
