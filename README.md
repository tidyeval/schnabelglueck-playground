# Schnabelglück · Schwarm & Schatz

An independent six-feature experiment, published separately from the existing game.

**Test site:** https://tidyeval.github.io/schnabelglueck-playground/

**Existing game, unchanged:** https://tidyeval.github.io/schnabel-voll-glueck/

Hold the screen or Space to dive; release to rise. Choose **Alle Stationen & Schatz vorführen** to watch the complete route; touching the canvas or pressing Space takes control. A run takes roughly 45–55 seconds. Pause also happens on focus loss.

## Six playable ideas

- Schools maintain their leftward swimming direction, avoid neighbours and dodge Pip and sharks vertically with a gently changing heading.
- A visibly changing water level opens the tide passage at low tide. Pip can wait at the entrance or fly above it. A passage already entered stays open until Pip is through.
- Aim the beak through the golden ring on a loose net thread to rescue the turtle. Passing near its body does not trigger a rescue. Later it swims ahead, opens the shell gate and grants access to a faster fish/air shortcut with a 50-point completion bonus. Without rescue the gate stays closed; releasing rises safely past its entrance.
- Choose the safe upper route or dive beneath the reef for three treasure fish, an air bubble and a 100-point completion bonus. A fuller pouch slightly slows upward swimming.
- A shark scatters a school, then the fisherman visibly winds up and throws a net. Pass deeply below it or fly over the boat; touching its actual mesh costs points. A recovery stretch follows before the treasure branch. The fisherman now sits on a bench with knees and boots.
- Everyone gets the same dated arrangement and tide phase, using the Europe/Berlin calendar. Only the personal best for that day is stored in a playground-specific localStorage key. There is no online leaderboard or account.

The six cards below the canvas show which ideas have been experienced. Both demonstrations visit the rescue and its return reward; the safe demonstration bypasses the tide gate and treasure cave, while the treasure demonstration enters both.

## Added Phaser goodies

- Catches trigger native Phaser particle bubbles, a Tween-driven squash/pouch response and a short synthesized audio cue. Consecutive catches within 1.2 seconds build a series with capped extra points. Reduced-motion settings suppress the added particles and squash. The sound button mutes all cues; focus loss/pause stops audio and freezes tweens/particles.
- A visible current at the end accelerates Pip toward three fish. A Matter sensor detects the underwater body and a horizontal force builds speed; drag fades the extra speed after leaving. No extra dependency or editor is needed.
- The net reuses the original continuous windup/throw/sink/haul animation, with an advance warning and the very same outline for collision.
- The four small WAV cues in `public/audio` are synthesized locally for this prototype. There is no music track.

The changed course uses a new personal-best namespace; earlier prototype records are preserved but are not compared against the new scoring/route.

## Artwork and isolation

Phaser owns the scene, input and update loop. Its Canvas renderer calls the original continuous vector drawing functions directly at up to 2× pixel density: Pip's wing/tail/blink/beak/pouch animation, fish tails, shark, boat, turtle, layered coast, waves, light rays, plants and splash/catch effects. The previous baked 8/6-frame animations and simplified backdrop have been removed. The new reef/gate/rescue indicators are prototype artwork.

This project has its own Git repository, dependencies, deployment workflow and Pages URL. It has no runtime imports from sibling projects, no service worker and does not read or modify their saved games. Its only storage keys start with `schnabel-playground-six:goodies-v1:best:`; blocked storage leaves the game playable and shows a message. Deployment uploads only this repository's `dist` artifact. No account-level Pages configuration changes are made.

`src/original` contains copied drawing modules and their original imports. `provenance.json` records the source revision and source hashes. Local adapters accept the moving water level, smooth fish heading, forward-facing helper, fisherman legs and a Phaser-driven catch squash. The copied `netShape` accepts the water level so its rendered outline and collision polygon agree. The live original files are untouched. No soundtrack, private files or original Git history are included.

Opening the source HTML directly as a file redirects to the published test page; development requires the local server below.

## Development and checking

```sh
npm ci
npm run dev
npx playwright install chromium webkit
./check
```

Development uses port 5199; production preview uses 4199. `PAGES_BASE=/schnabelglueck-playground/ npm run build` builds the Pages path. `PLAYGROUND_URL=https://tidyeval.github.io/schnabelglueck-playground/ npm run test:browser` checks the deployed site.

Model checks cover both complete routes at 60/120 Hz, a month of daily layouts, fixed fish direction and smooth dodging, shark reactions, rescue-dependent help, tide waiting/entry, air, reef collisions, invalid steps, deterministic dates and isolated personal-best storage. Model checks also exercise the actual Matter current across a month of routes, targeted net-thread rescue, an escapable closed helper gate, warning/net contact, and catch-series scoring. Browser checks cover deliberate keyboard rescue and a nearby miss, sound loading/playback/muting, both full demonstrations, all six feature states, daily best surviving reload, pause/restart, real keyboard and pointer controls, focus loss, retina sky rendering and a narrow touch layout in Chromium and WebKit. `window.playground.snapshot()` exposes a cloned observation, with no state setters.

## Limits

This remains a feature prototype. It does not include the original stage progression, tricks, music, offline installation or native app packaging. Swimming and most interactions use the small deterministic model. The current uses Phaser’s bundled Matter engine, its real sensor overlap and applied forces; it does not replace Pip’s hold/release movement with a full rigid-body simulation. Automated demonstrations establish reachability, not human enjoyment. Physical-phone performance and human playtesting remain open.
