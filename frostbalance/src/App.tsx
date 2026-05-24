import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { advanceToNextError, generatePuzzle } from './engine/generator';
import { journalEntry } from './engine/journal';
import { unlockedLocations } from './engine/locations';
import type { Puzzle } from './engine/types';
import { fmt, signedFmt } from './engine/format';
import type { Resource, Tier } from './engine/survival';
import {
  HINT_FUEL_COST,
  INITIAL_RESOURCES,
  RESOURCE_LABEL,
  RESOURCE_BLURB,
  RESOURCES,
  TIER_CONFIGS,
  WRONG_PENALTY_MS,
  computeReward,
  dailyDecay,
  grantReward,
  isStarved,
  tierForDay,
} from './engine/survival';
import { InventoryStrip } from './components/InventoryStrip';
import { DuskMeter } from './components/DuskMeter';
import { SettingsModal } from './components/SettingsModal';
import { GlossaryModal } from './components/GlossaryModal';
import { IntroModal } from './components/IntroModal';
import {
  loadSettings,
  loadTodaysBest,
  markIntroSeen,
  recordSolve,
  saveSettings,
  introSeen,
  type Settings,
} from './settings';
import {
  ensureAudioReady,
  playEurekaChime,
  playHintBurn,
  playIceTap,
  playSleepWhoosh,
  playTick,
  playTimeoutHorn,
  playWrongThunk,
} from './audio/sfx';
import { setMusicDucked, setMusicMuted, setMusicState, setMusicVolume } from './audio/music';
import { setSfxMuted, setSfxVolume } from './audio/sfx';
import './App.css';

type Phase = 'briefing' | 'playing' | 'solved' | 'timeout' | 'game-over';

const padTwo = (n: number): string => String(n).padStart(2, '0');

const docNumber = (day: number): string =>
  `FB-2027-${String(day).padStart(3, '0')}`;

const weatherLabel = (day: number): { label: string; temp: number } => {
  // Cosmetic: cycle through a couple of cold weathers
  const cycle = ['SNOW', 'CLEAR', 'BLIZZARD', 'SLEET'];
  const temp = -(8 + ((day * 3) % 14));
  return { label: cycle[day % cycle.length], temp };
};

