import { useMemo } from 'react';
import type { PrepaidPuzzle } from '../../engine/types';
import { fmt, signedFmt } from '../../engine/format';

type Props = {
  puzzle: PrepaidPuzzle;
  selectedRowId: string | null;
  selectedFixId: string | null;
  ruledOut: Set<string>;
  wrongAttempts: number;
  hintsUsed: number;
  hintCost: number;
  wrongPenaltyMs: number;
  fuelAvailable: number;
  onPickRow: (id: string) => void;
  onPickFix: (id: string) => void;
  onUseHint: () => void;
  onSubmit: () => void;
};

export function PrepaidPuzzleView({
  puzzle,
  selectedRowId,
  selectedFixId,
  ruledOut,
  wrongAttempts,
  hintsUsed,
  hintCost,
  wrongPenaltyMs,
  fuelAvailable,
  onPickRow,
  onPickFix,
  onUseHint,
  onSubmit,
}: Props) {
  const scheduleRows = useMemo(
    () => [puzzle.openingEntry, ...puzzle.amortizationEntries],
    [puzzle],
  );

  return (
    <>
      <section className="pane">
        <div className="section-head">
          <span className="section-head-title">Today's Reconciliation</span>
          <span className="section-head-meta">
            GL · {puzzle.scenario.prepaidAccount} · {puzzle.scenario.vendor}
            {puzzle.totalErrors > 1 && (
              <> · <b>FINAL AUDIT · Error {puzzle.currentErrorIndex + 1}/{puzzle.totalErrors}</b></>
            )}
          </span>
        </div>

        <div className="trial">
          <div className="trial-grid">
            <span className="trial-acc">{puzzle.scenario.prepaidAccount}</span>
            <span className="trial-amt">{fmt(puzzle.trialBalance)}</span>
            <span className="trial-acc">{puzzle.scenario.expenseAccount}</span>
            <span className="trial-amt">
              {fmt((puzzle.scenario.annualAmount / puzzle.scenario.monthsTotal) * puzzle.scenario.monthsElapsed)}
            </span>
          </div>
          <div className="trial-note">Trial Balance · Source of truth</div>
        </div>

        <p className="scenario-brief">
          Paid <b>{fmt(puzzle.scenario.annualAmount)}</b> for a {puzzle.scenario.monthsTotal}-month{' '}
          {puzzle.scenario.itemNoun} on {puzzle.openingEntry.date}. Now{' '}
          <b>{puzzle.scenario.monthsElapsed} months in</b>. Schedule and ledger disagree.
          {wrongAttempts > 0 && (
            <span className="penalty-note">
              · {wrongAttempts} wrong · −{(wrongAttempts * wrongPenaltyMs) / 1000}s
            </span>
          )}
        </p>

        <table className="sched">
          <thead>
            <tr>
              <th style={{ width: 36 }}>#</th>
              <th style={{ width: 110 }}>Date</th>
              <th>Description</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {scheduleRows.map((t, i) => {
              const isOpening = i === 0;
              const isSelected = selectedRowId === t.id;
              const isRuledOut = ruledOut.has(t.id);
              const clickable = !isOpening && !isRuledOut;
              return (
                <tr
                  key={t.id}
                  className={[
                    isOpening ? 'opening' : clickable ? 'clickable' : '',
                    isSelected ? 'selected' : '',
                    isRuledOut ? 'ruled-out' : '',
                  ].join(' ')}
                  onClick={() => clickable && onPickRow(t.id)}
                >
                  <td>{isOpening ? '—' : i}</td>
                  <td>{t.date}</td>
                  <td>
                    {t.description}
                    {isRuledOut && <span className="ruled-tag"> ✓ clean</span>}
                  </td>
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
          </tbody>
        </table>

        <div className="discrep">
          <span className="discrep-label">
            Schedule {fmt(puzzle.scheduleBalance)} − Trial {fmt(puzzle.trialBalance)} · Discrepancy
          </span>
          <span className="discrep-value">{signedFmt(puzzle.discrepancy)}</span>
        </div>
      </section>

      <section className="pane">
        <div className="section-head">
          <span className="section-head-title">How do you fix it?</span>
          <span className="section-head-meta">
            {selectedRowId ? 'Choose 01' : 'Select a row first'}
          </span>
        </div>

        <p className="scenario-brief" style={{ marginTop: 0 }}>
          {selectedRowId
            ? <>Flagged: row{' '}
                <b>{scheduleRows.findIndex((r) => r.id === selectedRowId)}</b>{' '}
                · {scheduleRows.find((r) => r.id === selectedRowId)?.date}</>
            : 'Click the offending row in the schedule on the left.'}
        </p>

        <div className="fixes">
          {puzzle.fixes.map((f) => (
            <button
              key={f.id}
              type="button"
              className={['fix-option', selectedFixId === f.id ? 'checked' : ''].join(' ')}
              onClick={() => onPickFix(f.id)}
              disabled={!selectedRowId}
            >
              <div className="radio" />
              <div>
                <div className="fix-option-text">{f.label}</div>
              </div>
            </button>
          ))}
        </div>

        {puzzle.hintsAllowed > 0 && (
          <div className="hint-bar">
            <button
              type="button"
              className="hint-button"
              onClick={onUseHint}
              disabled={hintsUsed >= puzzle.hintsAllowed || fuelAvailable < hintCost}
            >
              Burn a log · hint ({hintsUsed}/{puzzle.hintsAllowed})
            </button>
            <span className="hint-explainer">
              Costs {hintCost} fuel · rules out a clean row.
            </span>
          </div>
        )}

        <div className="btn-row">
          <button
            className="btn"
            onClick={onSubmit}
            disabled={!selectedRowId || !selectedFixId}
          >
            <span>Submit Reconciliation</span>
            <span className="arrow">↵</span>
          </button>
          <div className="btn-row-caption">
            Field guide · Discrepancies under $1 may still mean a math fault.
          </div>
        </div>
      </section>
    </>
  );
}
