# KINE 301 Visuomotor Learning Lab

A browser-based motor-learning experiment testing performance under delayed visual cursor feedback and a moving target.

## Experiment structure

- Practice: 2 trials, 0 ms delay, stationary target (not analyzed)
- Baseline: 5 trials, 0 ms delay, stationary target
- Delay: 5 trials, 200 ms cursor delay, stationary target
- Delay + Sway: 5 trials, 200 ms cursor delay, horizontally swaying target
- Restored: 5 trials, 0 ms delay, stationary target

Total: 22 trials, with 20 recorded trials.

## Data recorded

The CSV contains participant ID, phase, trial number, delay, target motion, reaction time, movement time, total trial time, endpoint error, hit/miss, overshoot estimate, path length, and experiment-area dimensions.

## Files

- `index.html` — page structure
- `style.css` — visual design
- `script.js` — experiment logic, cursor-delay buffer, target motion, measurements, and CSV export

## Run locally

Open `index.html` in a modern desktop browser. A mouse is recommended for consistent testing.

## GitHub Pages

In the repository settings, open **Pages**, choose deployment from a branch, select `main` and `/ (root)`, then save. GitHub will provide the public experiment address after deployment.

## Research note

Browser timing, display refresh rate, mouse polling rate, and hardware can add latency. For class data collection, use the same computer, browser, display, and pointing device for all participants when possible.
