# Anubis Wrath — by BET 777

A complete, standalone HTML5 slot game with a realistic ancient-Egyptian theme.
No login, no registration, no server — open `index.html` and play.

![Anubis Wrath](https://img.shields.io/badge/1024-WAYS-gold) ![Multipliers](https://img.shields.io/badge/Multiplier%20Reels-x500-red)

## Play

Open `index.html` in any modern browser (Chrome, Safari, Edge, Firefox), or serve the folder:

```bash
npx serve .            # or
python3 -m http.server # then visit http://localhost:8000
```

Works on mobile (portrait, scales to any screen) and desktop.

## Game

| | |
|---|---|
| Layout | 5 reels × 4 rows — **1024 ways to win** |
| Multiplier Reels | A multiplier (x2 … **x500**) locks above every reel each spin and applies to ways ending on that reel |
| Wild | Crook & Flail — substitutes all symbols except Scatter (reels 2–4) |
| Scatter | Golden Scarab — 3/4/5 pay 2x/10x/50x bet and award **15/20/25 Free Spins** (richer multiplier table, +5 on retrigger) |
| Feature Buy | 75× bet buys 15 Free Spins instantly |
| Big Wins | BIG / MEGA / EPIC WIN celebrations with coin showers |
| Controls | Turbo mode, Autoplay (10/25/50/100), bet levels Rs30 – Rs15,000, quick-stop |
| Extras | Full paytable, scatter anticipation reels, win presentation, ambient temple audio |

## Tech

- **Zero assets** — every symbol (Anubis, Scarab, Eye of Horus, Ankh, Scales, Crook & Flail, gem royals), the temple background, statues, torch flames, dust and coin particles are rendered procedurally on `<canvas>`.
- **Zero dependencies** — vanilla HTML/CSS/JS. All sound is synthesized live with the Web Audio API.
- Balance is demo credits (Rs100,000, auto-refills) persisted in `localStorage`.

## Files

```
index.html      — page shell, UI markup, overlays
css/style.css   — theme, layout, overlays, gold UI styling
js/audio.js     — Web Audio synth engine (spins, wins, fanfares, ambience)
js/symbols.js   — procedural high-detail symbol artwork
js/game.js      — slot engine: reels, 1024-ways evaluation, multiplier reels,
                  free spins, feature buy, autoplay, particles, background FX
```

---
For entertainment only. Play-money demo — no real wagering.
