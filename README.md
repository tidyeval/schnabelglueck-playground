# Schnabelglück · Schwarm & Schatz

An independent six-feature experiment, published separately from the existing game.

**Test site:** https://tidyeval.github.io/schnabelglueck-playground/

**Existing game, unchanged:** https://tidyeval.github.io/schnabel-voll-glueck/

Hold the screen or Space to dive; release to rise. Choose **Alle Stationen & Schatz vorführen** to watch the complete route; touching the canvas or pressing Space takes control. A run takes roughly 45–50 seconds. Pause also happens on focus loss.

## Six playable ideas

- Schools maintain their leftward swimming direction, avoid neighbours and dodge Pip and sharks vertically with a gently changing heading.
- A visibly changing water level opens the tide passage at low tide. Pip can wait at the entrance or fly above it. A passage already entered stays open until Pip is through.
- Rescue a turtle from plants near the beginning by swimming close. Later it reveals a safe fish trail and an air bubble; without the rescue this reward stays hidden.
- Choose the safe upper route or dive beneath the reef for three treasure fish, an air bubble and a 100-point completion bonus. A fuller pouch slightly slows upward swimming.
- A shark scatters a school, then a boat blocks surfacing, followed by a longer recovery stretch before the treasure branch.
- Everyone gets the same dated arrangement and tide phase, using the Europe/Berlin calendar. Only the personal best for that day is stored in a playground-specific localStorage key. There is no online leaderboard or account.

The six cards below the canvas show which ideas have been experienced. Both demonstrations visit the rescue and its return reward; the safe demonstration bypasses the tide gate and treasure cave, while the treasure demonstration enters both.

## Artwork and isolation

Phaser owns the scene, input and update loop. Its Canvas renderer calls the original continuous vector drawing functions directly at up to 2× pixel density: Pip's wing/tail/blink/beak/pouch animation, fish tails, shark, boat, turtle, layered coast, waves, light rays, plants and splash/catch effects. The previous baked 8/6-frame animations and simplified backdrop have been removed. The new reef/gate/rescue indicators are prototype artwork.

This project has its own Git repository, dependencies, deployment workflow and Pages URL. It has no runtime imports from sibling projects, no service worker and no access to their saved games. Its only storage keys start with `schnabel-playground-six:best:`; blocked storage leaves the game playable and shows a message. Deployment uploads only this repository's `dist` artifact. No account-level Pages configuration changes are made.

`src/original` contains copied drawing modules and their original imports. `provenance.json` records the source revision and source hashes. Two adapters in the copied `art.js` accept the experiment's moving water level and smooth fish heading. The live original files are untouched. No soundtrack, private files or original Git history are included.

Opening the source HTML directly as a file redirects to the published test page; development requires the local server below.

## Development and checking

```sh
npm ci
npm run dev
npx playwright install chromium webkit
./check
```

Development uses port 5199; production preview uses 4199. `PAGES_BASE=/schnabelglueck-playground/ npm run build` builds the Pages path. `PLAYGROUND_URL=https://tidyeval.github.io/schnabelglueck-playground/ npm run test:browser` checks the deployed site.

Model checks cover both complete routes at 60/120 Hz, a month of daily layouts, fixed fish direction and smooth dodging, shark reactions, rescue-dependent help, tide waiting/entry, air, reef collisions, invalid steps, deterministic dates and isolated personal-best storage. Browser checks cover both full demonstrations, all six feature states, daily best surviving reload, pause/restart, real keyboard and pointer controls, focus loss, retina sky rendering and a narrow touch layout in Chromium and WebKit. `window.playground.snapshot()` exposes a cloned observation, with no state setters.

## Limits

This remains a feature prototype. It does not include the original stage progression, tricks, music, offline installation or native app packaging. The new interactions use a small deterministic model rather than a full Matter simulation. Automated demonstrations establish reachability, not human enjoyment. Physical-phone performance and human playtesting remain open.
