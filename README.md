# Schnabelglück · Schwarm & Schatz

An independent six-feature experiment, published separately from the existing game.

**Test site:** https://tidyeval.github.io/schnabelglueck-playground/

**Existing game, unchanged:** https://tidyeval.github.io/schnabel-voll-glueck/

Hold the screen or Space to dive; release to rise. Choose **Alle Stationen & Schatz vorführen** to watch the complete route; touching the canvas or pressing Space takes control. A run takes roughly 80–90 seconds. Pause also happens on focus loss.

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

## Camera, counterweight and luminous cave

After the current, bump the yellow buoy with Pip's beak. It is attached to an actual Matter tether. Deflecting it releases a hinged beam: a heavy weight falls and the linked gate rises. Swim beneath the raised gate for a 60-point bonus, then surface before the cave. Missing the buoy leaves the gate closed; the upper route remains free. The weight and gate retain their finite mass/inertia across latch release, with a mechanical angle stop.

The final optional cave has four cyan fish using native Phaser 4 Glow filters, continuously redrawn original fish art, soft pools of light and an air bubble. Collect all four and exit for an 80-point bonus. Its ceiling and floor match the collision bounds. Flying over the cave stays bright and safe.

The camera gently reveals more of the route before reefs and these new stations. The HTML controls/HUD remain outside camera movement; the 2D world, native particles and glowing fish share the actual Phaser camera. Drawing the world directly avoids uploading a full-frame canvas texture to WebGL every frame, which was slow in WebKit. Pause freezes camera, simulation, particles and animation. The original drawing is refreshed every frame, rather than reduced to a fixed animation strip. This path requires WebGL; phone GPU/battery performance has not been measured.

The changed course uses a new personal-best namespace; earlier prototype records are preserved but are not compared against the new scoring/route.

## Short perspective flight test

Open https://tidyeval.github.io/schnabelglueck-playground/?test=flight and choose **Flugtest starten**, or use **Perspektivwechsel vorführen**. The short practice automatically takes off, so an early touch/Space press cannot accidentally dive out of the scene. It takes about 17 seconds and never writes a daily record. Both short-test buttons are also available in the normal menu.

An updraft lifts Pip above the normal gliding height. In the designated airborne scene, the side view transitions over 1.35 seconds to an illustrated frontal/oblique 2.5D ring corridor. Steer with Left/Right or A/D, or drag horizontally on the canvas. Releasing a drag keeps the current lane; misses cost a ring but never trap the player. Five rings are projected by depth and judged once at Pip's passing plane. Each successful ring awards 25 points. The final transition returns to the original side illustration and hold/release control. Reduced motion uses a direct scene switch. This is a projected 2.5D experiment, with a new frontal drawing; it is not a full 3D character/world conversion.

The full course includes this scene once near the end if Pip takes the updraft; staying underwater bypasses it. Camera emphasis elsewhere now eases in/out around specific encounters. It shifts down by at most 14 logical pixels when Pip dives at the reefs/cave, looks ahead by at most 32 pixels and zooms no further than 0.965×. Calm intervals keep the baseline view.

The existing buoy mechanism also demonstrates a chain reaction: the counterweight starts above the water, falls through the surface after release, creates a splash/ripple and drives four fish out of a visible sea-grass patch. It reuses the existing mechanism rather than adding a separate coconut interaction. There is no nest-delivery feature.

## Artwork and isolation

Phaser owns the scene, input and update loop. The original vector world draws directly to a 2D canvas. A transparent Phaser WebGL canvas adds native particles and glow, with both layers following the actual Phaser camera transform at up to 2× pixel density: Pip's wing/tail/blink/beak/pouch animation, fish tails, shark, boat, turtle, layered coast, waves, light rays, plants and splash/catch effects. The previous baked 8/6-frame animations and simplified backdrop have been removed. The world draws with a 600-pixel-wide overscan area, easing up to 32 logical pixels ahead and out to 0.965× zoom before obstacles. Sky and water fill the wider viewport without stretching actors. Reduced motion keeps the camera fixed. The new reef/gate/rescue indicators are prototype artwork.

This project has its own Git repository, dependencies, deployment workflow and Pages URL. It has no runtime imports from sibling projects, no service worker and does not read or modify their saved games. Its only storage keys start with `schnabel-playground-six:flight-v1:best:`; blocked storage leaves the game playable and shows a message. Deployment uploads only this repository's `dist` artifact. No account-level Pages configuration changes are made.

`src/original` contains copied drawing modules and their original imports. `provenance.json` records the source revision and source hashes. Local adapters accept the moving water level, smooth fish heading, forward-facing helper, fisherman legs and a Phaser-driven catch squash. Wider-view background adapters and the cyan fish palette are also local to the prototype. The copied `netShape` accepts the water level so its rendered outline and collision polygon agree. The live original files are untouched. No soundtrack, private files or original Git history are included.

Opening the source HTML directly as a file redirects to the published test page; development requires the local server below.

## Development and checking

```sh
npm ci
npm run dev
npx playwright install chromium webkit
./check
```

Development uses port 5199; production preview uses 4199. `PAGES_BASE=/schnabelglueck-playground/ npm run build` builds the Pages path. `PLAYGROUND_URL=https://tidyeval.github.io/schnabelglueck-playground/ npm run test:browser` checks the deployed site.

Model checks cover both complete routes at 60/120 Hz, a month of daily layouts, fixed fish direction and smooth dodging, shark reactions, rescue-dependent help, tide waiting/entry, air, reef collisions, invalid steps, deterministic dates and isolated personal-best storage. Model checks also exercise the actual Matter current across a month of routes, targeted net-thread rescue, an escapable closed helper gate, warning/net contact, and catch-series scoring. Physics checks also cover the anchored buoy before contact, counterweight/gate motion after a push, finite body values, and escape from a closed gate. Checks also cover five-ring flight at 60/120 Hz, bounded steering, a scene that can be bypassed, practice-record isolation, real arrow keys and dragging, automatic return after misses, and flight pause/resume. Browser checks cover camera preview, reduced motion and pixel-stable pause, deliberate keyboard rescue and a nearby miss, sound loading/playback/muting, both full demonstrations, all six feature states, daily best surviving reload, pause/restart, real keyboard and pointer controls, focus loss, retina sky rendering and a narrow touch layout in Chromium and WebKit. `window.playground.snapshot()` exposes a cloned observation, with no state setters.

## Limits

This remains a feature prototype. It does not include the original stage progression, tricks, music, offline installation or native app packaging. Swimming and most interactions use the small deterministic model. The current uses Phaser’s bundled Matter engine, its real sensor overlap and applied forces; it does not replace Pip’s hold/release movement with a full rigid-body simulation. Automated demonstrations establish reachability, not human enjoyment. Physical-phone performance and human playtesting remain open.
