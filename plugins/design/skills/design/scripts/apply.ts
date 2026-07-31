// design/scripts/apply.ts — the deterministic half of `/design apply`.
// Literal string-matching against docs/design/tokens.json + whatever old-theme
// CSS variables generate mode recorded. No LLM judgment involved: same file +
// same tokens.json → byte-identical report, every time. Portable by design —
// no path in here is specific to any one host repo; everything comes from
// tokens.json itself or a short list of conventional fallback locations.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export interface IconEntry {
  site: string;
  current: string;
  proposed: string;
  note?: string;
}

export interface Tokens {
  colors: Record<string, { value: string; usage: string }>;
  icons: Record<string, IconEntry[]>;
  // Recorded by generate mode when it read an existing stylesheet's :root
  // block — lets apply find the same file without hardcoding a path.
  oldThemeCssPath?: string;
}

export interface Deviation {
  line: number;
  current: string;
  equivalent: string;
  kind: "icon" | "color";
  note: string;
}

// Conventional stylesheet locations to try when tokens.json doesn't record
// one — covers Next.js (app/ and src/app/) and plain Vite/CRA (styles/) layouts.
const CSS_FALLBACKS = ["app/globals.css", "src/app/globals.css", "styles/globals.css"];

// old-theme colors this brandbook is meant to replace: hex → the --var name
// it was declared under, so a hit can say exactly what it's replacing.
export function oldColorsFromGlobalsCss(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  const rootBlock = css.match(/:root\s*{([^}]*)}/);
  if (!rootBlock) return out;
  for (const m of rootBlock[1].matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})/gi)) {
    out[m[2].toLowerCase()] = m[1];
  }
  return out;
}

// Prefer a token explicitly tagged as the accent; fall back to the first
// color on record; fall back to a generic pointer if the palette is empty.
// Different repos name their tokens differently, so "accent" is a hint, not
// a required key.
function accentEquivalent(tokens: Tokens): string {
  const accent = tokens.colors?.accent;
  if (accent) return `${accent.value} (accent)`;
  const first = Object.entries(tokens.colors ?? {})[0];
  if (first) return `${first[1].value} (${first[0]})`;
  return "see docs/design/tokens.json for the current palette";
}

export function computeDeviations(source: string, tokens: Tokens, oldColors: Record<string, string>): Deviation[] {
  const iconEntries = Object.values(tokens.icons ?? {}).flat();
  const equivalent = accentEquivalent(tokens);
  const deviations: Deviation[] = [];

  source.split("\n").forEach((line, i) => {
    const lineNo = i + 1;
    for (const entry of iconEntries) {
      for (const sym of entry.current.split("/").map((s) => s.trim())) {
        if (sym && line.includes(sym)) {
          deviations.push({
            line: lineNo,
            current: sym,
            equivalent: entry.proposed,
            kind: "icon",
            note: entry.note ?? `matches tokens.json icons entry for ${entry.site}`,
          });
        }
      }
    }
    for (const hex of line.match(/#[0-9a-fA-F]{3,8}/g) ?? []) {
      const varName = oldColors[hex.toLowerCase()];
      if (varName) {
        deviations.push({
          line: lineNo,
          current: hex,
          equivalent,
          kind: "color",
          note: `matches old theme token --${varName}; brandbook replaces this with the new palette`,
        });
      }
    }
  });

  return deviations;
}

export function renderReport(page: string, tokensPath: string, deviations: Deviation[]): string {
  const verdict = deviations.length ? "deviations-found" : "conforms";
  let md = `# design apply — report\n\n**page**: \`${page}\`\n**brandbook**: \`${tokensPath}\`\n**verdict**: \`${verdict}\`\n\n`;
  if (!deviations.length) {
    md += "No deviations found — this file already conforms to the brandbook.\n";
    return md;
  }
  md += "| line | current | brandbook equivalent | kind | note |\n|---|---|---|---|---|\n";
  for (const d of deviations) {
    md += `| ${d.line} | \`${d.current}\` | ${d.equivalent} | ${d.kind} | ${d.note} |\n`;
  }
  return md;
}

function resolveOldCss(repoRoot: string, tokens: Tokens): Record<string, string> {
  const candidates = tokens.oldThemeCssPath ? [tokens.oldThemeCssPath, ...CSS_FALLBACKS] : CSS_FALLBACKS;
  for (const rel of candidates) {
    const p = resolve(repoRoot, rel);
    if (existsSync(p)) return oldColorsFromGlobalsCss(readFileSync(p, "utf8"));
  }
  return {};
}

function main() {
  const [, , targetArg, ...rest] = process.argv;
  if (!targetArg) {
    console.error("usage: apply.ts <page-or-component-path> [--out <report-path>] [--tokens <tokens.json-path>]");
    process.exit(1);
  }
  const outIdx = rest.indexOf("--out");
  const outPath = outIdx >= 0 ? rest[outIdx + 1] : null;
  const tokensIdx = rest.indexOf("--tokens");
  const tokensArg = tokensIdx >= 0 ? rest[tokensIdx + 1] : "docs/design/tokens.json";

  const repoRoot = process.cwd();
  const tokensPath = resolve(repoRoot, tokensArg);
  const targetPath = resolve(repoRoot, targetArg);

  if (!existsSync(tokensPath)) {
    console.error(`no brandbook found at ${tokensPath} — run "/design generate" first`);
    process.exit(1);
  }
  if (!existsSync(targetPath)) {
    console.error(`no such file: ${targetPath}`);
    process.exit(1);
  }

  const tokens: Tokens = JSON.parse(readFileSync(tokensPath, "utf8"));
  const source = readFileSync(targetPath, "utf8");
  const oldColors = resolveOldCss(repoRoot, tokens);

  const deviations = computeDeviations(source, tokens, oldColors);
  const report = renderReport(targetArg, tokensArg, deviations);

  if (outPath) writeFileSync(resolve(repoRoot, outPath), report);
  else process.stdout.write(report);
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop()!);
if (isMain) main();
