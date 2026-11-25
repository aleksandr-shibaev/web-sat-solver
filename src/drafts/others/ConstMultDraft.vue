<script setup>
import { ref } from 'vue'
import { MultiplicationByConstant } from './MultiplicationByConstant.min.js'
import { RationalNumber } from './RationalNumber.min.js'
import ConstMultNotes from './ConstMultNotes.vue'

const emit = defineEmits(['copy-code'])

const BENCHMARK_NUMBERS = Array.of(
  '25096180',
  '78438221',
  '98917460',
  '49166177',
  '89144082',
  '329109441937',
  '219733635465',
  '5602748214914973',
  '6444661091042628',
  '4049115120024166',
  '2065419584831789',
  '8569749169430443',
  '535930666815995059905042',
  '953024166956485713573359',
  '37708633701793778394607',
  '33665372246378401925350535333907',
  '874886859668289046753183581688097006927026993',
  '43560648553948912840198145489300880646383971942449141604',
  '841214140731698510766020132092473662964959734258415104637935928617287325782828',
  '11841214140731698510766020132092473662456554964959734258415103466434523324463793592861728732578282811',
  '118412141407316985107660245634301320964421473662456554964959734258415103466434523324463793592861728732578282811'
)

const PRESETS = Array.of(
  { label: '333', value: '333' },
  { label: '25096180 (4 ops)', value: '25096180' },
  { label: '329109441937 (8 ops)', value: '329109441937' },
  { label: '128-bit Constant (20 ops)', value: '33665372246378401925350535333907' },
  {
    label: '380-bit Constant (60 ops)',
    value:
      '118412141407316985107660245634301320964421473662456554964959734258415103466434523324463793592861728732578282811'
  }
)

const numberInput = ref('333')
const configsInput = ref('5 5 3000')
const varNameInput = ref('x')
const resultVarInput = ref('r')

const outputText = ref('')
const logText = ref('')
const errorText = ref('')
const lastAdditionsCount = ref(null)

