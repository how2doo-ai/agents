#!/usr/bin/env node
// translator — machine baseline + deterministic checks for the translator skill.
// Zero dependencies (Node >= 18: global fetch). The model is a DRAFTER and a
// SECOND OPINION; the agent running the skill owns the final text.
//
//   translate.mjs translate <file> [--to uk] [--from en] [--model <id>|deepl] [--out <file>]
//   translate.mjs compare   <file> --models a,b,c [--to uk] [--out-dir <dir>]
//   translate.mjs review    <source> <target> [--model <id>] [--to uk] [--json]
//   translate.mjs check     <source> <target> [--json]        (no network, no cost)
//   translate.mjs models    [--all]                           (live OpenRouter prices)
//
// <file> is .json (string leaves are translated, keys and skip_keys kept) or
// plain text / markdown (one unit per paragraph).
//
// Per-repo config: agents-info/translator/{config.json,glossary.json,style-guide.md},
// found by walking up from the cwd. Keys: OPENROUTER_API_KEY / DEEPL_API_KEY from
// the environment, else agents-info/translator/.env, else <repo>/.env.

import fs from "node:fs";
import path from "node:path";

const OPENROUTER = "https://openrouter.ai/api/v1";
const DEFAULTS = {
  source: "en",
  targets: ["uk"],
  models: {
    translate: "google/gemini-3.8-flash",
    review: "anthropic/claude-sonnet-5",
    cheap: "tencent/hy-mt2-30b-a3b",
  },
  skip_keys: ["id", "slug", "emoji", "icon", "href", "url", "src", "key", "type"],
  batch_chars: 6000,
  deepl_url: "https://api-free.deepl.com/v2/translate",
};
const LANG = { en: "English", uk: "Ukrainian", ru: "Russian", ro: "Romanian", pl: "Polish", de: "German", es: "Spanish", fr: "French" };

// ---------- args / config ----------

function parseArgs(argv) {
  const pos = [], opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) opt[k] = true;
      else { opt[k] = next; i++; }
    } else pos.push(a);
  }
  return { pos, opt };
}

