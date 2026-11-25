<script setup>
import { ref, computed } from 'vue'
import ValueFromSetNotes from './ValueFromSetNotes.vue'

const emit = defineEmits(['copy-code'])

const PENALTY_01 = 0
const PENALTY_NX = 3
const PENALTY_XX = 4

const PRESETS = Array.of(
  {
    label: 'Fibonacci (target penalty = 32)',
    values: '2 3 5 8 13 21 34 55',
    targetPenalty: 32,
    exact: true
  },
  {
    label: 'Fibonacci 10 (penalty <= 51)',
    values: '2 3 5 8 13 21 34 55 89 144',
    targetPenalty: 51
  },
  {
    label: 'Fibo + Squares 14 (penalty <= 65)',
    values: '2 3 5 8 13 21 34 55 89 144 9 16 25 36',
    targetPenalty: 65
  },
  {
    label: 'Fibo + Squares 19 (penalty <= 88)',
    values: '2 3 5 8 13 21 34 55 89 144 9 16 25 36 49 64 81 100 121',
    targetPenalty: 88
  },
  {
    label: 'Catalan Numbers (penalty <= 126)',
    values: '1 2 5 14 42 132 429 1430 4862 16796 58786 208012',
    targetPenalty: 126
  },
  {
    label: 'Primes 131..251 (penalty <= 95)',
    values:
      '131 137 139 149 151 157 163 167 173 179 181 191 193 197 199 211 223 227 229 233 239 241 251',
    targetPenalty: 95
  },
  {
    label: 'Powers of 2 (penalty <= 97)',
    values: '1 2 4 8 16 32 64 128 256 512 1024 2048 4096',
    targetPenalty: 97
  },
  {
    label: 'Squares 1..256 (penalty <= 78)',
    values: '1 4 9 16 25 36 49 64 81 100 121 144 169 196 225 256',
    targetPenalty: 78
  },
  {
    label: 'Lucas Numbers (penalty <= 106)',
    values: '2 1 3 4 7 11 18 29 47 76 123 199 322 521 843 1364',
    targetPenalty: 106
  },
  {
    label: 'Carmichael Numbers (penalty <= 94)',
    values: '561 1105 1729 2465 2821 6601 8911 10585 15841 29341',
    targetPenalty: 94
  }
)

const varNameInput = ref('x')
const valuesInput = ref(PRESETS.at(0).values)
const prefixInput = ref('t')
const startIndexInput = ref('0')

const bitSize = ref(0)
const differBits = ref(0)
const varSymbol = ref('t')
const xSymbol = ref('x')
const varIndex = ref(0)
const totalPenalty = ref(0)

const nodes = ref(Array.of())
const selectedIds = ref(Array.of())
const history = ref(Array.of())
const singleVars = ref(Array.of())
const codeLines = ref(Array.of())

function toTwosComplementBits(num, width) {
  const val = BigInt(num)
  const mod = 1n << BigInt(width)
  const normalized = val < 0n ? mod + val : val
  const bin = normalized.toString(2).padStart(width, '0')
  return bin.slice(-width).split('')
}

function mergeTwoBitVectors(b0, b1) {
  const merged = Array.of()
  let penalty = 0
  for (let i = 0; i < b0.length; i++) {
    const pair = `${b0[i]}${b1[i]}`
    switch (pair) {
      case '00':
        merged.push('0')
        break
      case '11':
        merged.push('1')
        break
      case '01':
      case '10':
        merged.push('x')
        penalty += PENALTY_01
        break
      case 'x0':
      case 'x1':
      case '0x':
      case '1x':
        merged.push('x')
        penalty += PENALTY_NX
        break
      case 'xx':
        merged.push('x')
        penalty += PENALTY_XX
        break
      default:
        merged.push('x')
    }
  }
  return { b: merged, penalty }
}

const bitIndexes = computed(() => {
  const arr = Array.of()
  for (let i = bitSize.value - 1; i >= 0; i--) {
    arr.push(i)
  }
  return arr
})

