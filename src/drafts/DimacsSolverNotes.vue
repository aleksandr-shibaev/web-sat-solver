<template>
  <div class="dimacs-notes">
    <!-- Educational Guide: What is DIMACS CNF -->
    <section class="info-section">
      <h2 class="info-heading">What is the DIMACS CNF Format?</h2>
      <p class="info-text">
        <strong>DIMACS CNF</strong> is the standard text format for Boolean Satisfiability (SAT)
        solvers. A formula is written in <em>Conjunctive Normal Form</em> (CNF)—a logical
        <strong>AND</strong> of clauses, where each clause is a logical <strong>OR</strong> of
        literals (variables or their negations):
      </p>

      <ul class="info-list">
        <li>
          <strong>Comments (<code>c</code>):</strong> Lines starting with <code>c</code> are
          comments ignored by the solver.
        </li>
        <li>
          <strong>Header (<code>p cnf &lt;vars&gt; &lt;clauses&gt;</code>):</strong> Declares the
          number of Boolean variables (indexed <code>1..N</code>) and the total number of clauses.
        </li>
        <li>
          <strong>Literals &amp; Negation:</strong> A positive integer represents a variable, while
          a negative integer represents its negation.
        </li>
        <li>
          <strong>Clauses &amp; Delimiter (<code>0</code>):</strong> Clauses are separated by
          <code>0</code> and, by convention, each clause is written on a separate line.
        </li>
      </ul>

      <!-- 3 Side-by-Side Cards: DIMACS Input + C-Style + Mathematical -->
      <div class="notations-grid">
        <div class="notation-card">
          <div class="notation-title">DIMACS CNF Input</div>
          <pre class="info-code">
c this is comment
p cnf 4 4
1 -2 3 4 0
-1 2 0
-2 -3 4 0
1 -4 0</pre>
        </div>

        <div class="notation-card">
          <div class="notation-title">C-Style (<code>!</code> and <code>||</code>)</div>
          <pre class="info-code">
x1 || !x2 || x3 || x4
!x1 || x2
!x2 || !x3 || x4
x1 || !x4</pre>
        </div>

        <div class="notation-card">
          <div class="notation-title">Mathematical (<code>¬</code> and <code>∨</code>)</div>
          <pre class="info-code">
x1 ∨ ¬x2 ∨ x3 ∨ x4
¬x1 ∨ x2
¬x2 ∨ ¬x3 ∨ x4
x1 ∨ ¬x4</pre>
        </div>
      </div>

      <p class="info-text">
        The DIMACS input above defines a problem with four Boolean variables (<code>x1</code>,
        <code>x2</code>, <code>x3</code>, <code>x4</code>). The solver searches for a truth
        assignment that makes the entire formula below evaluate to <code>true</code>—or outputs
        <code>UNSAT</code> if no such combination exists:
      </p>

      <!-- Full-width Combined Formula -->
      <div class="example-col">
        <div class="example-label">Full Formula (Standard Boolean Notation)</div>
        <pre class="info-code">
(x1 ∨ ¬x2 ∨ x3 ∨ x4) ∧ (¬x1 ∨ x2) ∧ (¬x2 ∨ ¬x3 ∨ x4) ∧ (x1 ∨ ¬x4)</pre>
      </div>

      <!-- How Solver Output Numbers Are Read -->
      <div class="output-explain">
        <div class="example-label">How to Read the Solver Output</div>
        <p class="info-text">
          If no assignment satisfies all clauses simultaneously, the solver prints
          <code>UNSAT</code>. Otherwise, it prints <code>SAT</code> followed by one integer per
          variable, terminated by <code>0</code>:
        </p>
        <pre class="info-code">
SAT
1 2 -3 -4 0</pre>
        <ul class="info-list">
          <li>
            <strong><code>1</code> (positive):</strong> Variable <code>x<sub>1</sub> = true</code>
          </li>
          <li>
            <strong><code>2</code> (positive):</strong> Variable <code>x<sub>2</sub> = true</code>
          </li>
          <li>
            <strong><code>-3</code> (negative):</strong> Variable <code>x<sub>3</sub> = false</code>
          </li>
          <li>
            <strong><code>-4</code> (negative):</strong> Variable <code>x<sub>4</sub> = false</code>
          </li>
          <li>
            <strong><code>0</code> (trailing zero):</strong> End-of-assignment delimiter (not a
            variable).
          </li>
        </ul>

        <div class="verify-block">
          <div class="example-label">
            Verification (Substituting the Assignment into Each Clause)
          </div>
          <p class="info-text">
            Each clause evaluates to <code>true</code> because at least one literal inside it is
            satisfied (<span class="lit-true">true</span> or
            <span class="lit-true">&not;false</span>):
          </p>
          <div class="verify-code">
            <div>
              (<span class="lit-true">true</span> ∨ <span class="lit-false">&not;true</span> ∨
              <span class="lit-false">false</span> ∨ <span class="lit-false">false</span>) &rarr;
              <strong class="res-true">true</strong>
            </div>
            <div>
              (<span class="lit-false">&not;true</span> ∨ <span class="lit-true">true</span>) &rarr;
              <strong class="res-true">true</strong>
            </div>
            <div>
              (<span class="lit-false">&not;true</span> ∨ <span class="lit-true">&not;false</span> ∨
              <span class="lit-false">false</span>) &rarr;
              <strong class="res-true">true</strong>
            </div>
            <div>
              (<span class="lit-true">true</span> ∨ <span class="lit-true">&not;false</span>) &rarr;
              <strong class="res-true">true</strong>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="info-section">
      <h2 class="info-heading">About the Solver</h2>
      <p class="info-text">
        This page runs the classic C++
        <a href="http://minisat.se" target="_blank" rel="noopener noreferrer" class="info-link"
          ><strong>MiniSat</strong></a
        >
        CDCL solver directly inside your browser. The solver was compiled from C++ to WebAssembly
        using
        <a href="https://emscripten.org" target="_blank" rel="noopener noreferrer" class="info-link"
          ><strong>Emscripten</strong></a
        >, allowing DIMACS CNF formulas to be solved locally on your machine (in your browser) with
        no server backend.
      </p>
    </section>
  </div>
</template>

<style scoped>
.dimacs-notes {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 6px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--border-strong);
}

.info-heading {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-main);
}

.info-text {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--text-secondary);
}

.info-text strong {
  color: var(--text-main);
}

.info-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.83rem;
  line-height: 1.55;
  color: var(--text-secondary);
}

.info-list strong {
  color: var(--text-main);
}

.notations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 10px;
}

.example-col,
.notation-card,
.output-explain {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.output-explain {
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color);
}

.example-label {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-main);
}

.notation-title {
  font-family: var(--font-mono);
  font-size: 0.73rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.overbar {
  text-decoration: overline;
}

.info-code,
.overbar-code {
  margin: 0;
  padding: 10px 12px;
  font-family: var(--font-mono);
  font-size: 0.77rem;
  line-height: 1.55;
  color: var(--text-main);
  background-color: var(--bg-editor);
  border: 1px solid var(--border-color);
  overflow-x: auto;
  flex: 1;
}

.verify-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.verify-code {
  margin: 0;
  padding: 10px 12px;
  font-family: var(--font-mono);
  font-size: 0.77rem;
  line-height: 1.65;
  color: var(--text-main);
  background-color: var(--bg-editor);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lit-true {
  color: #15803d;
  background-color: #dcfce7;
  padding: 1px 4px;
  border-radius: 2px;
  font-weight: 700;
}

.lit-false {
  color: var(--text-muted);
}

.res-true {
  color: #15803d;
}
</style>