function findInfoDir(start) {
  let dir = path.resolve(start);
  for (;;) {
    const c = path.join(dir, "agents-info", "translator");
    if (fs.existsSync(c)) return c;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

function readEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

function loadConfig(opt) {
  const info = opt.config ? path.resolve(opt.config) : findInfoDir(process.cwd());
  const cfgFile = info && path.join(info, "config.json");
  const user = cfgFile && fs.existsSync(cfgFile) ? JSON.parse(fs.readFileSync(cfgFile, "utf8")) : {};
  const cfg = { ...DEFAULTS, ...user, models: { ...DEFAULTS.models, ...(user.models || {}) } };
  cfg.info = info;
  const glossaryFile = info && path.join(info, user.glossary || "glossary.json");
  cfg.glossary = glossaryFile && fs.existsSync(glossaryFile) ? JSON.parse(fs.readFileSync(glossaryFile, "utf8")) : {};
  const styleFile = info && path.join(info, user.style || "style-guide.md");
  cfg.style = styleFile && fs.existsSync(styleFile) ? fs.readFileSync(styleFile, "utf8") : "";
  const env = {
    ...readEnvFile(info ? path.join(path.dirname(path.dirname(info)), ".env") : ""),
    ...readEnvFile(info ? path.join(info, ".env") : ""),
    ...process.env,
  };
  cfg.keys = { openrouter: env.OPENROUTER_API_KEY, deepl: env.DEEPL_API_KEY };
  return cfg;
}

// ---------- glossary ----------

// glossary.json: { _meta: { rules: {…} }, <category>: { "<source term>": "<target term>" }, …,
//                  banned*: { "<wrong target word>": "<use instead>" }, spellingRules: {…} }
// A category whose name starts with "banned" lists forms that must never appear.
function glossaryParts(g) {
  const terms = [], banned = [], notes = [];
  for (const [cat, val] of Object.entries(g || {})) {
    if (cat === "_meta" || !val || typeof val !== "object") continue;
    for (const [k, v] of Object.entries(val)) {
      if (k.startsWith("_") || typeof v !== "string") continue;
      if (/^banned/i.test(cat)) banned.push({ wrong: k, right: v, cat });
      else if (/rule/i.test(cat)) notes.push(`${k}: ${v}`);
      else terms.push({ src: k, tgt: v, cat });
    }
  }
  return { terms, banned, notes, rules: g?._meta?.rules || {} };
}

const lc = (s) => s.toLocaleLowerCase();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Ukrainian inflects and drops vowels (Овен → Овні, Телець → Тельці), so a
// target word matches on a ~60% prefix (сумісність → сумісності also needs it).
const stem = (w) => {
  const x = lc(w).replace(/[^\p{L}'’-]/gu, "");
  return x.length <= 3 ? x : x.slice(0, Math.max(2, Math.min(x.length - 2, Math.ceil(x.length * 0.6))));
};
const hasWordStarting = (text, prefix) => new RegExp(`(^|[^\\p{L}])${esc(prefix)}`, "iu").test(text);

// Glossary terms present in a source string. Longest first, and a matched span is
// masked so "Moon" is not reported again inside "New Moon". A capitalised term
// ("Page" the tarot card, "Aries") matches case-sensitively, so prose "page" doesn't.
function termsIn(text, terms, skipCats = []) {
  let t = text;
  const found = [];
  for (const x of [...terms].sort((a, b) => b.src.length - a.src.length)) {
    if (x.src.length < 3 || skipCats.includes(x.cat)) continue;
    const re = new RegExp(`(^|[^\\p{L}])(${esc(x.src)})(s|es)?(?![\\p{L}])`, /\p{Lu}/u.test(x.src) ? "u" : "iu");
    const m = re.exec(t);
    if (!m) continue;
    found.push(x);
    t = t.replace(new RegExp(re.source, re.flags + "g"), (all, pre) => pre + "\u0000".repeat(all.length - pre.length));
  }
  return found;
}

function bannedForms(wrong) {
  return wrong.split("/").map((w) => w.replace(/\(.*?\)/g, "").trim()).filter((w) => w.length >= 3);
}

// ---------- units: what gets translated ----------

function collectUnits(file, cfg) {
  const raw = fs.readFileSync(file, "utf8");
  if (file.endsWith(".json")) {
    const data = JSON.parse(raw);
    const skip = new Set(cfg.skip_keys);
    const units = [];
    const walk = (node, p) => {
      if (typeof node === "string") {
        const key = String(p[p.length - 1] ?? "");
        if (node.trim() && !skip.has(key) && /\p{L}/u.test(node)) units.push({ id: p.join("."), path: p, text: node });
      } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, [...p, i]));
      else if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) walk(v, [...p, k]);
    };
    walk(data, []);
    return { kind: "json", data, units };
  }
  const paras = raw.split(/\n{2,}/);
  return { kind: "text", paras, units: paras.map((t, i) => ({ id: String(i), text: t })).filter((u) => /\p{L}/u.test(u.text)) };
}

function writeUnits(doc, out) {
  const map = new Map(out.map((u) => [u.id, u.text]));
  if (doc.kind === "json") {
    const data = structuredClone(doc.data);
    for (const u of doc.units) {
      if (!map.has(u.id)) continue;
      let node = data;
      for (const k of u.path.slice(0, -1)) node = node[k];
      node[u.path[u.path.length - 1]] = map.get(u.id);
    }
    return JSON.stringify(data, null, 2) + "\n";
  }
  return doc.paras.map((t, i) => (map.has(String(i)) ? map.get(String(i)) : t)).join("\n\n");
}

function batches(units, maxChars) {
  const out = [];
  let cur = [], n = 0;
  for (const u of units) {
    if (cur.length && n + u.text.length > maxChars) { out.push(cur); cur = []; n = 0; }
    cur.push(u); n += u.text.length;
  }
  if (cur.length) out.push(cur);
  return out;
}

// ---------- deterministic checks ----------

const PLACEHOLDER = /\{\{[^}]+\}\}|\{[^{}\s]+\}|%\d*\$?[sdif]|<\/?[a-z][^>]*>|\$\{[^}]+\}/gi;
const placeholders = (s) => (s.match(PLACEHOLDER) || []).sort();

