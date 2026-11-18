# PM Launchpad — Hogwarts edition

Ujjwal's personal PM career command center. Static site, zero build step, zero monthly cost.

## Run it locally

Any static server works. From this folder:

```bash
npx --yes serve -l 3000
```

Then open http://localhost:3000. (Video playback and the PDF reader need a real server — opening `index.html` directly with `file://` will not play videos.)

## Deploy free on GitHub Pages

1. Create a repo (e.g. `pm-launchpad`) and push this folder.
2. Repo → Settings → Pages → Source: `main` branch, `/root`.
3. It goes live at `https://<your-username>.github.io/pm-launchpad/`.

Zero maintenance: to change anything, edit a file and `git push`.

## Add a book to read in-app

The reader shows your own legally-owned PDFs. For your personal use only — keep the repo private if you add book PDFs, since sharing copyrighted PDFs publicly is not allowed.

1. Drop the PDF into the `books/` folder, e.g. `books/inspired.pdf`.
2. In `assets/data.js`, find that book and set its `pdf` field: `pdf:"inspired.pdf"`.
3. Reload. The book now opens in the Slytherin reader with page nav + progress.

Books without a PDF still show summaries, buy/borrow links, and a manual progress slider.

## Edit content

Everything lives in `assets/data.js` — no code needed:
- `WEEKS` — the 16-week curriculum
- `VIDEOS` — Pensieve lessons (real YouTube IDs, grouped by Year)
- `BOOKS_BY_PHASE` — the Library
- `JOBS` — Owl Post openings (+ `applyUrl`)
- `QCATS`, `KANBAN`, `FUN` — Duelling Club, Goblet, Hogsmeade

## Phase B (later) — live automation

Not built yet. Adds: Google Sheets as the database, a Google Apps Script cron that pulls real PM jobs every 6 hrs and AI-fit-scores them with Gemini, and a WhatsApp "owl" for daily briefs. Needs a few free API keys from your Google account.
