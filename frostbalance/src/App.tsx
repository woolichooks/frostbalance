import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generatePuzzle } from './engine/generator';
import type { Puzzle } from './engine/types';
import { fmt, signedFmt } from './engine/format';
import type { Resource } from './engine/survival';
import {
  INITIAL_RESOURCES,
  RESOURCE_LABEL,
  TIME_LIMIT_MS,
  WRONG_PENALTY_MS,
  computeReward,
  dailyDecay,
  grantReward,
  isStarved,
} from './engine/survival';
import { ResourcePanel } from './components/ResourcePanel';
import { Timer } from './components/Timer';
import { DayBriefing } from './components/DayBriefing';
import './App.css';

type Phase = 'briefing' | 'playing' | 'solved' | 'timeout' | 'game-over';

function App() {
  const [day, setDay] = useState(1);
  const [resources, setResources] = useState(INITIAL_RESOURCES);
  const [phase, setPhase] = useState<Phase>('briefing');
  const [chosenResource, setChosenResource] = useState<Resource | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle());

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedFixId, setSelectedFixId] = useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [timerFrozenAt, setTimerFrozenAt] = useState<number | null>(null);
  const [penaltyMs, setPenaltyMs] = useState(0);
  const [, setNowTick] = useState(0);

  const [lastReward, setLastReward] = useState(0);
  const [lastSolveMs, setLastSolveMs] = useState(0);
  const [starvedOf, setStarvedOf] = useState<Resource | null>(null);

  const flashTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = window.setInterval(() => setNowTick((n) => n + 1), 100);
    return () => window.clearInterval(id);
  }, [phase]);

  const elapsedMs = useMemo(() => {
    if (timerStart === null) return 0;
    const ref = timerFrozenAt ?? Date.now();
    return ref - timerStart + penaltyMs;
  }, [timerStart, timerFrozenAt, penaltyMs]);

  // Timeout detection
  useEffect(() => {
    if (phase === 'playing' && elapsedMs >= TIME_LIMIT_MS) {
      setTimerFrozenAt(Date.now());
      setLastSolveMs(TIME_LIMIT_MS);
      setLastReward(0);
      setPhase('timeout');
    }
  }, [phase, elapsedMs]);

  const beginDay = useCallback(() => {
    if (!chosenResource) return;
    setPuzzle(generatePuzzle());
    setSelectedRowId(null);
    setSelectedFixId(null);
    setWrongAttempts(0);
    setPenaltyMs(0);
    setTimerFrozenAt(null);
    setTimerStart(Date.now());
    setPhase('playing');
  }, [chosenResource]);

  const onPickRow = (id: string) => {
    if (phase !== 'playing') return;
    setSelectedRowId(id);
    setSelectedFixId(null);
  };

  const onSubmit = () => {
    if (phase !== 'playing') return;
    if (!selectedRowId || !selectedFixId) return;
    const rowRight = selectedRowId === puzzle.errorTransactionId;
    const fixRight = selectedFixId === puzzle.correctFixId;
    if (rowRight && fixRight) {
      const frozen = Date.now();
      setTimerFrozenAt(frozen);
      const elapsed = frozen - (timerStart ?? frozen) + penaltyMs;
      setLastSolveMs(elapsed);
      setLastReward(computeReward(elapsed));
      setPhase('solved');
    } else {
      setWrongAttempts((n) => n + 1);
      setPenaltyMs((p) => p + WRONG_PENALTY_MS);
      setSelectedFixId(null);
      setWrongFlash(true);
      if (flashTimeout.current) window.clearTimeout(flashTimeout.current);
      flashTimeout.current = window.setTimeout(() => setWrongFlash(false), 600);
    }
  };

  const onSleep = () => {
    let next = resources;
    if (chosenResource && lastReward > 0) {
      next = grantReward(next, chosenResource, lastReward);
    }
    next = dailyDecay(next);
    setResources(next);
    const starved = isStarved(next);
    if (starved) {
      setStarvedOf(starved);
      setPhase('game-over');
      return;
    }
    setDay((d) => d + 1);
    setChosenResource(null);
    setLastReward(0);
    setLastSolveMs(0);
    setPhase('briefing');
  };

  const onRestart = () => {
    setDay(1);
    setResources(INITIAL_RESOURCES);
    setChosenResource(null);
    setLastReward(0);
    setLastSolveMs(0);
    setStarvedOf(null);
    setPhase('briefing');
  };

  const scheduleRows = useMemo(
    () => [puzzle.openingEntry, ...puzzle.amortizationEntries],
    [puzzle],
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>Frostbalance</h1>
        <p className="tagline">
          Day {day} · The trial balance is the only thing standing between you
          and frostbite.
        </p>
      </header>

      <ResourcePanel resources={resources} highlight={chosenResource} />

      {phase === 'briefing' && (
        <DayBriefing
          day={day}
          resources={resources}
          selected={chosenResource}
          onSelect={setChosenResource}
          onBegin={beginDay}
        />
      )}

      {(phase === 'playing' || phase === 'solved' || phase === 'timeout') && (
        <>
          <section className="card scenario">
            <div className="scenario-header">
              <h2>Today's reconciliation</h2>
              <Timer elapsedMs={elapsedMs} flashing={wrongFlash} />
            </div>
            <p>
              You paid <strong>{puzzle.scenario.vendor}</strong>{' '}
              {fmt(puzzle.scenario.annualAmount)} for a 12-month{' '}
              {puzzle.scenario.itemNoun} on {puzzle.openingEntry.date}. It's{' '}
              now {puzzle.scenario.monthsElapsed} months in. Trial balance:{' '}
              <strong>{fmt(puzzle.trialBalance)}</strong>. Schedule total:{' '}
              <strong>{fmt(puzzle.scheduleBalance)}</strong>. Discrepancy:{' '}
              <strong>{signedFmt(puzzle.discrepancy)}</strong>.
            </p>
            <p className="prompt">
              Find the offending row, then pick the fix.
              {wrongAttempts > 0 && (
                <span className="penalty-note">
                  {' '}
                  Wrong attempts: {wrongAttempts} · −
                  {(wrongAttempts * WRONG_PENALTY_MS) / 1000}s penalty applied.
                </span>
              )}
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
              <p className="hint">Per the GL — source of truth.</p>
            </section>

            <section className={['card', 'schedule', wrongFlash ? 'shake' : ''].join(' ')}>
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
                    const reveal = phase === 'solved' || phase === 'timeout';
                    const showCorrect = reveal && t.id === puzzle.errorTransactionId;
                    return (
                      <tr
                        key={t.id}
                        className={[
                          isOpening ? 'opening' : phase === 'playing' ? 'clickable' : '',
                          isSelected ? 'selected' : '',
                          showCorrect ? 'flag-correct' : '',
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

          {phase === 'playing' && selectedRowId && (
            <section className="card fixes">
              <h2>How do you fix it?</h2>
              <ul>
                {puzzle.fixes.map((f) => {
                  const checked = selectedFixId === f.id;
                  return (
                    <li
                      key={f.id}
                      className={['fix-option', checked ? 'checked' : ''].join(' ')}
                    >
                      <label>
                        <input
                          type="radio"
                          name="fix"
                          value={f.id}
                          checked={checked}
                          onChange={() => setSelectedFixId(f.id)}
                        />
                        {f.label}
                      </label>
                    </li>
                  );
                })}
              </ul>
              <div className="actions">
                <button
                  className="primary"
                  onClick={onSubmit}
                  disabled={!selectedFixId}
                >
                  Submit reconciliation
                </button>
              </div>
            </section>
          )}

          {phase === 'solved' && chosenResource && (
            <section className="card feedback ok">
              <h2>Reconciled in {(lastSolveMs / 1000).toFixed(1)}s.</h2>
              <p>
                You found <strong>{lastReward}</strong>{' '}
                {lastReward === 1 ? 'unit' : 'units'} of{' '}
                <strong>{RESOURCE_LABEL[chosenResource]}</strong>.
              </p>
              <p className="hint">
                Row{' '}
                {scheduleRows.findIndex((r) => r.id === puzzle.errorTransactionId)}{' '}
                was off by {signedFmt(puzzle.discrepancy)}. Correct amount:{' '}
                <strong>{fmt(puzzle.correctAmount)}</strong>.
              </p>
              <div className="actions">
                <button className="primary" onClick={onSleep}>
                  Sleep through the night →
                </button>
              </div>
            </section>
          )}

          {phase === 'timeout' && (
            <section className="card feedback bad">
              <h2>The sun set on your ledger.</h2>
              <p>
                Time ran out. The books never tied. You bring back{' '}
                <strong>nothing</strong>.
              </p>
              <p className="hint">
                The error was on row{' '}
                {scheduleRows.findIndex((r) => r.id === puzzle.errorTransactionId)}
                . Correct amount: <strong>{fmt(puzzle.correctAmount)}</strong>.
              </p>
              <div className="actions">
                <button className="primary" onClick={onSleep}>
                  Trudge home empty-handed →
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {phase === 'game-over' && starvedOf && (
        <section className="card feedback bad game-over">
          <h2>You ran out of {RESOURCE_LABEL[starvedOf].toLowerCase()}.</h2>
          <p>
            You made it <strong>{day}</strong>{' '}
            {day === 1 ? 'day' : 'days'} in the cold with a ledger and a
            pencil. That's something.
          </p>
          <div className="actions">
            <button className="primary" onClick={onRestart}>
              Start over
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