function App() {
  const [day, setDay] = useState(1);
  const [resources, setResources] = useState(INITIAL_RESOURCES);
  const [phase, setPhase] = useState<Phase>('briefing');
  const [chosenResource, setChosenResource] = useState<Resource | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle(1, 1));

  // Settings + onboarding
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [showIntro, setShowIntro] = useState<boolean>(() => !introSeen());
  const [showSettings, setShowSettings] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [todaysBest, setTodaysBest] = useState(() => loadTodaysBest());
  const [newRecord, setNewRecord] = useState(false);

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedFixId, setSelectedFixId] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [ruledOut, setRuledOut] = useState<Set<string>>(new Set());
  const [hintsUsed, setHintsUsed] = useState(0);

  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [timerFrozenAt, setTimerFrozenAt] = useState<number | null>(null);
  const [penaltyMs, setPenaltyMs] = useState(0);
  const [nowTick, setNowTick] = useState(0);

  const [lastReward, setLastReward] = useState(0);
  const [lastSolveMs, setLastSolveMs] = useState(0);
  const [starvedOf, setStarvedOf] = useState<Resource | null>(null);

  const flashTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = window.setInterval(() => setNowTick((n) => n + 1), 100);
    return () => window.clearInterval(id);
  }, [phase]);

  // Apply settings: persist, push to audio engines, toggle body classes.
  useEffect(() => {
    saveSettings(settings);
    setSfxVolume(settings.audioVolume);
    setMusicVolume(settings.audioVolume * 0.3);
    setSfxMuted(settings.audioMuted);
    setMusicMuted(settings.audioMuted);
    const cls = document.body.classList;
    cls.toggle('dyslexia-font', settings.dyslexiaFont);
    cls.toggle('high-contrast', settings.highContrast);
    cls.toggle('reduced-motion', settings.reducedMotion);
  }, [settings]);

  const elapsedMs = useMemo(() => {
    if (timerStart === null) return 0;
    const ref = timerFrozenAt ?? Date.now();
    return ref - timerStart + penaltyMs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerStart, timerFrozenAt, penaltyMs, nowTick]);

  const currentTier: Tier = tierForDay(day);
  const tierConfig = TIER_CONFIGS[currentTier];

  useEffect(() => {
    if (phase === 'briefing') setMusicState('briefing');
    else if (phase === 'playing') setMusicState('playing');
    else if (phase === 'solved') setMusicState('solved');
    else if (phase === 'timeout') setMusicState('briefing');
    else if (phase === 'game-over') setMusicState('gameover');
  }, [phase]);

  const lastTickSecond = useRef<number>(-1);
  useEffect(() => {
    if (phase !== 'playing') {
      lastTickSecond.current = -1;
      setMusicDucked(false);
      return;
    }
    const remaining = puzzle.timeLimitMs - elapsedMs;
    const inFinalStretch = remaining > 0 && remaining <= 10_000;
    setMusicDucked(inFinalStretch);
    if (!inFinalStretch) {
      lastTickSecond.current = -1;
      return;
    }
    const currentSecond = Math.ceil(remaining / 1000);
    if (currentSecond !== lastTickSecond.current) {
      lastTickSecond.current = currentSecond;
      playTick();
    }
  }, [phase, elapsedMs, puzzle.timeLimitMs]);

  useEffect(() => {
    if (phase === 'playing' && elapsedMs >= puzzle.timeLimitMs) {
      setTimerFrozenAt(Date.now());
      setLastSolveMs(puzzle.timeLimitMs);
      setLastReward(0);
      setPhase('timeout');
      playTimeoutHorn();
    }
  }, [phase, elapsedMs, puzzle.timeLimitMs]);

  const beginDay = useCallback(() => {
    if (!chosenResource) return;
    ensureAudioReady();
    setPuzzle(generatePuzzle(currentTier, day));
    setSelectedRowId(null);
    setSelectedFixId(null);
    setWrongAttempts(0);
    setRuledOut(new Set());
    setHintsUsed(0);
    setPenaltyMs(0);
    setTimerFrozenAt(null);
    setTimerStart(Date.now());
    setPhase('playing');
  }, [chosenResource, currentTier, day]);

  const onPickRow = (id: string) => {
    if (phase !== 'playing') return;
    if (ruledOut.has(id)) return;
    setSelectedRowId(id);
    setSelectedFixId(null);
    playIceTap();
  };

  const onPickFix = (id: string) => {
    setSelectedFixId(id);
    playIceTap();
  };

  const onUseHint = () => {
    if (phase !== 'playing') return;
    if (hintsUsed >= puzzle.hintsAllowed) return;
    if (resources.fuel < HINT_FUEL_COST) return;
    const candidates = puzzle.amortizationEntries
      .map((t) => t.id)
      .filter((id) => id !== puzzle.errorTransactionId && !ruledOut.has(id));
    if (candidates.length === 0) return;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    setRuledOut((prev) => {
      const next = new Set(prev);
      next.add(target);
      return next;
    });
    setHintsUsed((n) => n + 1);
    setResources((r) => ({ ...r, fuel: r.fuel - HINT_FUEL_COST }));
    if (selectedRowId === target) {
      setSelectedRowId(null);
      setSelectedFixId(null);
    }
    playHintBurn();
  };

  const onSubmit = () => {
    if (phase !== 'playing') return;
    if (!selectedRowId || !selectedFixId) return;
    const rowRight = selectedRowId === puzzle.errorTransactionId;
    const fixRight = selectedFixId === puzzle.correctFixId;
    if (rowRight && fixRight) {
      if (puzzle.pendingErrors.length > 0) {
        setPuzzle((p) => advanceToNextError(p));
        setSelectedRowId(null);
        setSelectedFixId(null);
        playIceTap();
        return;
      }
      const frozen = Date.now();
      setTimerFrozenAt(frozen);
      const elapsed = frozen - (timerStart ?? frozen) + penaltyMs;
      setLastSolveMs(elapsed);
      setLastReward(computeReward(elapsed, puzzle.timeLimitMs, tierConfig.rewardBonus));
      setPhase('solved');
      playEurekaChime();
      const improved = recordSolve(elapsed, puzzle.tier, day);
      setNewRecord(improved);
      if (improved) setTodaysBest({ timeMs: elapsed, tier: puzzle.tier, day });
    } else {
      setWrongAttempts((n) => n + 1);
      setPenaltyMs((p) => p + WRONG_PENALTY_MS);
      setSelectedFixId(null);
      if (flashTimeout.current) window.clearTimeout(flashTimeout.current);
      flashTimeout.current = window.setTimeout(() => {}, 600);
      playWrongThunk();
    }
  };

  const onSleep = () => {
    playSleepWhoosh();
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
    setNewRecord(false);
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

  // Preview the resource math that onSleep will apply. Decay clamps at 0,
  // so a resource already at zero contributes nothing to the loss tally.
  const sleepPreview = useMemo(() => {
    let next = resources;
    if (chosenResource && lastReward > 0) {
      next = grantReward(next, chosenResource, lastReward);
    }
    const afterReward = next;
    next = dailyDecay(next);
    const beforeTotal = Object.values(resources).reduce((s, v) => s + v, 0);
    const afterTotal = Object.values(next).reduce((s, v) => s + v, 0);
    const decayLoss = RESOURCES.reduce(
      (s, r) => s + Math.min(afterReward[r], 1),
      0,
    );
    return { net: afterTotal - beforeTotal, decayLoss };
  }, [resources, chosenResource, lastReward]);

  const weather = weatherLabel(day);
  const locations = unlockedLocations(day);
  const totalSec = Math.ceil(Math.max(0, puzzle.timeLimitMs - elapsedMs) / 1000);

  return (
    <div className="app">
      {/* Modals */}
      {showIntro && (
        <IntroModal
          onDismiss={() => { markIntroSeen(); setShowIntro(false); }}
          onOpenGlossary={() => setShowGlossary(true)}
        />
      )}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showGlossary && <GlossaryModal onClose={() => setShowGlossary(false)} />}

      {/* Registration marks */}
      <div className="regmark tl" aria-hidden="true" />
      <div className="regmark tr" aria-hidden="true" />
      <div className="regmark bl" aria-hidden="true" />
      <div className="regmark br" aria-hidden="true" />

      {/* CHROME */}
      <header className="chrome">
        <div className="wordmark">
          <span className="wordmark-mark">Frost—Balance</span>
          <span className="wordmark-sub">A Cold Ledger</span>
        </div>
        <div className="day-stamp">
          <span>Day</span>
          <span className="day-stamp-n">{padTwo(day)}</span>
        </div>
        <div className="chrome-meta">
          <span className={`weather ${weather.label.toLowerCase()}`}>
            <span className="weather-sw" />
            <span>{weather.label} · {weather.temp}°</span>
          </span>
          <span>Phase · <b>{phase === 'briefing' ? 'LAUNCH' : phase === 'playing' ? 'AUDIT' : phase === 'solved' ? 'CLOSE' : phase === 'timeout' ? 'DUSK' : 'COLD'}</b></span>
          <span>Doc № <b>{docNumber(day)}</b></span>
        </div>
      </header>

      {/* INVENTORY */}
      <InventoryStrip resources={resources} highlight={chosenResource} />

      {/* BODY */}
      {phase === 'briefing' && (
        <main className="app-body launch">
          <section className="pane">
            <div className="hero">
              <div className="hero-kicker">
                <span className="dot" />
                <span>Day {padTwo(day)} · Tier {currentTier} — {tierConfig.label}</span>
              </div>
              <h1>
                What are you<br />
                <em>foraging for?</em>
              </h1>
              <p className="journal">"{journalEntry(day)}"</p>
              <p className="hero-blurb">
                Reconcile the books to bring back supplies. Faster solves bring back more.
                Everything ticks down at dusk.
              </p>
              {todaysBest && (
                <p className="best-record">
                  Fastest reconciliation today:{' '}
                  <strong>{(todaysBest.timeMs / 1000).toFixed(1)}s</strong>
                  {' '}— Tier {todaysBest.tier}, day {todaysBest.day}.
                </p>
              )}
              <div className="resource-choices">
                {RESOURCES.map((r) => {
                  const v = resources[r];
                  return (
                    <button
                      key={r}
                      type="button"
                      className={[
                        'resource-choice',
                        chosenResource === r ? 'chosen' : '',
                        v <= 2 ? 'urgent' : '',
                      ].join(' ')}
                      onClick={() => setChosenResource(r)}
                    >
                      <span className="resource-choice-head">
                        <span>{RESOURCE_LABEL[r]}</span>
                        <span className="resource-choice-count">have {padTwo(v)}</span>
                      </span>
                      <span className="resource-choice-blurb">{RESOURCE_BLURB[r]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
          <section className="pane">
            <div className="sites-header">
              <span className="sites-title">Sites you can scavenge today</span>
              <span className="sites-count">{locations.length} found</span>
            </div>
            <ul className="sites-list">
              {locations.map((loc, i) => (
                <li className="site" key={loc.id}>
                  <span className="site-num">S-{padTwo((i + 1) * 4 + 3)}</span>
                  <div>
                    <div className="site-title">{loc.name}</div>
                    <div className="site-desc">{loc.blurb}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="btn-row">
              <button
                className="btn"
                disabled={!chosenResource}
                onClick={beginDay}
              >
                <span>
                  Begin the day{chosenResource ? ` · forage ${RESOURCE_LABEL[chosenResource]}` : ''}
                </span>
                <span className="arrow">→</span>
              </button>
              <div className="btn-row-caption">
                {chosenResource ? 'Hold steady. Sign here when ready.' : 'Pick a resource on the left to proceed.'}
              </div>
            </div>
          </section>
        </main>
      )}

      {phase === 'playing' && (
        <main className="app-body puzzle">
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
                  · {wrongAttempts} wrong · −{(wrongAttempts * WRONG_PENALTY_MS) / 1000}s
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
                  disabled={hintsUsed >= puzzle.hintsAllowed || resources.fuel < HINT_FUEL_COST}
                >
                  Burn a log · hint ({hintsUsed}/{puzzle.hintsAllowed})
                </button>
                <span className="hint-explainer">
                  Costs {HINT_FUEL_COST} fuel · rules out a clean row.
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
        </main>
      )}

      {(phase === 'solved' || phase === 'timeout') && (
        <main className="app-body feedback">
          <div className="result">
            <div className="result-head">
              <div>
                <div className="result-eyebrow">
                  Day {padTwo(day)} · {phase === 'solved' ? 'Closing' : 'Sunset'}
                </div>
                <div className={['result-verdict', phase === 'timeout' ? 'bad' : ''].join(' ')}>
                  Books<br />
                  <em>{phase === 'solved' ? 'balanced.' : 'open.'}</em>
                </div>
                {newRecord && <p className="new-record">★ New fastest today</p>}
              </div>
              <div className="result-eyebrow" style={{ textAlign: 'right' }}>
                {phase === 'solved' ? 'Filed at' : 'Walked away at'}<br />
                <b>{(lastSolveMs / 1000).toFixed(1)}s on the ledger</b>
              </div>
            </div>

            <div className="result-body">
              <div className="receipt">
                <div className="recv">
                  <h3 className="recv-title">Reconciliation Receipt</h3>
                  <div className="recv-line">
                    <span>Schedule reconciled</span>
                    <span className="v">{phase === 'solved' ? '✓ closed' : '✗ unresolved'}</span>
                  </div>
                  <div className="recv-line">
                    <span>Time on the ledger</span>
                    <span className="v">{(lastSolveMs / 1000).toFixed(1)}s</span>
                  </div>
                  <div className="recv-line">
                    <span>Error row</span>
                    <span className="v">
                      {phase === 'solved' || phase === 'timeout'
                        ? `row ${scheduleRows.findIndex((r) => r.id === puzzle.errorTransactionId)}`
                        : '—'}
                    </span>
                  </div>
                  <div className="recv-line">
                    <span>Correct amount</span>
                    <span className="v">{fmt(puzzle.correctAmount)}</span>
                  </div>
                  <div className="recv-line">
                    <span>Site</span>
                    <span className="v">{puzzle.locationName}</span>
                  </div>
                </div>

                <div className="recv">
                  <h3 className="recv-title">Supplies Returned</h3>
                  {chosenResource && (
                    <div className="recv-line">
                      <span>{RESOURCE_LABEL[chosenResource]}</span>
                      <span className={['v', lastReward > 0 ? 'up' : 'down'].join(' ')}>
                        {lastReward > 0 ? `+${lastReward}` : '0'}
                      </span>
                    </div>
                  )}
                  <div className="recv-line">
                    <span>Daily decay</span>
                    <span className="v down">−{sleepPreview.decayLoss}</span>
                  </div>
                  <div className="recv-total">
                    <span>Net to stores</span>
                    <span className={['v', sleepPreview.net >= 0 ? 'up' : 'down'].join(' ')}>
                      {sleepPreview.net > 0 ? '+' : ''}{sleepPreview.net}
                    </span>
                  </div>
                </div>
              </div>

              <div className="field-note">
                {phase === 'solved'
                  ? '— The town goes to sleep. The frost does not. —'
                  : '— The numbers will not warm you. —'}
              </div>

              <button className="btn" onClick={onSleep}>
                <span>Sleep · wake on Day {padTwo(day + 1)}</span>
                <span className="arrow">→</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {phase === 'game-over' && starvedOf && (
        <main className="app-body gameover">
          <div className="result">
            <div className="result-head">
              <div>
                <div className="result-eyebrow">Day {padTwo(day)} · Final entry</div>
                <div className="result-verdict bad">
                  Out of<br />
                  <em>{RESOURCE_LABEL[starvedOf].toLowerCase()}.</em>
                </div>
              </div>
              <div className="result-eyebrow" style={{ textAlign: 'right' }}>
                Survived<br /><b>{day} days</b>
              </div>
            </div>
            <div className="result-body">
              <p className="hero-blurb" style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center' }}>
                You made it {day} {day === 1 ? 'day' : 'days'} in the cold with a ledger and a pencil.
                That's something.
              </p>
              <button className="btn" onClick={onRestart}>
                <span>Start over</span>
                <span className="arrow">↻</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* FOOTER */}
      {phase === 'playing' ? (
        <DuskMeter elapsedMs={elapsedMs} limitMs={puzzle.timeLimitMs} />
      ) : (
        <nav className="app-nav">
          <button type="button" className="nav-link" onClick={() => setShowGlossary(true)}>
            ◾ Field Guide
          </button>
          <button type="button" className="nav-link" onClick={() => setShowSettings(true)}>
            Preferences ◾
          </button>
        </nav>
      )}

      {/* Suppress no-unused warnings */}
      {false && <span>{totalSec}</span>}
    </div>
  );
}

export default App;
