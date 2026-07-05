# FlashLingoKids

A kids' flashcard memory web app for learning animal vocabulary through pictures, words, and quizzes. Pure static HTML/CSS/JS — no backend, no build step — designed to run for free on GitHub Pages.

## Features

- **Learning Mode** — picture pops in, the word fades in after 2s, it's read aloud at 3s, with a 🔊 replay button and per-category progress saved locally.
- **Test Mode** — 4-choice picture quiz with score tracking, cheerful feedback, and a results screen.
- **7 animal categories, 134 cards** — Domestic, Farm, Forest, Arctic, Jungle, Sea Animals, and Insects.
- **Parent settings** — mute audio, adjust speech rate, reset progress.
- Built for kids ~3–8: big touch targets, no build tools required, works offline-ish (audio uses the browser's built-in Web Speech API, no audio files to host).

## Project structure

```
/index.html
/css/style.css
/js/app.js         - state, navigation, settings, shared audio/confetti helpers
/js/learning.js     - Learning Mode
/js/test.js         - Test Mode
/data/cards.json    - all card data (categories, words, image paths)
/images/animals/    - card photos, one folder per category
/scripts/           - one-off Node.js scripts used to build data/cards.json and images/ from the source PDFs (not needed to run the app)
/ads.txt
```

## Running locally

No build step needed — just serve the folder over HTTP (opening `index.html` directly via `file://` will fail the `fetch('data/cards.json')` call in most browsers due to CORS restrictions on local files).

Any static file server works, for example:

```bash
npx serve .
# or
npx live-server .
# or
python -m http.server 8000
```

Then open the printed local URL in your browser.

## Deploying to GitHub Pages

1. Create a new GitHub repository and push this folder's contents to it (the repo root should contain `index.html` directly, not nested in a subfolder).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch".
4. Pick the branch (usually `main`) and folder `/ (root)`, then **Save**.
5. GitHub will publish the site at `https://<your-username>.github.io/<repo-name>/` within a minute or two.
6. **Custom domain (optional):** under the same Pages settings, enter your domain in the "Custom domain" field, and add the DNS records GitHub shows you (a `CNAME` record pointing at `<your-username>.github.io` for a subdomain, or `A` records for an apex domain). GitHub also auto-generates a `CNAME` file in the repo when you do this — keep it.

## Plugging in real Google AdSense IDs

The app ships with **placeholder** ad units so the layout is ready to go, but no real ads will show until you:

1. Apply for and get approved by [Google AdSense](https://www.google.com/adsense/) for your live GitHub Pages domain.
2. In AdSense, create ad units and note your **publisher/client ID** (`ca-pub-XXXXXXXXXXXXXXXX`) and each unit's **slot ID**.
3. In `index.html`, replace:
   - The `client=ca-pub-0000000000000000` value in the `<script async src="https://pagead2.googlesyndication.com/...">` tag in `<head>` — set it to your real client ID.
   - Every `data-ad-client="ca-pub-0000000000000000"` and `data-ad-slot="..."` pair inside the two `<ins class="adsbygoogle">` blocks (one on the home screen, one on the results screen) — set these to your real client/slot IDs.
4. Replace the contents of `ads.txt` with the real line AdSense gives you (see the comments in that file).

Ads are placed below the header (home screen) and below the score (results screen) — away from any game buttons — to avoid accidental taps from young children.

## Regenerating card data from the source PDFs

`data/cards.json` and `images/animals/` were generated from the print-style flashcard PDFs in `Resources/` using the Node scripts in `scripts/` (`extract.mjs` then `finalize.mjs`). You only need to touch these if you're re-extracting from new source PDFs; the app itself doesn't run or depend on Node/npm at runtime.

Note: each source PDF deck includes one "category title" collage page mixed in among the animal pages; that page is intentionally excluded from `cards.json` (it's not a flashcard). That's why the app ships with 134 cards rather than the PDFs' combined 141 pages.

## Accessibility

- All flashcard images have `alt` text.
- Interactive controls have `aria-label`s where their purpose isn't obvious from visible text.
- Buttons meet a 44×44px minimum touch target.
- Respects `prefers-reduced-motion` for users sensitive to animation.