function buildSettingsObject() {
  const parts = String(configsInput.value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return {
    multByConstSubtract: parts.at(0) !== undefined ? Number(parts.at(0)) : 5,
    multByConstDivide: parts.at(1) !== undefined ? Number(parts.at(1)) : 5,
    multByConstDivideTop: parts.at(2) !== undefined ? Number(parts.at(2)) : 3000
  }
}

function handleGenerate() {
  errorText.value = ''
  const rawNum = String(numberInput.value || '').trim()

  if (!rawNum) {
    handleRunBenchmarks()
    return
  }

  try {
    const big = BigInt(rawNum)
    if (big <= 0n) {
      errorText.value = 'Enter a positive integer (or leave empty to run all 21 benchmarks).'
      return
    }

    const size = 2 * big.toString(2).length
    RationalNumber.setBitSizeFraction(0)
    RationalNumber.setBitSizeInteger(size, false)

    const rn = new RationalNumber(rawNum, false)
    const vName = String(varNameInput.value || 'x').trim() || 'x'
    const rName = String(resultVarInput.value || 'r').trim() || 'r'

    let temp = 0
    const getNewVar = () => {
      temp++
      return `t${temp}`
    }

    const mbc = new MultiplicationByConstant(buildSettingsObject())
    const equations = mbc.generateEquations(false, rn, vName, getNewVar, rName)
    const addCount = mbc.countAdditions(equations)

    const lines = Array.of(
      '/*',
      '  Equation:',
      `  ${rn} * ${vName} = ${rName}`,
      `  Addition count: ${addCount}`,
      '*/',
      '',
      `size + ${size} 0`,
      ''
    )

    for (const eq of equations) {
      if (eq[3] === 'true') {
        lines.push(`${eq[0]} ${eq[1]} ${eq[2]} == ${eq[3]}`)
      } else {
        lines.push(`${eq[0]} ${eq[1]} ${eq[2]} = ${eq[3]}`)
      }
    }

    outputText.value = lines.join('\n')
    logText.value = mbc.lastLog || ''
    lastAdditionsCount.value = addCount
  } catch (err) {
    errorText.value = err?.message || 'Error generating equations for this number.'
  }
}

function handleRunBenchmarks() {
  errorText.value = ''
  lastAdditionsCount.value = null

  try {
    RationalNumber.setBitSizeFraction(0)
    RationalNumber.setBitSizeInteger(400, false)

    const settings = buildSettingsObject()
    const rows = Array.of('Addition count : number', '')
    let mbc = null

    for (const numStr of BENCHMARK_NUMBERS) {
      const rn = new RationalNumber(numStr, false)
      let temp = 0
      const getNewVar = () => {
        temp++
        return `t${temp}`
      }

      mbc = new MultiplicationByConstant(settings)
      const equations = mbc.generateEquations(false, rn, 'x', getNewVar, 'r')
      rows.push(`${mbc.countAdditions(equations)} : ${rn}`)
    }

    outputText.value = rows.join('\n')
    logText.value = mbc ? mbc.lastLog : ''
  } catch (err) {
    errorText.value = err?.message || 'Benchmark execution error.'
  }
}

function applyPreset(preset) {
  numberInput.value = preset.value
  handleGenerate()
}

function handleCopyOutput() {
  if (!outputText.value) return
  emit('copy-code', outputText.value)
}

handleGenerate()
</script>

<template>
  <div class="constmult-draft">
    <p class="draft-description">
      Decompose multiplication by an arbitrary large constant (<code>N * x = r</code>) into a
      minimal chain of shifts, additions, and subtractions using NAF, repeated bit-pair elimination,
      and divisor factorization.
    </p>

    <div class="presets-bar">
      <span class="presets-label">Presets:</span>
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
        <button type="button" class="preset-btn is-bench" @click="handleRunBenchmarks">
          Run All 21 Benchmarks
        </button>
      </div>
    </div>

    <div class="draft-card">
      <div class="card-header">
        <div class="config-grid">
          <label class="cfg-field is-wide">
            <span>Number</span>
            <input
              v-model="numberInput"
              type="text"
              placeholder="e.g. 333 (leave empty for 21 benchmarks)"
              class="cfg-input"
            />
          </label>
          <label class="cfg-field">
            <span>Configs: subtract divide divideTop</span>
            <input v-model="configsInput" type="text" class="cfg-input is-md" />
          </label>
          <label class="cfg-field">
            <span>var</span>
            <input v-model="varNameInput" type="text" class="cfg-input is-xs" />
          </label>
          <label class="cfg-field">
            <span>result</span>
            <input v-model="resultVarInput" type="text" class="cfg-input is-xs" />
          </label>
        </div>

        <button type="button" class="solve-btn" @click="handleGenerate">Generate</button>
      </div>
    </div>

    <div v-if="errorText" class="status-banner is-error">
      {{ errorText }}
    </div>

    <div v-if="outputText" class="draft-card">
      <div class="card-header">
        <div class="header-stats">
          <span class="code-card-title">Generated .eproto Code</span>
          <span v-if="lastAdditionsCount !== null" class="ops-badge">
            Additions / Subtractions: <strong>{{ lastAdditionsCount }}</strong>
          </span>
        </div>

        <button type="button" class="act-btn" @click="handleCopyOutput">Copy Code</button>
      </div>

      <pre class="code-output">{{ outputText }}</pre>
    </div>

    <div v-if="logText" class="draft-card">
      <div class="card-header">
        <span class="code-card-title">Search Candidates Log</span>
      </div>
      <pre class="log-output">{{ logText }}</pre>
    </div>
    <ConstMultNotes />
  </div>
</template>

<style scoped>
.constmult-draft {
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
  min-width: 220px;
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

.cfg-input.is-xs {
  width: 52px;
}

.cfg-input.is-md {
  width: 150px;
}

.cfg-input:focus {
  border-color: var(--accent-primary);
  background-color: var(--bg-editor);
}

.preset-btn.is-bench {
  border-color: #93c5fd;
  background-color: #eff6ff;
  color: #1d4ed8;
}

.code-card-title {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-main);
}

.ops-badge {
  padding: 2px 8px;
  font-family: var(--font-mono);
  font-size: 0.74rem;
  color: #166534;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.act-btn {
  padding: 5px 11px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-main);
  background-color: var(--bg-editor);
  border: 1px solid var(--border-strong);
  cursor: pointer;
}

.act-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.code-output,
.log-output {
  margin: 0;
  padding: 12px 14px;
  font-family: var(--font-mono);
  font-size: 0.79rem;
  line-height: 1.55;
  color: var(--text-main);
  background-color: var(--bg-editor);
  overflow-x: auto;
}

.log-output {
  color: var(--text-secondary);
  background-color: var(--bg-tertiary);
}
</style>
