# Louis Whittaker Tree Services LTD — Premium Landing Page Demo

A high-converting, mobile-first landing page concept for **Louis Whittaker Tree
Services LTD** (tree surgery & arboriculture, south of England).

## Viewing the demo

No build step — it's plain HTML/CSS/JS. Open `index.html` directly, or serve it:

```bash
cd whittaker-tree-services
python3 -m http.server 8080
# → http://localhost:8080
```

## Design system

| Element    | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Theme      | Light — warm cream (`#faf8f3`) with deep pine green & gold     |
| Display    | Fraunces (serif — established, premium feel)                   |
| Body       | Inter                                                          |
| Logo       | Client's tree-on-hedge-cube mark redrawn as crisp inline SVG   |

The client's logo (`assets/logo.png`) is the supplied artwork with the black
background professionally removed for use on the light theme.

## Conversion structure

1. **Branded preloader** — logo splash with shimmer bar, hides on page load
2. **Announcement bar** — 3 branches front and centre, click-to-call
3. **Hero** — 5.0★ social proof, dual CTA (quote / call), floating glass trust badges
4. **Credentials strip** — insured, certified, recycling, free quotes
5. **Services** — 6 glassmorphism cards that stack one above another as you scroll
6. **Our work** — gallery (placeholder imagery, see below)
7. **Stats band** — animated counters incl. "3 branches"
8. **Locations** — three glass branch cards with 3D hover tilt; Southampton HQ gold-flagged
9. **Process** — 4 steps, removes friction/uncertainty
10. **Reviews** — swipeable glass-card slider with 10 reviews, profile photos, arrows, dots and gentle autoplay
11. **CTA band → Contact form** — branch selector reinforces the multi-location story
12. **Sticky mobile call bar** — call/quote always one thumb-tap away

## Placeholders to confirm with the client

- **Winchester & Portsmouth branch details** — branch names/coverage areas are
  illustrative; confirm real addresses and phone numbers.
- **Imagery** — hero and gallery now use bespoke AI-generated photography
  (self-contained WebP in `assets/`, no external dependencies); to be replaced
  with the client's own before/after photos from Instagram
  ([@louiswhittakertreeservices](https://www.instagram.com/louiswhittakertreeservices)).
- **Reviews** — the first and fourth quotes paraphrase real Google reviews; the
  rest, plus all names and profile photos (randomuser.me), are illustrative
  placeholders to be replaced with the client's real Google reviews.
- **Stats** — "500+ trees & hedges cared for" is illustrative.
- **Form** — demo-only (client-side confirmation); wire to email/CRM in production.

Verified details used: HQ address (21 Gauntlet Drive, Netley, Southampton
SO31 5JH), phone 07751 095752, email louis@whittakertreeservices.co.uk,
5.0★ Google rating.
