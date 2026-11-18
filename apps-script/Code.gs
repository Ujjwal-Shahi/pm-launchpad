/**
 * PM Launchpad — Phase B automation (Google Apps Script)
 * Pulls PM/APM/AI-PM jobs every 6 hours, AI-fit-scores them with Gemini,
 * writes them to a Google Sheet, and (optionally) pings WhatsApp for strong fits.
 *
 * Zero cost: Serper.dev (2500 searches/month free), Gemini Flash (free tier),
 * Apps Script triggers (free), Interakt WhatsApp (free tier).
 *
 * SETUP: see PHASE_B_SETUP.md. Fill the keys via Project Settings → Script Properties
 * (keys: GEMINI_KEY, SEARCH_KEY, INTERAKT_KEY, WHATSAPP_TO), then run
 * setupTrigger() once from the editor.
 */

var PROFILE = [
  "Ujjwal Shahi — Business Analyst at NoBroker (Bangalore), transitioning to Product Manager.",
  "4 years NoBroker field→BA. Built 5 production AI tools solo (Gemini, GCP/BigQuery, Next.js, Supabase).",
  "Call auditor: multi-agent Gemini pipeline, 5%→100% audit coverage, 47 RMs.",
  "Carnival CRM: 200+ concurrent buyers, PostgreSQL SKIP LOCKED, WhatsApp automation, 0 double-assigns.",
  "Targets: AI PM, Technical PM, APM, Product Analyst→PM. Prefers AI / PropTech / SalesTech / Fintech, Bangalore or remote.",
  "No MBA. Best fit: 2–4 yrs experience, AI/internal-tools roles. Weaker fit: 7+ yrs required, MBA required."
].join(" ");

var QUERIES = [
  "associate product manager jobs Bangalore",
  "technical product manager AI jobs Bangalore",
  "AI product manager jobs India",
  "product manager fintech OR proptech OR saas Bangalore",
  "APM product analyst jobs Bangalore"
];

var SHEET_NAME = "Jobs";

function prop(k){ return PropertiesService.getScriptProperties().getProperty(k) || ""; }

/** Run ONCE from the editor to install the 6-hourly trigger. */
function setupTrigger(){
  ScriptApp.getProjectTriggers().forEach(function(t){
    if (t.getHandlerFunction() === "pullJobs") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("pullJobs").timeBased().everyHours(6).create();
  ensureSheet();
  Logger.log("Trigger installed. Running first pull now…");
  pullJobs();
}

function ensureSheet(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh){
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["id","role","company","location","salary","fit","why","questions","brief","url","isNew","foundAt"]);
    sh.getRange(1,1,1,12).setFontWeight("bold");
  }
  return sh;
}

function existingUrls(sh){
  var last = sh.getLastRow();
  if (last < 2) return {};
  var urls = sh.getRange(2,10,last-1,1).getValues();
  var map = {};
  urls.forEach(function(r){ if (r[0]) map[String(r[0]).trim()] = true; });
  return map;
}

/** Main job: called every 6 hours by the trigger. */
function pullJobs(){
  var sh = ensureSheet();
  var seen = existingUrls(sh);
  var added = 0, strong = [];

  // Mark older rows as not-new
  var last = sh.getLastRow();
  if (last >= 2) sh.getRange(2,11,last-1,1).setValue(false);

  for (var q = 0; q < QUERIES.length; q++){
    var results = searchJobs(QUERIES[q]);
    for (var i = 0; i < results.length; i++){
      var r = results[i];
      if (!r.link || seen[r.link]) continue;
      seen[r.link] = true;

      var scored = scoreJob(r.title, r.snippet, r.link);
      if (!scored) continue;

      var id = "j" + Utilities.base64EncodeWebSafe(r.link).substring(0, 10);
      sh.appendRow([
        id, scored.role || r.title, scored.company || "", scored.location || "Bangalore",
        scored.salary || "", scored.fit, scored.why,
        (scored.questions || []).join(" || "), scored.brief || "",
        r.link, true, new Date()
      ]);
      added++;
      if (scored.fit >= 80) strong.push(scored.role + " — " + (scored.company||"") + " (" + scored.fit + "%)");
      Utilities.sleep(1200); // stay within free-tier rate limits
    }
  }

  if (strong.length) notifyWhatsApp(strong);
  Logger.log("pullJobs done. Added " + added + " jobs, " + strong.length + " strong fits.");
}

