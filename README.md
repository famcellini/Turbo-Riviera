# Turbo Riviera

An original 90s-style arcade road racer for LG webOS TVs: a red convertible, a pseudo-3D road with
curves and hills, traffic, a countdown timer and forks that let you choose your route through 15 stages.
Name, graphics and music are original (no Sega assets). Road signs and billboards show towns,
provinces and local businesses of the Fermo area (Marche, Italy).

![Title](screenshots/title.png)
![Game](screenshots/game.png)

## Controls
| Key | Action |
|---|---|
| ◀ ▶ | steer |
| ▼ | brake (manual: first press holds speed, next press brakes) |
| ▲ | throttle on (manual mode; stays on) |
| OK | gear LO / HI (manual mode) |
| Red | change radio station |
| Green | audio on/off |
| Yellow | auto / manual throttle |
| Back | pause |

## Install
Download the `.ipk` from the [dist](dist) folder and install it with webOS Dev Manager or `ares-install`.
To build it yourself: `ares-package app`.

## AI disclosure
Turbo Riviera was designed by the author: concept, game rules, route forks and the 15 stages,
the Fermo-area setting with local towns and businesses, and the remote-control layout.
The code was developed with the help of an AI assistant (Claude): the author wrote and modified
parts of the code by hand and reviewed all of the AI-generated code. Graphics and music were
generated with the AI assistant following the author's direction.
The author tested every version on an LG webOS monitor (27TQ615S), found the bugs and directed the fixes.

## License
MIT, see [LICENSE](LICENSE).
