<script setup>
import { computed } from 'vue'

const props = defineProps({
  solution: {
    type: Object,
    required: true
  },
  stats: {
    type: Object,
    default: null
  },
  isOutdated: {
    type: Boolean,
    default: false
  },
  liveCost: {
    type: String,
    default: null
  },
  liveSteps: {
    type: Array,
    default: null
  },
  showSteps: {
    type: Boolean,
    default: true
  }
})

const displayCost = computed(() =>
  props.isOutdated && props.liveCost !== null ? props.liveCost : props.solution.minCost
)

const displaySteps = computed(() =>
  props.isOutdated && props.liveSteps ? props.liveSteps : props.solution.steps
)
</script>

<template>
  <div :class="['result-card', { 'is-outdated': isOutdated }]">
    <div class="result-header">
      <div class="result-headline">
        <span :class="['result-badge', { 'is-outdated': isOutdated }]">
          {{ isOutdated ? 'OUTDATED' : 'OPTIMAL' }}
        </span>
        <span class="result-main">
          {{ isOutdated ? 'Previous Tour Cost:' : 'Min Tour Cost:' }}
          <strong>{{ displayCost }}</strong>
        </span>
        <span v-if="isOutdated" class="outdated-hint">
          (graph modified — click Find Shortest Tour to re-optimize)
        </span>
      </div>

      <span v-if="stats && !isOutdated" class="solution-meta">
        {{ stats.duration }} ms · {{ stats.vars }} vars · {{ stats.clauses }} clauses
      </span>
    </div>

    <div class="tour-summary-line">
      <strong>Tour:</strong> <code>{{ solution.path.join(' → ') }}</code>
    </div>

    <div v-if="showSteps" class="steps-list">
      <div
        v-for="(step, idx) in displaySteps"
        :key="`${step.from}-${step.to}-${idx}`"
        class="step-row"
      >
        <span class="step-index">{{ idx + 1 }}.</span>
        <span class="step-edge">
          <strong>{{ step.from }}</strong> → <strong>{{ step.to }}</strong>
        </span>
        <span class="step-weight"
          >weight: <strong>{{ step.weight }}</strong></span
        >
      </div>
    </div>

    <div class="sum-breakdown">
      <strong>Sum:</strong>
      {{ displayCost }} =
      {{ displaySteps.map((s) => s.weight).join(' + ') }}
    </div>
  </div>
</template>

<style scoped>
.result-card.is-outdated {
  background-color: #fffbeb;
  border-color: #fde68a;
  border-left-color: #f59e0b;
}

.result-badge.is-outdated {
  color: #92400e;
  background-color: #fef3c7;
  border-color: #fcd34d;
}

.outdated-hint {
  font-size: 0.76rem;
  color: #92400e;
}

.tour-summary-line {
  padding: 6px 10px;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  color: var(--text-main);
  background-color: var(--bg-editor);
  border: 1px solid #cbd5e1;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 4px 10px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--text-main);
  background-color: var(--bg-editor);
  border: 1px solid #e2e8f0;
}

.step-index {
  color: var(--text-muted);
  min-width: 24px;
}

.step-edge {
  flex: 1;
}

.step-weight {
  color: var(--text-secondary);
}

.step-weight strong {
  color: var(--accent-primary);
}

.sum-breakdown {
  padding-top: 6px;
  border-top: 1px solid #e2e8f0;
  font-family: var(--font-mono);
  font-size: 0.76rem;
  color: var(--text-secondary);
}
</style>
