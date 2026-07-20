# Two Puzzles

Matchstick Math and the 24 Game in one self-contained HTML file.

- **Matchstick Math** — move one or two sticks to turn a false equation true.
  380 puzzles across three tiers plus a daily.
- **24 Game** — combine four cards with + − × ÷ to make 24. 380 hands.

Both track a timer, 3-star scoring and a shared daily streak.

## Run it

Open `index.html` in any browser, or serve it:

    python3 -m http.server 8000

## Develop

    ./run-tests.sh          # all suites, ~90s
    ./run-tests.sh --all    # plus the exhaustive puzzle re-verification

See `CLAUDE.md` for architecture, invariants and the backlog.
