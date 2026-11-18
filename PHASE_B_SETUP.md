# Phase B — live job automation (setup)

Goal: every 6 hours, a Google Apps Script searches for PM/APM/AI-PM jobs, fit-scores each one against your profile with Gemini, writes them to a Google Sheet, and (optionally) WhatsApps you the strong fits. The site then shows them in Owl Post automatically.

Everything here is free-tier. You'll do this once; it then runs on its own.

## 1. Create the Google Sheet (the database)

1. Go to [sheets.new](https://sheets.new) and name it `PM Launchpad DB`.
2. Copy its **ID** from the URL: `docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`.
3. Leave it open — you'll add the script next.

## 2. Get the free API keys

**Gemini (AI scoring):**
- [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) → Create API key. Copy it.

**Google Custom Search (job discovery):**
- Create a search engine at [programmablesearchengine.google.com](https://programmablesearchengine.google.com/) → "Search the entire web" ON → copy the **Search engine ID (cx)**.
- Enable the API + get a key at [developers.google.com/custom-search/v1/overview](https://developers.google.com/custom-search/v1/overview) → "Get a Key". Copy it. (100 searches/day free.)

**Interakt (WhatsApp — optional):**
- In your Interakt dashboard → Settings → Developer / API → copy the **API key** (the Base64 secret). Skip this to go without WhatsApp.

## 3. Add the script

1. In the Sheet: **Extensions → Apps Script**.
2. Delete the default code. Paste the contents of [apps-script/Code.gs](apps-script/Code.gs).
3. **Project Settings (gear) → Script Properties → Add** these rows:
   | Property | Value |
   |---|---|
   | `GEMINI_KEY` | your Gemini key |
   | `SEARCH_KEY` | your Custom Search key |
   | `SEARCH_CX` | your search engine ID |
   | `INTERAKT_KEY` | your Interakt key (optional) |
   | `WHATSAPP_TO` | your number, no +91, e.g. `98xxxxxxxx` (optional) |
4. Back in the editor, pick the function **`setupTrigger`** and click **Run**. Approve the permissions prompt (it's your own script).
   - This installs the 6-hour trigger, creates the `Jobs` tab, and runs the first pull.
5. Check the `Jobs` tab fills with scored rows. (First run takes a minute — it's rate-limited to stay in the free tier.)

## 4. Connect the site

1. In the Sheet: **Share → General access → Anyone with the link → Viewer**. (Needed so the site can read it. Keep the link private.)
2. Open [assets/config.js](assets/config.js) and set:
   ```js
   const CONFIG = {
     USE_LIVE_JOBS: true,
     SHEET_ID: "paste_your_sheet_id_here",
     SHEET_TAB: "Jobs"
   };
   ```
3. Save and `git push`. Owl Post now shows your live, fit-scored jobs (newest/strongest first). If the sheet is ever unreachable, the app quietly falls back to the sample jobs — it never breaks.

## Notes & limits

- **Free-tier ceilings:** Custom Search 100 queries/day (we use ~5 every 6 hrs = 20/day). Gemini Flash free tier is generous; the script sleeps between calls to stay under rate limits.
- **Tuning:** edit `QUERIES` and `PROFILE` at the top of `Code.gs` to change what it searches for and how it scores.
- **CV / cold message** in the locker room use your standard template for live jobs. We can add per-job AI rewrites later if you want.
- **WhatsApp owl** only fires for 80%+ fits, once per run, and only if you set the Interakt keys.
