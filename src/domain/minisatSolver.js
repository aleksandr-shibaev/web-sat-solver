import { clausesToDimacs, parseDimacsSolution } from './dimacsCodec.js'

let createMinisatFactory = null

function resolvePublicAsset(relativePath, baseUrl) {
  const normalizedBase =
    baseUrl.endsWith('/') || baseUrl.endsWith('.html') ? baseUrl : `${baseUrl}/`
  return new URL(relativePath, normalizedBase).href
}

export async function createRawMinisatRunner(baseUrl) {
  if (!createMinisatFactory) {
    const minisatJsUrl = resolvePublicAsset('libs/minisat.js', baseUrl)
    const module = await import(/* @vite-ignore */ minisatJsUrl)
    createMinisatFactory = module.default || module.Module || module
  }

  const minisat = await createMinisatFactory({
    noInitialRun: true,
    stdin: () => null,
    print: () => {},
    printErr: () => {},
    locateFile: (fileName) => resolvePublicAsset(`libs/${fileName}`, baseUrl)
  })

  return (dimacsText) => {
    minisat.FS.writeFile('/in.cnf', dimacsText)

    try {
      minisat.callMain(['-verb=0', '/in.cnf', '/out.txt'])
    } catch (err) {
      if (err?.name !== 'ExitStatus') {
        throw err
      }
    }

    const rawOutput = minisat.FS.readFile('/out.txt', { encoding: 'utf8' })

    try {
      minisat.FS.unlink('/in.cnf')
      minisat.FS.unlink('/out.txt')
    } catch {
      // ignore cleanup errors
    }

    return rawOutput
  }
}

export async function createMinisatSolver(baseUrl) {
  const runRawDimacs = await createRawMinisatRunner(baseUrl)

  return (clauses) => {
    if (!clauses?.length) return {}

    const { dimacs, varMap } = clausesToDimacs(clauses)
    const rawOutput = runRawDimacs(dimacs)
    return parseDimacsSolution(rawOutput, varMap)
  }
}