const visibleNodes = computed(() => nodes.value.filter((n) => !n.hidden))

const headerExpression = computed(() => {
  const initialTokens = nodes.value.filter((n) => n.prev1 === undefined).map((n) => n.d)
  return `${xSymbol.value} ?= ${initialTokens.join(' ')}`
})

const activeChallenge = computed(() => {
  const normalized = String(valuesInput.value || '')
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .join(' ')
  return PRESETS.find((p) => p.values === normalized) || null
})

const completionResult = computed(() => {
  if (visibleNodes.value.length > 0 || nodes.value.length === 0) {
    return null
  }
  const challenge = activeChallenge.value
  if (!challenge) {
    return {
      isWorse: false,
      text: `Tree complete! Final total penalty: ${totalPenalty.value}.`
    }
  }

  const target = challenge.targetPenalty
  const actual = totalPenalty.value

  if (actual > target) {
    return {
      isWorse: true,
      text: `Tree complete, but penalty ${actual} is worse than target (${challenge.exact ? `= ${target}` : `<= ${target}`}). Use Back or Generate to try a better pairing.`
    }
  }

  if (actual < target) {
    return {
      isWorse: false,
      text: `New record! Final penalty ${actual} beats target (${challenge.exact ? `= ${target}` : `<= ${target}`})!`
    }
  }

  return {
    isWorse: false,
    text: `Target achieved! Final total penalty: ${actual} (${challenge.exact ? `= ${target}` : `<= ${target}`}).`
  }
})

const pairPreview = computed(() => {
  if (selectedIds.value.length !== 2) return null
  const n0 = nodes.value.find((n) => n.id === selectedIds.value.at(0))
  const n1 = nodes.value.find((n) => n.id === selectedIds.value.at(1))
  if (!n0 || !n1) return null
  const merged = mergeTwoBitVectors(n0.b, n1.b)
  return {
    n0,
    n1,
    b: merged.b,
    penalty: merged.penalty
  }
})

const singlePreview = computed(() => {
  if (selectedIds.value.length !== 1) return null
  const n0 = nodes.value.find((n) => n.id === selectedIds.value.at(0))
  if (!n0) return null
  let p = differBits.value
  for (let i = 0; i < n0.b.length; i++) {
    if (n0.b[i] === 'x') p++
  }
  if (singleVars.value.length !== 1 && singleVars.value.length !== 2) {
    p += 1
  }
  return {
    n0,
    penalty: p
  }
})

const generatedCode = computed(() => {
  if (nodes.value.length === 0) return ''
  const lines = Array.of(
    `size ${bitSize.value} 0`,
    '',
    `// ${headerExpression.value}`,
    '// begin ?='
  )
  if (singleVars.value.length > 0) {
    lines.push(singleVars.value.join(' || '))
  }
  for (const l of codeLines.value) {
    lines.push(l)
  }
  return lines.join('\n')
})

function initWorkspace() {
  const tokens = String(valuesInput.value || '')
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)

  if (tokens.length === 0) return

  xSymbol.value = String(varNameInput.value || 'x').trim() || 'x'
  varSymbol.value = String(prefixInput.value || 't').trim() || 't'
  const parsedIdx = Number(startIndexInput.value)
  varIndex.value = Number.isNaN(parsedIdx) ? 0 : Math.floor(parsedIdx)

  let maxBits = 1
  let allPositive = true

  for (const tok of tokens) {
    const num = Number(tok)
    if (!Number.isNaN(num)) {
      const len = Math.abs(Math.trunc(num)).toString(2).length
      if (num < 0) allPositive = false
      if (len > maxBits) maxBits = len
    }
  }

  if (!allPositive) {
    maxBits += 1
  }

  bitSize.value = maxBits
  const built = tokens.map((tok, idx) => {
    const num = Number(tok)
    const bits = Number.isNaN(num)
      ? Array(maxBits).fill('x')
      : toTwosComplementBits(Math.trunc(num), maxBits)
    return {
      id: idx,
      d: tok,
      b: bits,
      hidden: false
    }
  })

  let diff = 0
  for (let bitIdx = 0; bitIdx < maxBits; bitIdx++) {
    const firstBit = built.at(0).b[bitIdx]
    for (let j = 1; j < built.length; j++) {
      if (built[j].b[bitIdx] !== firstBit) {
        diff++
        break
      }
    }
  }

  differBits.value = diff
  nodes.value = built
  selectedIds.value = Array.of()
  history.value = Array.of()
  singleVars.value = Array.of()
  codeLines.value = Array.of()
  totalPenalty.value = 0
}

