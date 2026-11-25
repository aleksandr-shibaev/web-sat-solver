<template>
  <section class="cm-notes-card">
    <h3 class="notes-title">How the Constant Multiplication Generator Works</h3>
    <p class="notes-lead">
      General multiplication creates large circuits in SAT. Instead, this tool expresses
      <code>N * x = r</code> as a short sequence of bit shifts (<code>&lt;&lt;</code>), additions
      (<code>+</code>), and subtractions (<code>-</code>), testing multiple candidates and keeping
      the shortest one:
    </p>

    <ul class="notes-list">
      <li>
        <strong>Step 1 — Factor out powers of two:</strong> If <code>N</code> is even, trailing
        zeros are removed first (e.g. <code>24 * x</code> becomes <code>(3 * x) &lt;&lt; 3</code>),
        so the core search only works on an odd number.
      </li>
      <li>
        <strong>Step 2 — <code>subtract</code> (Small offset splitting):</strong> Tests offsets
        <code>1..255</code> by writing <code>N = (N - offset) + offset</code>.
      </li>
      <li>
        <strong
          >Step 3 — <code>division</code> (Factorization into <code>q * d + rem</code>):</strong
        >
        Searches odd divisors <code>d</code> where <code>q</code> and <code>rem</code> have few
        non-zero signed bits.
      </li>
      <li>
        <strong>Bit-pair reuse (Common subexpressions):</strong> Scans the bit representation of
        <code>N</code> for identical pairs of non-zero bits separated by the same shift distance
        (for example, <code>101<sub>2</sub></code> appearing multiple times) and extracts each
        repeated pair into a shared helper variable (<code>t1 = x + (x &lt;&lt; 2)</code>) so it is
        computed only once.
      </li>
    </ul>

    <h4 class="notes-subtitle">Config Parameters (<code>subtract divide divideTop</code>)</h4>
    <ul class="notes-list">
      <li>
        <strong><code>subtract</code> (default <code>5</code>):</strong> Number of top small-offset
        candidates (<code>N - offset</code>) to build and compare. Set to <code>0</code> to skip
        subtraction splits.
      </li>
      <li>
        <strong><code>divide</code> (default <code>5</code>):</strong> Number of top odd divisor
        candidates (<code>N = q * d + rem</code>) to build and compare (in addition to
        <code>3, 7, 15, 31, 63</code>). Set to <code>0</code> to skip divisor search.
      </li>
      <li>
        <strong><code>divideTop</code> (default <code>3000</code>):</strong> Upper bound for odd
        divisors <code>d</code> scanned during factorization
      </li>
    </ul>
  </section>
</template>

<style scoped>
.cm-notes-card {
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

.notes-subtitle {
  margin: 6px 0 0;
  font-family: var(--font-mono);
  font-size: 0.78rem;
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
