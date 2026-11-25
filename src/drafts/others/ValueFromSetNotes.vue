<template>
  <section class="vfs-notes-card">
    <h3 class="notes-title">How the Compiler Builds the <code>?=</code> Tree</h3>
    <p class="notes-lead">
      Instead of checking every possible pairing, the compiler uses a fast
      <strong>beam search</strong> heuristic to find a low-clause tree:
    </p>

    <ul class="notes-list">
      <li>
        <strong>Smart scoring (<code>penalty + x</code>):</strong> Merging <code>0</code> and
        <code>1</code> creates an <code>x</code> bit for free right now, but that
        <code>x</code> will cost extra clauses on later steps. The compiler adds a small
        <code>+1</code> weight for each <code>x</code> so it prefers pairs that stay cleaner higher
        up in the tree.
      </li>
      <li>
        <strong>Beam search &amp; caching:</strong> At each step, the solver keeps only the best
        partial trees (controlled by <code>config valueFromSet limit branching</code>), tries the
        top pair merges for each of them, and caches already computed pairs so identical subtrees
        are never recalculated.
      </li>
      <li>
        <strong>Early exit with single implications:</strong> Before each merge step, the solver
        checks whether it is cheaper to stop pairing and finish the remaining branches directly with
        implications (<code>b_i ? val_i = x</code>). If that gives fewer clauses, it picks that
        hybrid solution.
      </li>
    </ul>
  </section>
</template>

<style scoped>
.vfs-notes-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--border-strong);
}

.notes-title {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--text-main);
}

.notes-lead {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

.notes-list {
  margin: 2px 0 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

.notes-list strong {
  color: var(--text-main);
}
</style>