function applyPreset(preset) {
  valuesInput.value = preset.values
  initWorkspace()
}

function toggleSelectNode(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else if (selectedIds.value.length < 2) {
    selectedIds.value.push(id)
  }
}

function handleAddPair() {
  if (!pairPreview.value) return
  const { n0, n1, b, penalty } = pairPreview.value

  varIndex.value += 1
  const bv = `${varSymbol.value}${varIndex.value}`

  varIndex.value += 1
  let nv = `${varSymbol.value}${varIndex.value}`

  const isLast = visibleNodes.value.length === 2 && singleVars.value.length === 0
  if (isLast) {
    nv = xSymbol.value
  }

  totalPenalty.value += penalty
  let line = `${bv} ? ${n0.d} : ${n1.d} = ${nv}`
  if (isLast) {
    line += `\n// penalty: ${totalPenalty.value}\n// end ?=`
  }

  n0.hidden = true
  n1.hidden = true

  const newNodeId = nodes.value.length
  nodes.value.push({
    id: newNodeId,
    d: nv,
    b,
    prev1: n0.d,
    prev2: n1.d,
    hidden: isLast
  })

  codeLines.value.push(line)
  history.value.push({
    type: 'pair',
    id0: n0.id,
    id1: n1.id,
    createdId: newNodeId,
    penalty
  })
  selectedIds.value = Array.of()
}

function handleAddSingle() {
  if (!singlePreview.value) return
  const { n0, penalty } = singlePreview.value

  varIndex.value += 1
  const bv = `${varSymbol.value}${varIndex.value}`

  const isLast = visibleNodes.value.length === 1
  totalPenalty.value += penalty

  let line = `${bv} ? ${n0.d} = ${xSymbol.value}`
  if (isLast) {
    line += `\n// penalty: ${totalPenalty.value}\n// end ?=`
  }

  n0.hidden = true
  singleVars.value.push(bv)
  codeLines.value.push(line)
  history.value.push({
    type: 'single',
    id0: n0.id,
    penalty
  })
  selectedIds.value = Array.of()
}

function handleBack() {
  if (history.value.length === 0) return
  const step = history.value.pop()

  totalPenalty.value -= step.penalty
  codeLines.value.pop()

  if (step.type === 'single') {
    const n0 = nodes.value.find((n) => n.id === step.id0)
    if (n0) n0.hidden = false
    singleVars.value.pop()
    varIndex.value -= 1
  } else {
    const n0 = nodes.value.find((n) => n.id === step.id0)
    const n1 = nodes.value.find((n) => n.id === step.id1)
    if (n0) n0.hidden = false
    if (n1) n1.hidden = false
    nodes.value.pop()
    varIndex.value -= 2
  }

  selectedIds.value = Array.of()
}

function handleCopyGenerated() {
  if (!generatedCode.value) return
  emit('copy-code', generatedCode.value)
}

initWorkspace()
</script>