/** Run this from the editor to test keys — logs raw Serper + Gemini output. */
function debugSearch(){
  var results = searchJobs("product manager jobs Bangalore");
  Logger.log("Serper returned " + results.length + " results");
  if (results.length > 0) {
    Logger.log("First result: " + JSON.stringify(results[0]));
    var scored = scoreJob(results[0].title, results[0].snippet, results[0].link);
    Logger.log("Gemini scored: " + JSON.stringify(scored));
  } else {
    Logger.log("Raw key check: SEARCH_KEY=" + (prop("SEARCH_KEY") ? "SET" : "MISSING") + " GEMINI_KEY=" + (prop("GEMINI_KEY") ? "SET" : "MISSING"));
  }
}

/** Run this to test Gemini API directly. */
function debugGemini(){
  var key = prop("GEMINI_KEY");
  Logger.log("GEMINI_KEY set: " + (key ? "YES (len=" + key.length + ")" : "NO"));
  var url = "https://generativelanguage.googleapis.com/v1/models/gemini-3.8-flash:generateContent?key=" + key;
  var payload = { contents:[{ parts:[{ text: "Reply with this exact JSON: {\"ok\":true}" }] }] };
  try {
    var res = UrlFetchApp.fetch(url, { method:"post", contentType:"application/json",
      payload: JSON.stringify(payload), muteHttpExceptions:true });
    Logger.log("HTTP status: " + res.getResponseCode());
    Logger.log("Response: " + res.getContentText().substring(0, 500));
  } catch(e){ Logger.log("Error: " + e); }
}

/** Serper.dev Google Search API (2500 free/month, no billing required). */
function searchJobs(query){
  var key = prop("SEARCH_KEY");
  if (!key){ Logger.log("Missing SEARCH_KEY"); return []; }
  try {
    var res = UrlFetchApp.fetch("https://google.serper.dev/search", {
      method: "post",
      contentType: "application/json",
      headers: { "X-API-KEY": key },
      payload: JSON.stringify({ q: query, num: 10, gl: "in", hl: "en" }),
      muteHttpExceptions: true
    });
    var data = JSON.parse(res.getContentText());
    return (data.organic || []).map(function(it){
      return { title: it.title, link: it.link, snippet: it.snippet || "" };
    });
  } catch(e){ Logger.log("search error: " + e); return []; }
}

/** Gemini fit-scores a single job against Ujjwal's profile; returns JSON. */
function scoreJob(title, snippet, link){
  var key = prop("GEMINI_KEY");
  if (!key){ Logger.log("Missing GEMINI_KEY"); return null; }
  var prompt =
    "You are a job-fit scorer. CANDIDATE PROFILE:\n" + PROFILE +
    "\n\nJOB POSTING:\nTitle: " + title + "\nSnippet: " + snippet + "\nURL: " + link +
    "\n\nReturn ONLY compact JSON, no markdown, with keys: " +
    "role (string), company (string), location (string), salary (string, '' if unknown), " +
    "fit (integer 0-100 for THIS candidate), why (one sentence why it fits or not, mention his AI/tools background), " +
    "questions (array of exactly 8 likely interview questions tailored to this role and his background), " +
    "brief (2 sentences about the company). If this is not a real PM/APM/Product job posting, set fit to 0.";
  var url = "https://generativelanguage.googleapis.com/v1/models/gemini-3.8-flash:generateContent?key=" + key;
  var payload = { contents:[{ parts:[{ text: prompt }] }], generationConfig:{ temperature:0.2, responseMimeType:"application/json" } };
  try {
    var res = UrlFetchApp.fetch(url, { method:"post", contentType:"application/json",
      payload: JSON.stringify(payload), muteHttpExceptions:true, deadline:30 });
    var data = JSON.parse(res.getContentText());
    var text = data.candidates && data.candidates[0].content.parts[0].text;
    if (!text) return null;
    var obj = JSON.parse(text);
    obj.fit = Math.max(0, Math.min(100, parseInt(obj.fit) || 0));
    if (obj.fit === 0) return null; // skip non-jobs / terrible fits
    return obj;
  } catch(e){ Logger.log("gemini error: " + e); return null; }
}

/** Optional: WhatsApp morning ping via Interakt for strong fits. */
function notifyWhatsApp(strongList){
  var key = prop("INTERAKT_KEY"), to = prop("WHATSAPP_TO");
  if (!key || !to) return; // WhatsApp is optional
  var body = "🦉 Owl Post: " + strongList.length + " strong-fit PM role(s) today:\n• " + strongList.join("\n• ");
  try {
    UrlFetchApp.fetch("https://api.interakt.ai/v1/public/message/", {
      method:"post", contentType:"application/json",
      headers:{ Authorization:"Basic " + key },
      payload: JSON.stringify({
        countryCode:"+91", phoneNumber: to, type:"Text",
        data:{ message: body }
      }),
      muteHttpExceptions:true
    });
  } catch(e){ Logger.log("whatsapp error: " + e); }
}
