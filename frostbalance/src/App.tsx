import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { advancePrepaidPuzzle, generatePuzzle } from './engine/generator';
import { PrepaidPuzzleView } from './components/puzzles/PrepaidPuzzleView';
import { journalEntry } from './engine/journal';
import { unlockedLocations } from './engine/locations';
import type { Puzzle } from './engine/types';
import { fmt } from './engine/format';
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
import { SnowParticles, type WeatherKind } from './components/SnowParticles';
import { SettingsModal } from './components/SettingsModal';
import { GlossaryModal } from './components/GlossaryModal';
import { IntroModal } from './components/IntroModal';
import { CreditsModal } from './components/CreditsModal';
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

const weatherLabel = (day: number): { label: WeatherKind; temp: number } => {
  const cycle: WeatherKind[] = ['SNOW', 'CLEAR', 'BLIZZARD', 'SLEET'];
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
  const [showCredits, setShowCredits] = useState(false);
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
        setPuzzle((p) => advancePrepaidPuzzle(p));
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

  // Receipt math, scoped to today's foraged resource only. Other resources
  // decay by 1 behind the scenes; their new values surface on the next
  // launch page's inventory strip.
  const sleepPreview = useMemo(() => {
    if (!chosenResource) return { earned: 0, decay: 1, net: -1, ending: 0 };
    const beginning = resources[chosenResource];
    const earned = lastReward;
    const decay = 1;
    const ending = Math.max(0, beginning + earned - decay);
    return { earned, decay, net: earned - decay, ending };
  }, [resources, chosenResource, lastReward]);

  const weather = weatherLabel(day);
  const locations = unlockedLocations(day);
  const totalSec = Math.ceil(Math.max(0, puzzle.timeLimitMs - elapsedMs) / 1000);

  const snowIntensity = phase === 'playing'
    ? Math.max(0, Math.min(1, elapsedMs / puzzle.timeLimitMs))
    : 0;

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
      {showCredits && <CreditsModal onClose={() => setShowCredits(false)} />}

      <SnowParticles
        weather={weather.label}
        intensity={snowIntensity}
        reducedMotion={settings.reducedMotion}
      />

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
          {puzzle.kind === 'prepaid' && (
            <PrepaidPuzzleView
              puzzle={puzzle}
              selectedRowId={selectedRowId}
              selectedFixId={selectedFixId}
              ruledOut={ruledOut}
              wrongAttempts={wrongAttempts}
              hintsUsed={hintsUsed}
              hintCost={HINT_FUEL_COST}
              wrongPenaltyMs={WRONG_PENALTY_MS}
              fuelAvailable={resources.fuel}
              onPickRow={onPickRow}
              onPickFix={onPickFix}
              onUseHint={onUseHint}
              onSubmit={onSubmit}
            />
          )}
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
                  <h3 className="recv-title">
                    {chosenResource ? `${RESOURCE_LABEL[chosenResource]} ledger` : 'Today\'s ledger'}
                  </h3>
                  {chosenResource && (
                    <>
                      <div className="recv-line">
                        <span>Beginning</span>
                        <span className="v">{resources[chosenResource]}</span>
                      </div>
                      <div className="recv-line">
                        <span>Earned today</span>
                        <span className={['v', sleepPreview.earned > 0 ? 'up' : ''].join(' ')}>
                          {sleepPreview.earned > 0 ? `+${sleepPreview.earned}` : '0'}
                        </span>
                      </div>
                      <div className="recv-line">
                        <span>Daily decay</span>
                        <span className="v down">−{sleepPreview.decay}</span>
                      </div>
                      <div className="recv-total">
                        <span>Ending {RESOURCE_LABEL[chosenResource].toLowerCase()}</span>
                        <span className="v">{sleepPreview.ending}</span>
                      </div>
                    </>
                  )}
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
          <button type="button" className="nav-link credits-link-btn" onClick={() => setShowCredits(true)}>
            Credits
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