<template>
  <div class="vfs-draft">
    <p class="draft-description">
      Build a compact ternary condition tree for <code>x ?= values</code> by pairing numbers that
      share the most identical bits. Each bit position adds a clause penalty: <code>0</code> for two
      constants (<code>0</code> or <code>1</code>), <code>3</code> when pairing a constant with
      <code>x</code>, and <code>4</code> for <code>x</code> with <code>x</code>.
    </p>

    <div class="presets-bar">
      <span class="presets-label">Challenges:</span>
      <div class="presets-list">
        <button
          v-for="preset in PRESETS"
          :key="preset.label"
          type="button"
          class="preset-btn"
          @click="applyPreset(preset)"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>

    <div class="draft-card">
      <div class="card-header">
        <div class="config-grid">
          <label class="cfg-field">
            <span>var name</span>
            <input v-model="varNameInput" type="text" class="cfg-input is-sm" />
          </label>
          <label class="cfg-field is-wide">
            <span>values</span>
            <input v-model="valuesInput" type="text" class="cfg-input" />
          </label>
          <label class="cfg-field">
            <span>prefix</span>
            <input v-model="prefixInput" type="text" class="cfg-input is-sm" />
          </label>
          <label class="cfg-field">
            <span>index start</span>
            <input
              v-model="startIndexInput"
              type="text"
              inputmode="numeric"
              class="cfg-input is-sm"
            />
          </label>
        </div>

        <button type="button" class="solve-btn" @click="initWorkspace">Generate</button>
      </div>

      <!-- Bit Rows Workspace -->
      <div class="workspace-body">
        <div class="workspace-top-bar">
          <code class="expr-title">{{ headerExpression }}</code>
          <span class="penalty-pill">
            Total penalty: <strong>{{ totalPenalty }}</strong>
          </span>
        </div>

        <!-- Bit Indices Header -->
        <div v-if="bitIndexes.length > 0" class="bit-row is-header">
          <div class="bit-cells">
            <span v-for="bIdx in bitIndexes" :key="`idx-${bIdx}`" class="bit-cell is-idx">
              {{ bIdx }}
            </span>
          </div>
          <span class="row-desc is-muted">bit index</span>
        </div>

        <!-- Active Values / Intermediate Nodes -->
        <div class="rows-list">
          <button
            v-for="node in visibleNodes"
            :key="node.id"
            type="button"
            :class="['bit-row', 'is-selectable', { 'is-selected': selectedIds.includes(node.id) }]"
            @click="toggleSelectNode(node.id)"
          >
            <div class="bit-cells">
              <span
                v-for="(bit, bPos) in node.b"
                :key="`${node.id}-${bPos}`"
                :class="['bit-cell', bit === 'x' ? 'is-x' : bit === '1' ? 'is-one' : 'is-zero']"
              >
                {{ bit }}
              </span>
            </div>
            <span class="row-desc">
              <strong>{{ node.d }}</strong>
              <span v-if="node.prev1 !== undefined" class="merge-parents">
                ({{ node.prev1 }}, {{ node.prev2 }})
              </span>
            </span>
          </button>

          <div
            v-if="completionResult"
            :class="['done-banner', { 'is-worse': completionResult.isWorse }]"
          >
            {{ completionResult.text }}
          </div>
        </div>

        <!-- Selection Preview & Actions -->
        <div class="selection-panel">
          <div class="preview-box">
            <template v-if="pairPreview">
              <div class="preview-line">
                <span class="preview-label">Pair:</span>
                <code>{{ pairPreview.n0.b.join('') }}</code> ({{ pairPreview.n0.d }}) +
                <code>{{ pairPreview.n1.b.join('') }}</code> ({{ pairPreview.n1.d }})
              </div>
              <div class="preview-line">
                <span class="preview-label">Merged:</span>
                <code class="merged-bits">{{ pairPreview.b.join('') }}</code>
                · Step penalty: <strong>+{{ pairPreview.penalty }}</strong>
              </div>
            </template>

            <template v-else-if="singlePreview">
              <div class="preview-line">
                <span class="preview-label">Single:</span>
                <code>{{ singlePreview.n0.b.join('') }}</code> ({{ singlePreview.n0.d }})
              </div>
              <div class="preview-line">
                <span class="preview-label">Step penalty:</span>
                <strong>+{{ singlePreview.penalty }}</strong>
              </div>
            </template>

            <div v-else class="preview-placeholder">
              Click <strong>1</strong> or <strong>2</strong> bit rows above to preview merge &amp;
              clause penalty.
            </div>
          </div>

          <div class="action-buttons">
            <button
              type="button"
              class="act-btn"
              :disabled="history.length === 0"
              @click="handleBack"
            >
              Back
            </button>
            <button
              type="button"
              class="act-btn is-primary"
              :disabled="selectedIds.length !== 2"
              @click="handleAddPair"
            >
              Add pair
            </button>
            <button
              type="button"
              class="act-btn is-primary"
              :disabled="selectedIds.length !== 1"
              @click="handleAddSingle"
            >
              Add single
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Generated E0 Code Output -->
    <div v-if="generatedCode" class="draft-card">
      <div class="card-header">
        <span class="code-card-title">Generated .eproto Code</span>
        <div class="code-actions">
          <button type="button" class="act-btn" @click="handleCopyGenerated">Copy Code</button>
        </div>
      </div>

      <pre class="code-output">{{ generatedCode }}</pre>
    </div>

    <ValueFromSetNotes />
  </div>
