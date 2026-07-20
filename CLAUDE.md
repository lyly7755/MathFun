# Math Fun — Matchstick Math + 24 Game

A single self-contained HTML file. No build step, no bundler, no runtime dependencies.
`index.html` is the whole app: markup, CSS and JS inlined so it runs offline from
`file://` or any static host.

## Layout

    index.html          the entire app (~56 KB)
    run-tests.sh        every suite; `--all` adds the slow exhaustive one
    tests/*.js          Node suites that eval the real <script> from index.html
    tests/dom.js        fake DOM that parses index.html for real attributes
    tools/*.py          puzzle generators + solvers (build-time only, not shipped)
    data/*.json         exhaustive solver output the shipped puzzles came from

## Running

    ./run-tests.sh          # ~90s
    ./run-tests.sh --all    # adds reverify (exhaustive, ~3 min)
    python3 -m http.server 8000    # then open http://localhost:8000 (Windows: use `python` instead if python3 isn't installed)

## Invariants — break these and the game lies to the player

1. **No `eval()` or `new Function()`.** A CSP once blocked `Function()` in the win
   check; it threw, the `catch` swallowed it, and every correct answer was rejected.
   `evalSide()` is a hand-written parser. Keep it that way.

2. **Time comes from timestamps, never accumulated by `setInterval`.** In one
   environment the interval callback never fired, so elapsed time read as zero and
   every solve scored 3 stars. `draw()` repaints the clock on each interaction, so
   the display and the star award stay correct with dead timers.
   Guarded by `tests/deadtimer.js`.

3. **Stars are keyed by puzzle text, not index** (`stars["8+2=6"]`, `stars["24:3,3,8,8"]`).
   Packs can be reordered or rebalanced without reassigning anyone's progress.
   Guarded by `tests/order.js`, which reverses a pack and checks the stars follow.

4. **24-game arithmetic is exact rationals.** `3 3 8 8` has one solution,
   `8/(3-8/3)`; in floats that lands on 24.000000000000004 and the win check fails.
   `fr/fAdd/fSub/fMul/fDiv` only. Never `Number`.

5. **Move-count labels must stay honest.** No matchstick puzzle advertised as
   "2 sticks" may be solvable in 1. `tests/reverify.js` exhaustively re-derives this
   from the shipped digit table — rerun it after ANY change to `MASK2D` or `SEG`.

6. **Loose digit readings are deliberate.** A slot showing only verticals reads as
   the 1s it forms: `bc`→1, `ef`→1, `bcef`→11. A player who builds `16-5=11` has
   genuinely solved it. Rejecting that was a real bug. See `tests/loosecheck.js`.

## Testing philosophy — read this before writing a test

Suites `eval` the actual `<script>` out of `index.html` and drive the real event
handlers. Do not reimplement game logic in a test; that only tests the copy.

**Three separate real bugs shipped because a fake DOM was more forgiving than a
browser.** Every one was invisible to the tests by construction:

- `querySelectorAll` was hard-coded to return three tier buttons, so it missed that
  `.tier` also matched the Daily button and clobbered its handler. Daily did nothing.
- The stub kept only the last `addEventListener`, so once the app registered three
  listeners, taps meant for the board went to the operator row.
- An attribute regex excluded digits, so `data-t24` silently vanished.

`tests/dom.js` now parses `index.html` for real attributes and matches selectors
properly. When a test needs the DOM to do something new, extend `dom.js` to match
the browser — never loosen the assertion.

## Where the puzzles came from

Nothing is hand-written. `tools/` exhaustively enumerated both spaces:

- Matchstick: 3,839 verified puzzles → 2,082 passing quality filters (unique
  solution, no leading zeros, a real digit change) → 380 shipped.
  Tiers ordered by measured difficulty (`tools/calibrate.py`): decoy count 0.40,
  digits changed 0.25, cross-slot 0.20, operator flip 0.15, valid midpoint −0.20.
  Spearman correlation of level number vs decoy count is 0.78–0.86.
  `branch` was tried and dropped — it counted empty slots, so it tracked EASY puzzles.
- 24 game: 1,362 solvable hands of 1,820 → tiered by solution count
  (Easy 20+, Medium 4–19, Hard ≤3) → 380 shipped.

## Known gaps / backlog

- **Not installable.** No manifest, icons or service worker; "Add to Home Screen"
  gives a bookmark and there is no offline support when served from a URL.
- **Android back button exits** mid-puzzle instead of returning to the menu.
  Needs `history.pushState` per screen + a `popstate` handler.
- **No animation, haptics or sound.** Sticks and cards teleport.
- **Accessibility:** `user-scalable=no` blocks pinch-zoom; smallest text is 10.5px;
  hint/error/win are signalled by colour alone with no shape or text backup.
- **Hints assume the canonical answer.** On the 38 multi-answer puzzles, starting
  down a different valid path yields "too far from the answer" rather than guidance.
  Fix: search for the nearest reachable solution from the current board.
- **Sticks are confined to their slot's seven positions.** A free-form rearrangement
  (sliding a stick into the gap between slots) can't be expressed. Widening this
  means re-solving against a positional grid, then rerunning `tests/reverify.js`.

## Conventions

- Plain ES5-style `var`/`function` in the app so it runs on older mobile browsers.
- Two-space indent, single quotes in JS.
- Comments explain *why*, especially where something looks wrong but isn't.
- Any new puzzle data must be machine-verified before shipping. No hand-entered answers.
