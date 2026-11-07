# Schnabelglück · Schwarm & Schatz

A small, standalone experiment, published independently from the existing game.

**Test site:** https://tidyeval.github.io/schnabelglueck-playground/

**Existing game, unchanged:** https://tidyeval.github.io/schnabel-voll-glueck/

Hold the screen or Space to dive; release to rise. Fish schools stay together, separate from close neighbours, and flee Pip and the shark. Above the reef is a free passage. Under it are three treasure fish and an air bubble; collecting all three and completing the tunnel awards a 100-point bonus. The course lasts about 39 seconds. Demonstrations for both routes are available in the menu; pressing the screen or Space takes over control. Pause also happens on focus loss.

## Isolation

This project has its own Git repository, dependencies, deployment workflow and GitHub Pages URL. It has no runtime imports from sibling projects and does not read or write saved games, localStorage or service workers. The GitHub workflow deploys only this repository's `dist` artifact. No custom domain or account-level Pages configuration is changed.

The copied original artwork modules in `src/original` are unchanged snapshots from `tidyeval/schnabel-voll-glueck`; their source revision and hashes are in `provenance.json`. The experiment uses exported Pip/fish drawing functions, baked into animation textures at startup. The other copied modules satisfy their original imports; production bundling removes unused exports. No audio tracks, private files or original Git history are included.

## Development and checking

```sh
npm ci
npm run dev
npx playwright install chromium webkit
./check
```

Vite serves development on port 5199 and production preview on 4199. `PAGES_BASE=/schnabelglueck-playground/ npm run build` builds the project Pages path. To test a deployed site, use `PLAYGROUND_URL=https://tidyeval.github.io/schnabelglueck-playground/ npm run test:browser`.

The eight model checks cover both complete routes at 60/120 Hz, player-triggered school reactions, air depletion/recovery, reef contact and invalid steps. Browser tests cover both demonstrations, pause/restart, real keyboard hold/release, pointer hold, focus-loss pause and a narrow touch layout in Chromium and WebKit. `window.playground.snapshot()` exposes read-only cloned observations for tests; it is not a way to set simulation state.

## Deliberate limits

This is a prototype, not a port or replacement of the original game. It has one route, no persistent progress, soundtrack, installation/offline mode or native app. The swim response uses the original hold/release target speeds but omits tricks, cargo drag and the original game's stage progression. Phaser handles rendering and input; schooling, swimming and the small set of interaction rules live in a browser-independent model. Model tests prove that the demonstrations are finishable, not that human input or game feel is ideal. Physical-phone performance and human playtesting remain open.
