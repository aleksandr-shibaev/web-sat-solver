<script setup>
import { ref } from 'vue'
import { createRawMinisatRunner } from '../domain/minisatSolver.js'
import DimacsSolverNotes from './DimacsSolverNotes.vue'

const DEFAULT_DIMACS = `p cnf 3 3
1 -2 3 0
-1 2 0
2 3 0`

const dimacsInput = ref(DEFAULT_DIMACS)
const solverOutput = ref('')
const isSolving = ref(false)
const solveDuration = ref(null)
const errorMsg = ref('')
const copied = ref(false)

async function handleSolve() {
  errorMsg.value = ''
  solverOutput.value = ''
  solveDuration.value = null

  const trimmed = dimacsInput.value.trim()
  if (!trimmed) {
    errorMsg.value = 'Enter a DIMACS CNF formula first.'
    return
  }

  isSolving.value = true
  try {
    const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin).href
    const runMiniSat = await createRawMinisatRunner(baseUrl)
    const t0 = performance.now()
    const rawResult = runMiniSat(trimmed)
    const t1 = performance.now()

    solveDuration.value = Math.round(t1 - t0)
    solverOutput.value = rawResult.trim()
  } catch (err) {
    errorMsg.value = err?.message || 'MiniSat execution failed'
  } finally {
    isSolving.value = false
  }
}

function handleFileUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    dimacsInput.value = String(reader.result || '')
    solverOutput.value = ''
    errorMsg.value = ''
    solveDuration.value = null
  }
  reader.readAsText(file)
  event.target.value = ''
}

/*
function loadExample() {
  dimacsInput.value = DEFAULT_DIMACS
  solverOutput.value = ''
  errorMsg.value = ''
  solveDuration.value = null
}
*/

async function copyOutput() {
  if (!solverOutput.value) return
  try {
    await navigator.clipboard.writeText(solverOutput.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    // ignore clipboard errors
  }
}
</script>

<template>
  <div class="dimacs-draft">
    <p class="draft-description">
      Solve boolean satisfiability problems in standard DIMACS CNF format directly in your browser
      with MiniSat.
    </p>

    <div class="editor-box">
      <div class="box-header">
        <span>DIMACS CNF Input</span>
        <div class="header-actions">
          <label class="mini-btn file-label">
            Load .cnf File
            <input type="file" accept=".cnf,.dimacs,.txt" hidden @change="handleFileUpload" />
          </label>
          <!-- <button type="button" class="mini-btn" @click="loadExample">Reset Example</button> -->
        </div>
      </div>

      <textarea
        v-model="dimacsInput"
        class="dimacs-textarea"
        placeholder="p cnf 3 2&#10;1 -2 0&#10;2 3 0"
        spellcheck="false"
      ></textarea>
    </div>

    <div class="run-bar">
      <button type="button" class="solve-btn" :disabled="isSolving" @click="handleSolve">
        {{ isSolving ? 'Solving...' : 'Solve DIMACS' }}
      </button>
    </div>

    <div v-if="errorMsg" class="error-banner">
      {{ errorMsg }}
    </div>

    <div v-if="solverOutput" class="output-box">
      <div class="box-header">
        <div class="output-title-group">
          <span>MiniSat Standard Output</span>
          <span v-if="solveDuration !== null" class="time-badge">{{ solveDuration }} ms</span>
        </div>
        <button type="button" class="mini-btn" @click="copyOutput">
          {{ copied ? 'Copied!' : 'Copy Output' }}
        </button>
      </div>

      <pre class="output-pre">{{ solverOutput }}</pre>
    </div>
    <DimacsSolverNotes />
  </div>
</template>

<style scoped>
.dimacs-draft {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.draft-description {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--text-secondary);
}

.draft-description strong {
  color: var(--text-main);
}

.editor-box,
.output-box {
  border: 1px solid var(--border-color);
  background-color: var(--bg-editor);
  display: flex;
  flex-direction: column;
}

.box-header {
  min-height: 38px;
  padding: 4px 12px;
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.header-actions,
.output-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-badge {
  padding: 2px 7px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--accent-primary);
  background-color: var(--bg-editor);
  border: 1px solid var(--border-color);
}

.mini-btn {
  padding: 4px 10px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-main);
  background-color: var(--bg-editor);
  border: 1px solid var(--border-color);
  cursor: pointer;
}

.mini-btn:hover {
  border-color: var(--border-strong);
  background-color: var(--bg-secondary);
}

.file-label {
  display: inline-flex;
  align-items: center;
}

.dimacs-textarea {
  width: 100%;
  min-height: 220px;
  padding: 12px 14px;
  border: none;
  outline: none;
  resize: vertical;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--text-main);
  background-color: var(--bg-editor);
  box-sizing: border-box;
}

.run-bar {
  display: flex;
  align-items: center;
}

.solve-btn {
  padding: 8px 20px;
  font-family: var(--font-sans);
  font-size: 0.88rem;
  font-weight: 700;
  color: #ffffff;
  background-color: var(--accent-primary);
  border: none;
  cursor: pointer;
}

.solve-btn:hover:not(:disabled) {
  background-color: var(--accent-hover);
}

.solve-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-banner {
  padding: 12px 14px;
  font-family: var(--font-mono);
  font-size: 0.83rem;
  color: var(--status-error);
  background-color: #fef2f2;
  border: 1px solid #fecaca;
}

.output-pre {
  margin: 0;
  padding: 14px;
  max-height: 280px;
  overflow: auto;
  font-family: var(--font-mono);
  font-size: 0.84rem;
  line-height: 1.55;
  color: var(--text-main);
  background-color: var(--bg-editor);
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
