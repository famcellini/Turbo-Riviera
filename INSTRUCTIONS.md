# Turbo Riviera: install on the LG 27TQ615S-PZ monitor

File to install: `com.cristian.turboriviera_4.0.2_all.ipk`

Turbo Riviera is a 90s-style arcade road racer (pseudo-3D road, red convertible, curves, hills, traffic, a countdown timer and forks). Name, graphics and music are original: no Sega material.

## Install
The monitor is already set up (Developer Mode on, as for Super Eleonora).
1. Open webOS Dev Manager on the PC (monitor and PC on the same network).
2. **Apps** tab → **Install** (or drag the `.ipk` file into the window) and pick `com.cristian.turboriviera_4.0.2_all.ipk`.
3. Turbo Riviera appears among the monitor's apps with the convertible-at-sunset icon.

Remember: Developer Mode expires after about 50 hours; to renew it open the Developer Mode app and press "Extend".

## Controls (LG remote or keyboard)
| Key | Action |
|---|---|
| ◀ ▶ | steer |
| ▼ | tap for 1/3 s: cut the throttle and hold speed; keep pressed: brake |
| ▲ | throttle on (a single tap is enough, it stays on) |
| OK | change gear LO / HI (MANUAL mode) |
| RED button | change radio station |
| GREEN button | sound on/off |
| YELLOW button | auto / manual throttle |
| BACK | pause (from the title menu it closes the game) |

**Auto gears** is on by default: the LO/HI gearbox is automatic. As in manual mode, press ▲ once (a single tap is enough) and the car starts accelerating and keeps accelerating; tap ▼ for 1/3 of a second to hold the speed, keep it pressed to brake. Change it from the title menu, the pause menu or the yellow button.

**Manual mode** works the same way, plus OK changes gear: LO pulls hard but tops out around half speed, HI reaches top speed but picks up slowly from low speed. In manual the car accelerates about 21% faster than with auto throttle and reaches 296 km/h.

## The game
- **4 levels**: when you reach the end of the route the game restarts from the beginning with the same route. Level 2 adds 2 puddles on every leg between two provinces (about 1/4 of the road wide) and +10% traffic; level 3 has 3 puddles per leg and +20% traffic; level 4 has 4 puddles per leg and +30% traffic. All curves are 10% tighter. Driving through a puddle makes the car skid left or right (random) for 1/3 of a second with no steering. After the fourth level the game ends with the burn-out clip and a "FINISH" title with balloons.
- **Intro**: the game opens with the "Turbo Riviera" title sequence (sunset, neon grid, the convertible rising with exhaust flames). Any key skips it.
- **Radio**: before the start you pick a station, like on a car radio: *Blue Wave* (FM 88.6, cheerful), *Summer Breeze* (FM 94.2, relaxed), *Fire on the Sea* (FM 101.7, rock). *Last Sunset* plays at the finish and on the high-score screen. All tracks are original.
- **4 stages**: at the end of the first three stages the road splits. A green sign shows the two directions of that fork (the route tree: Fermo/Macerata, then Ancona, Ascoli Piceno, Pesaro Urbino and so on): keep left or right to choose: once you are on a branch you cannot cross to the other one, and after the fork only the road you chose continues. The pyramid map shows your route. The last stage ends with "Welcome to <last city>".
- **Road signs**: no town signs before the first fork; white town signs show 4 towns of the province you chose (e.g. Porto San Giorgio, Pedaso... after Fermo; Civitanova Marche, Recanati... after Macerata); blue direction signs show the two directions of the next fork.
- **Passenger**: at top speed she raises her arms; after a crash she turns towards the driver. Shifting from LO to HI shoots flames from the exhausts.
- **Time**: every checkpoint gives extra time. Going off-road slows you down, hitting a car costs speed, hitting palms, rocks or signs at high speed flips the car.
- At the finish the remaining time becomes a bonus, then a closing clip shows the car burning rubber and racing off towards the horizon. Top-5 high scores with initials, saved on the monitor.
- If a small text starting with "E" ever appears bottom-left, an error happened: the game keeps running, but send that text so it can be fixed.

## Uninstall
**Why there is no "Uninstall" window like for YouTube AdFree.** webOS Dev Manager opens that window only for apps it finds in the public Homebrew catalogue (repo.webosbrew.org). For an app installed from an `.ipk` file, clicking its row under **Installed** opens nothing. The same is true for Super Eleonora.

Ways that work:
1. **From the monitor (simplest)**: in the app bar hold OK on the Turbo Riviera icon until edit mode starts, then choose the bin / "Delete".
2. **From webOS Dev Manager**: open the **Terminal** tab, paste this line and press Enter:

   ```
   luna-send-pub -n 1 luna://com.webos.appInstallService/dev/remove '{"id":"com.cristian.turboriviera"}'
   ```

   If it answers `"returnValue":true` the game is removed; refresh the **Apps** tab to see it disappear. (For Super Eleonora the id is `com.cristian.supereleonora`.)
3. **Once the game is accepted in the Homebrew catalogue** (request to webosbrew/apps-repo), Dev Manager will show the same window as YouTube AdFree.

## Update and modify
- To update just install the new `.ipk`: it replaces the old version and the high scores are kept.
- Sources are in `turbo-riviera-sorgenti.zip` and on https://github.com/famcellini/Turbo-Riviera (`app` folder: `index.html`, `game.js` road and rules, `gfx.js` drawings, `audio.js` sound effects and music composition, `music.js` pre-recorded tracks, `appinfo.json`, icons). You can also try it in a browser by opening `index.html` (arrows, Enter, R = radio, M = sound, Esc = pause).
- To rebuild the package: `npm install -g @webos-tools/cli` then `ares-package app`.


---
Notice: this game may be distributed free of charge, but it may not be copied or sold / commercialized. (Avviso: distribuzione solo gratuita; vietate copia e commercializzazione.)