function checkPair(id, src, tgt, gl, opts = {}) {
  const issues = [];
  if (tgt == null || !String(tgt).trim()) {
    issues.push({ id, severity: "high", kind: "missing", note: "no translation" });
    return issues;
  }
  const a = placeholders(src), b = placeholders(tgt);
  if (a.join("\u0000") !== b.join("\u0000"))
    issues.push({ id, severity: "high", kind: "placeholder", note: `source ${JSON.stringify(a)} ≠ target ${JSON.stringify(b)}` });
  for (const x of termsIn(src, gl.terms, opts.skipCats)) {
    const want = x.tgt.split("/").map((w) => w.replace(/\(.*?\)/g, "").trim()).filter(Boolean);
    const hit = want.some((w) => w.split(/\s+/).every((word) => hasWordStarting(tgt, stem(word))));
    if (!hit) issues.push({ id, severity: "medium", kind: "glossary", note: `"${x.src}" should be "${x.tgt}"` });
  }
  for (const x of gl.banned) {
    for (const form of bannedForms(x.wrong)) {
      if (hasWordStarting(tgt, lc(form).length <= 5 ? lc(form) : stem(form))) issues.push({ id, severity: "medium", kind: x.cat.toLowerCase().includes("russ") ? "russianism" : "banned", note: `"${form}" → ${x.right.split(" — ")[0]}` });
    }
  }
  if (opts.cyrillicTarget) {
    const stripped = tgt.replace(PLACEHOLDER, "").replace(/https?:\/\/\S+/g, "");
    const allow = new Set((opts.allowLatin || []).map(lc));
    // Lowercase only: a capitalised Latin word is a proper name (Google, the product) and stays.
    const latin = (stripped.match(/\b[a-z][A-Za-z'-]{3,}\b/g) || []).filter((w) => !allow.has(lc(w)) && lc(src).includes(lc(w)));
    if (latin.length) issues.push({ id, severity: "low", kind: "untranslated", note: `Latin words left: ${[...new Set(latin)].join(", ")}` });
  }
  return issues;
}

function allowLatin(cfg, gl) {
  // Brand names and terms the glossary maps to themselves stay Latin on purpose.
  const self = gl.terms.filter((t) => /[A-Za-z]/.test(t.tgt)).flatMap((t) => t.tgt.match(/[A-Za-z][A-Za-z'-]+/g) || []);
  return [...(cfg.allow_latin || []), ...self];
}

// ---------- prompts ----------

function systemPrompt(cfg, gl, from, to, unitsText) {
  const used = termsIn(unitsText, gl.terms);
  const lines = [
    `You are a professional ${LANG[from] || from} → ${LANG[to] || to} translator and native ${LANG[to] || to} copy editor.`,
    `Translate meaning, not words: natural, fluent, native-sounding ${LANG[to] || to}. No calques. Keep the author's tone and register.`,
    `Never alter placeholders ({name}, {{x}}, %s, \${x}, HTML tags) or URLs. Keep emoji and punctuation style.`,
    // The two errors every model made in the 2026-10-03 blind compare (references/model-choice.md):
    `A numeric placeholder that governs a noun ({days} днів) must read correctly for 1, 2–4 and 5+: use the project's plural syntax if the source has one, otherwise rephrase so the number stands alone ("Залишилось днів: {days}").`,
    `A placeholder that will be filled with a noun ({sign}, {name}) arrives in the nominative: build the sentence so it stays grammatical ("знак: {sign}", not "у {sign}").`,
  ];
  if (cfg.product) lines.push(`Product: ${cfg.product}`);
  if (cfg.audience) lines.push(`Audience: ${cfg.audience}`);
  if (Object.keys(gl.rules).length) lines.push("", "RULES:", ...Object.entries(gl.rules).map(([k, v]) => `- ${k}: ${v}`));
  if (used.length) lines.push("", "GLOSSARY (mandatory, exact; inflect as grammar requires):", ...used.map((t) => `- ${t.src} → ${t.tgt}`));
  if (gl.banned.length) lines.push("", "NEVER USE these forms (use the alternative):", ...gl.banned.map((b) => `- ${b.wrong} → ${b.right.split(" — ")[0]}`));
  if (gl.notes.length) lines.push("", "NOTES:", ...gl.notes.slice(0, 40).map((n) => `- ${n}`));
  if (cfg.style) lines.push("", "STYLE GUIDE:", cfg.style.slice(0, 12000));
  return lines.join("\n");
}

// ---------- providers ----------

async function openrouter(cfg, model, messages, { json = true } = {}) {
  if (!cfg.keys.openrouter) throw new Error("OPENROUTER_API_KEY not set (env, agents-info/translator/.env, or repo .env)");
  // max_tokens is explicit: without it OpenRouter reserves the model's full output
  // window (65k) against the key's credit limit and refuses a low-balance key (HTTP 402).
  const body = { model, messages, temperature: 0.2, max_tokens: 16000, usage: { include: true } };
  if (json) body.response_format = { type: "json_object" };
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${OPENROUTER}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.keys.openrouter}`, "Content-Type": "application/json", "X-Title": "how2doo translator" },
      body: JSON.stringify(body),
    });
    const txt = await res.text();
    if (res.status === 400 && json && body.response_format) { delete body.response_format; continue; }
    if (res.status === 429 || res.status >= 500) { await new Promise((r) => setTimeout(r, 2000 * (attempt + 1))); continue; }
    if (!res.ok) throw new Error(`${model}: HTTP ${res.status} ${txt.slice(0, 300)}`);
    const j = JSON.parse(txt);
    if (j.error) throw new Error(`${model}: ${j.error.message || JSON.stringify(j.error)}`);
    return { content: j.choices?.[0]?.message?.content ?? "", cost: j.usage?.cost ?? 0, usage: j.usage };
  }
  throw new Error(`${model}: gave up after retries`);
}

function parseJsonLoose(s) {
  const t = s.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try { return JSON.parse(t); } catch {}
  const i = t.indexOf("{"), j = t.lastIndexOf("}");
  if (i >= 0 && j > i) return JSON.parse(t.slice(i, j + 1));
  throw new Error("model did not return JSON");
}

async function translateBatchLLM(cfg, gl, model, batch, from, to) {
  const payload = Object.fromEntries(batch.map((u) => [u.id, u.text]));
  const sys = systemPrompt(cfg, gl, from, to, batch.map((u) => u.text).join("\n"));
  const user = `Translate every value of this JSON object into ${LANG[to] || to}. Return ONLY a JSON object with exactly the same keys.\n\n${JSON.stringify(payload, null, 1)}`;
  const r = await openrouter(cfg, model, [{ role: "system", content: sys }, { role: "user", content: user }]);
  let obj;
  try { obj = parseJsonLoose(r.content); } catch {
    // Small MT-specialised models can ignore the JSON envelope: fall back to one unit per call.
    const out = []; let cost = r.cost;
    for (const u of batch) {
      const one = await openrouter(cfg, model, [{ role: "system", content: sys }, { role: "user", content: `Translate into ${LANG[to] || to}. Output only the translation.\n\n${u.text}` }], { json: false });
      out.push({ id: u.id, text: one.content.trim() }); cost += one.cost;
    }
    return { out, cost };
  }
  return { out: batch.map((u) => ({ id: u.id, text: typeof obj[u.id] === "string" ? obj[u.id] : null })), cost: r.cost };
}

async function translateBatchDeepL(cfg, batch, from, to) {
  if (!cfg.keys.deepl) throw new Error("DEEPL_API_KEY not set");
  const res = await fetch(cfg.deepl_url, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${cfg.keys.deepl}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: batch.map((u) => u.text), source_lang: from.toUpperCase(), target_lang: to.toUpperCase() }),
  });
  if (!res.ok) throw new Error(`deepl: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  return { out: batch.map((u, i) => ({ id: u.id, text: j.translations[i]?.text ?? null })), cost: 0 };
}

async function runTranslate(cfg, file, model, from, to) {
  const doc = collectUnits(file, cfg);
  const gl = glossaryParts(cfg.glossary);
  const maxChars = model.startsWith("tencent/hy-mt") ? Math.min(cfg.batch_chars, 2500) : cfg.batch_chars;
  const out = []; let cost = 0;
  const t0 = Date.now();
  for (const b of batches(doc.units, model === "deepl" ? 1500 : maxChars)) {
    const r = model === "deepl" ? await translateBatchDeepL(cfg, b, from, to) : await translateBatchLLM(cfg, gl, model, b, from, to);
    out.push(...r.out); cost += r.cost;
  }
  const byId = new Map(out.map((u) => [u.id, u.text]));
  const opts = { cyrillicTarget: ["uk", "ru", "bg", "sr"].includes(to), allowLatin: allowLatin(cfg, gl), skipCats: cfg.glossary_check_skip || [] };
  const issues = doc.units.flatMap((u) => checkPair(u.id, u.text, byId.get(u.id), gl, opts));
  return { doc, out, cost, issues, ms: Date.now() - t0 };
}

// ---------- commands ----------

function printIssues(issues) {
  const order = { high: 0, medium: 1, low: 2 };
  for (const i of [...issues].sort((a, b) => order[a.severity] - order[b.severity]))
    console.log(`  ${i.severity.padEnd(6)} ${i.kind.padEnd(13)} ${i.id}  ${i.note}${i.suggestion ? `  → ${i.suggestion}` : ""}`);
}

async function cmdTranslate(cfg, pos, opt) {
  const file = pos[0]; if (!file) throw new Error("usage: translate <file>");
  const from = opt.from || cfg.source, to = opt.to || cfg.targets[0];
  const model = opt.model || cfg.models.translate;
  const r = await runTranslate(cfg, file, model, from, to);
  const text = writeUnits(r.doc, r.out);
  if (opt.out) fs.writeFileSync(opt.out, text); else process.stdout.write(text);
  console.error(`${model}: ${r.doc.units.length} units, $${r.cost.toFixed(4)}, ${(r.ms / 1000).toFixed(1)}s, ${r.issues.length} check issue(s)`);
  if (r.issues.length) { console.error("checks:"); const log = console.log; console.log = console.error; printIssues(r.issues); console.log = log; }
}

async function cmdCompare(cfg, pos, opt) {
  const file = pos[0]; if (!file) throw new Error("usage: compare <file> --models a,b");
  const from = opt.from || cfg.source, to = opt.to || cfg.targets[0];
  const models = String(opt.models || [cfg.models.translate, cfg.models.cheap].join(",")).split(",").map((s) => s.trim()).filter(Boolean);
  const outDir = opt["out-dir"] || ".scratch/translator-compare";
  fs.mkdirSync(outDir, { recursive: true });
  const runs = await Promise.all(models.map(async (m) => {
    try { return { m, ...(await runTranslate(cfg, file, m, from, to)) }; } catch (e) { return { m, error: e.message }; }
  }));
  const base = path.basename(file).replace(/\.[^.]+$/, "");
  const ext = file.endsWith(".json") ? ".json" : ".txt";
  console.log(`model                                   units  issues  high  cost      time`);
  for (const r of runs) {
    if (r.error) { console.log(`${r.m.padEnd(40)} ERROR ${r.error}`); continue; }
    fs.writeFileSync(path.join(outDir, `${base}.${r.m.replace(/[/:]/g, "_")}${ext}`), writeUnits(r.doc, r.out));
    const high = r.issues.filter((i) => i.severity === "high").length;
    console.log(`${r.m.padEnd(40)} ${String(r.doc.units.length).padStart(5)}  ${String(r.issues.length).padStart(6)}  ${String(high).padStart(4)}  $${r.cost.toFixed(4).padEnd(8)} ${(r.ms / 1000).toFixed(1)}s`);
  }
  // Side-by-side for the agent (or human) to judge.
  const ok = runs.filter((r) => !r.error);
  if (ok.length) {
    const maps = ok.map((r) => new Map(r.out.map((u) => [u.id, u.text])));
    const rows = ok[0].doc.units.map((u) => ({ id: u.id, source: u.text, ...Object.fromEntries(ok.map((r, i) => [r.m, maps[i].get(u.id)])) }));
    const sbs = path.join(outDir, `${base}.side-by-side.json`);
    fs.writeFileSync(sbs, JSON.stringify({ models: ok.map((r) => r.m), issues: Object.fromEntries(ok.map((r) => [r.m, r.issues])), rows }, null, 2));
    console.log(`\nwritten: ${outDir}/ (one file per model + ${path.basename(sbs)})`);
  }
}

async function cmdCheck(cfg, pos, opt, { quiet } = {}) {
  const [src, tgt] = pos; if (!src || !tgt) throw new Error("usage: check <source> <target>");
  const to = opt.to || cfg.targets[0];
  const gl = glossaryParts(cfg.glossary);
  const a = collectUnits(src, cfg), b = collectUnits(tgt, cfg);
  const tmap = new Map(b.units.map((u) => [u.id, u.text]));
  const opts = { cyrillicTarget: ["uk", "ru", "bg", "sr"].includes(to), allowLatin: allowLatin(cfg, gl), skipCats: cfg.glossary_check_skip || [] };
  const issues = a.units.flatMap((u) => checkPair(u.id, u.text, tmap.get(u.id), gl, opts));
  const srcIds = new Set(a.units.map((u) => u.id));
  for (const u of b.units) if (!srcIds.has(u.id)) issues.push({ id: u.id, severity: "low", kind: "orphan", note: "key not in source" });
  if (!quiet) {
    if (opt.json) console.log(JSON.stringify(issues, null, 2));
    else { console.log(`${a.units.length} units, ${issues.length} issue(s)`); printIssues(issues); }
  }
  return { a, tmap, issues, gl, to };
}

async function cmdReview(cfg, pos, opt) {
  const { a, tmap, issues: det, gl, to } = await cmdCheck(cfg, pos, opt, { quiet: true });
  const from = opt.from || cfg.source;
  const model = opt.model || cfg.models.review;
  const pairs = a.units.filter((u) => tmap.has(u.id)).map((u) => ({ id: u.id, text: u.text, target: tmap.get(u.id) }));
  const kinds = "meaning|glossary|register|calque|anglicism|russianism|grammar|spelling|untranslated|tone|placeholder";
  let llm = [], cost = 0;
  for (const b of batches(pairs.map((p) => ({ ...p, text: p.text + p.target })), cfg.batch_chars)) {
    const sys = systemPrompt(cfg, gl, from, to, b.map((u) => u.text).join("\n")).replace(/^You are a professional .*$/m,
      `You are a strict native ${LANG[to] || to} reviewer of ${LANG[from] || from} → ${LANG[to] || to} translations.`);
    const items = b.map((u) => ({ id: u.id, source: pairs.find((p) => p.id === u.id).text, target: pairs.find((p) => p.id === u.id).target }));
    const user = `Review each target against its source. Report ONLY real problems a native editor would fix; an acceptable translation gets no entry.\nReturn JSON: {"issues":[{"id":"…","severity":"high|medium|low","kind":"${kinds}","note":"what is wrong (short, in English)","suggestion":"the corrected ${LANG[to] || to} text"}]}\n\n${JSON.stringify(items, null, 1)}`;
    const r = await openrouter(cfg, model, [{ role: "system", content: sys }, { role: "user", content: user }]);
    cost += r.cost;
    try { llm.push(...(parseJsonLoose(r.content).issues || []).map((i) => ({ ...i, by: model }))); }
    catch { llm.push({ id: "*", severity: "low", kind: "review-error", note: "reviewer returned non-JSON", by: model }); }
  }
  const all = [...det.map((i) => ({ ...i, by: "check" })), ...llm];
  if (opt.json) console.log(JSON.stringify({ model, cost, issues: all }, null, 2));
  else { console.log(`${pairs.length} pairs reviewed by ${model} ($${cost.toFixed(4)}) + deterministic checks: ${all.length} issue(s)`); printIssues(all); }
}

async function cmdModels(cfg, opt) {
  const res = await fetch(`${OPENROUTER}/models`);
  const { data } = await res.json();
  const pick = opt.all ? data : data.filter((m) => /hy-mt|translat/i.test(m.id + m.name) || Object.values(cfg.models).includes(m.id));
  const price = (p) => `$${(Number(p) * 1e6).toFixed(3)}`;
  console.log("model                                    in/M     out/M    ctx");
  for (const m of pick.sort((a, b) => Number(a.pricing.prompt) - Number(b.pricing.prompt)))
    console.log(`${m.id.padEnd(40)} ${price(m.pricing.prompt).padEnd(8)} ${price(m.pricing.completion).padEnd(8)} ${m.context_length}${Object.entries(cfg.models).filter(([, v]) => v === m.id).map(([k]) => `  ← ${k}`).join("")}`);
  for (const [k, v] of Object.entries(cfg.models)) if (!data.some((m) => m.id === v)) console.log(`WARNING: configured ${k} model "${v}" is not on OpenRouter any more`);
}

const { pos, opt } = parseArgs(process.argv.slice(2));
const cmd = pos.shift();
const cfg = loadConfig(opt);
const run = { translate: cmdTranslate, compare: cmdCompare, review: cmdReview, check: cmdCheck, models: (c, _p, o) => cmdModels(c, o) }[cmd];
if (!run) {
  console.error(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 18).join("\n").replace(/^\/\/ ?/gm, ""));
  process.exit(cmd ? 2 : 0);
}
run(cfg, pos, opt).catch((e) => { console.error(`error: ${e.message}`); process.exit(1); });