</template>

<style scoped>
.vfs-draft {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.config-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
  flex: 1;
}

.cfg-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.cfg-field.is-wide {
  flex: 1;
  min-width: 210px;
}

.cfg-input {
  padding: 5px 8px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-main);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  outline: none;
}

.cfg-input.is-sm {
  width: 68px;
}

.cfg-input:focus {
  border-color: var(--accent-primary);
  background-color: var(--bg-editor);
}

.workspace-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  background-color: #ffffff;
}

.workspace-top-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.expr-title {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-main);
}

.penalty-pill {
  padding: 3px 9px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: #1e3a8a;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
}

.rows-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bit-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 4px 6px;
  background: transparent;
  border: 1px solid transparent;
  text-align: left;
  font-family: var(--font-mono);
  font-size: 0.8rem;
}

.bit-row.is-selectable {
  cursor: pointer;
}

.bit-row.is-selectable:hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
}

.bit-row.is-selected {
  background-color: #e0f2fe;
  border-color: #38bdf8;
}

.bit-cells {
  display: inline-flex;
  gap: 2px;
}

.bit-cell {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #cbd5e1;
  font-weight: 700;
  font-size: 0.76rem;
}

.bit-cell.is-idx {
  border-color: transparent;
  color: var(--text-muted);
  font-size: 0.7rem;
}

.bit-cell.is-zero {
  background-color: #f8fafc;
  color: #475569;
}

.bit-cell.is-one {
  background-color: #eff6ff;
  color: #1d4ed8;
}

.bit-cell.is-x {
  background-color: #fef3c7;
  color: #b45309;
  border-color: #fcd34d;
}

.row-desc {
  color: var(--text-main);
  font-size: 0.8rem;
}

.row-desc.is-muted {
  color: var(--text-muted);
  font-size: 0.72rem;
}

.merge-parents {
  color: var(--text-secondary);
  margin-left: 6px;
}

.done-banner {
  padding: 10px 12px;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  font-family: var(--font-mono);
  font-size: 0.8rem;
}

.selection-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
}

.preview-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--text-main);
}

.preview-label {
  color: var(--text-secondary);
  margin-right: 6px;
}

.merged-bits {
  font-weight: 700;
  color: #1d4ed8;
}

.preview-placeholder {
  color: var(--text-muted);
}

.action-buttons,
.code-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.act-btn {
  padding: 6px 12px;
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--text-main);
  background-color: var(--bg-editor);
  border: 1px solid var(--border-strong);
  cursor: pointer;
}

.act-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.act-btn.is-primary:not(:disabled) {
  background-color: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
}

.code-card-title {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-main);
}

.code-output {
  margin: 0;
  padding: 12px 14px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.55;
  color: var(--text-main);
  background-color: var(--bg-editor);
  overflow-x: auto;
}

.done-banner.is-worse {
  background-color: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}
</style>
