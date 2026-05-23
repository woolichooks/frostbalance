import { useMemo, useState } from 'react';
import { generatePuzzle } from './engine/generator';
import type { Puzzle } from './engine/types';
import { fmt, signedFmt } from './engine/format';
import './App.css';

type Status = 'picking-row' | 'picking-fix' | 'correct' | 'wrong';

function App() {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle());
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedFixId, setSelectedFixId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('picking-row');
  const [attempts, setAttempts] = useState(0);

  const onPickRow = (id: string) => {
    if (status === 'correct') return;
    setSelectedRowId(id);
    setSelectedFixId(null);
    setStatus('picking-fix');
  };

  const onSubmit = () => {
    if (!selectedRowId || !selectedFixId) return;
    setAttempts((a) => a + 1);
    const rowRight = selectedRowId === puzzle.errorTransactionId;
    const fixRight = selectedFixId === puzzle.correctFixId;
    setStatus(rowRight && fixRight ? 'correct' : 'wrong');
  };

  const onNext = () => {
    setPuzzle(generatePuzzle());
    setSelectedRowId(null);
    setSelectedFixId(null);
    setStatus('picking-row');
    setAttempts(0);
  };

  const onTryAgain = () => {
    setStatus('picking-row');
    setSelectedRowId(null);
    setSelectedFixId(null);
  };

  const scheduleRows = useMemo(
    () => [puzzle.openingEntry, ...puzzle.amortizationEntries],
    [puzzle],
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>Frostbalance</h1>
        <p className="tagline">Day {1 + attempts} · Reconcile to eat.</p>
      </header>

      <section className="card scenario">
        <h2>The job</h2>
        <p>
          You paid <strong>{puzzle.scenario.vendor}</strong>{' '}
          {fmt(puzzle.scenario.annualAmount)} for a 12-month{' '}
          {puzzle.scenario.itemNoun} on {puzzle.openingEntry.date}. It's now{' '}
          {puzzle.scenario.monthsElapsed} months in. The trial balance shows{' '}
          <strong>{puzzle.scenario.prepaidAccount}</strong> at{' '}
          <strong>{fmt(puzzle.trialBalance)}</strong>, but your prepaid schedule
          totals <strong>{fmt(puzzle.scheduleBalance)}</strong>. That's a
          discrepancy of <strong>{signedFmt(puzzle.discrepancy)}</strong>.
        </p>
        <p className="prompt">
          Click the row you think is wrong, then choose how to fix it.
        </p>
      </section>

      <div className="two-col">
        <section className="card tb">
          <h2>Trial Balance</h2>
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th className="num">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{puzzle.scenario.prepaidAccount}</td>
                <td className="num">{fmt(puzzle.trialBalance)}</td>
              </tr>
              <tr>
                <td>{puzzle.scenario.expenseAccount}</td>
                <td className="num">
                  {fmt(
                    (puzzle.scenario.annualAmount / 12) *
                      puzzle.scenario.monthsElapsed,
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="hint">Per the GL — this is the source of truth.</p>
        </section>

        <section className="card schedule">
          <h2>{puzzle.scenario.prepaidAccount} — Schedule</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Description</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {scheduleRows.map((t, i) => {
                const isOpening = i === 0;
                const isSelected = selectedRowId === t.id;
                const showCorrect =
                  status === 'correct' && t.id === puzzle.errorTransactionId;
                const showWrong =
                  status === 'wrong' &&
                  selectedRowId === t.id &&
                  t.id !== puzzle.errorTransactionId;
                return (
                  <tr
                    key={t.id}
                    className={[
                      isOpening ? 'opening' : 'clickable',
                      isSelected ? 'selected' : '',
                      showCorrect ? 'flag-correct' : '',
                      showWrong ? 'flag-wrong' : '',
                    ].join(' ')}
                    onClick={() => !isOpening && onPickRow(t.id)}
                  >
                    <td>{isOpening ? '—' : i}</td>
                    <td>{t.date}</td>
                    <td>{t.description}</td>
                    <td className="num">
                      {isOpening ? fmt(t.amount) : `(${fmt(t.amount)})`}
                    </td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td colSpan={3}>Ending balance per schedule</td>
                <td className="num">{fmt(puzzle.scheduleBalance)}</td>
              </tr>
              <tr className="total-row tb-row">
                <td colSpan={3}>Trial balance</td>
                <td className="num">{fmt(puzzle.trialBalance)}</td>
              </tr>
              <tr className="total-row diff-row">
                <td colSpan={3}>Discrepancy</td>
                <td className="num">{signedFmt(puzzle.discrepancy)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      {(status === 'picking-fix' || status === 'wrong' || status === 'correct') && (
        <section className="card fixes">
          <h2>How do you fix it?</h2>
          <ul>
            {puzzle.fixes.map((f) => {
              const checked = selectedFixId === f.id;
              const reveal = status === 'correct' || status === 'wrong';
              const isCorrect = f.id === puzzle.correctFixId;
              return (
                <li
                  key={f.id}
                  className={[
                    'fix-option',
                    checked ? 'checked' : '',
                    reveal && isCorrect ? 'correct' : '',
                    reveal && checked && !isCorrect ? 'wrong' : '',
                  ].join(' ')}
                >
                  <label>
                    <input
                      type="radio"
                      name="fix"
                      value={f.id}
                      checked={checked}
                      disabled={status === 'correct'}
                      onChange={() => setSelectedFixId(f.id)}
                    />
                    {f.label}
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="actions">
        {status !== 'correct' && (
          <button
            className="primary"
            onClick={onSubmit}
            disabled={!selectedRowId || !selectedFixId}
          >
            Submit reconciliation
          </button>
        )}
        {status === 'wrong' && (
          <button onClick={onTryAgain}>Try again</button>
        )}
        {status === 'correct' && (
          <button className="primary" onClick={onNext}>
            Next puzzle →
          </button>
        )}
      </div>

      {status === 'correct' && (
        <section className="card feedback ok">
          <h2>Reconciled.</h2>
          <p>
            Row {scheduleRows.findIndex((r) => r.id === puzzle.errorTransactionId)}{' '}
            was off by {signedFmt(puzzle.discrepancy)}. Correct amount:{' '}
            <strong>{fmt(puzzle.correctAmount)}</strong>.
          </p>
          <p>Attempts: {attempts}.</p>
        </section>
      )}
      {status === 'wrong' && (
        <section className="card feedback bad">
          <h2>The books still don't tie.</h2>
          <p>
            {selectedRowId === puzzle.errorTransactionId
              ? 'Right row, wrong fix. Try again.'
              : "That row reconciles cleanly — look elsewhere."}
          </p>
        </section>
      )}
    </div>
  );
}

export default App;
