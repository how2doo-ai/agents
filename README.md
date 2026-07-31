# how2doo-agents

A marketplace of **portable agent skills for Claude Code** — the reusable craft behind [how2doo](https://github.com/how2doo-ai), packaged so any repo can install once and update everywhere.

Each plugin is a *shared skill* (the portable craft) that reads *per-repo config* (your brand, your site, your credentials). Shared = plugin, local = repo. Improve the skill once → `/plugin update` propagates it to every project.

## Install

```bash
/plugin marketplace add how2doo-ai/agents
/plugin install design
```

## Plugins

| Plugin | What it does |
|--------|--------------|
| **design** | Distinctive, production-grade UI craft. Grounds every choice in semantic tokens + a known component substrate (shadcn/Tailwind/lucide), names and rejects the looks AI defaults to, and spends motion deliberately. Reads a per-repo `BRAND.md`, which `generate` can derive/maintain automatically and `apply <page>` can check pages against (deterministic report, never an auto-edit) — the same versioned, schema-validated contract in every installed repo ([`CONTRACT.md`](plugins/design/skills/design/CONTRACT.md)). |
| **seo** | Autonomous SEO agent — GA4 + Search Console analytics and DataForSEO keyword/SERP/competitor research. Published separately at [`how2doo-ai/seo`](https://github.com/how2doo-ai/seo). |

## Pro

A private **how2doo-agents-pro** tier holds the agents that connect to your accounts, get past auth, and close loops automatically. _Available on request._

| Pro agent | What it adds |
|---|---|
| **engineer-pro** | the spec-driven pair (spec + engineer) with beads ledger, deterministic gates, hook-level commit enforcement — the free `engineer` is its baseline |
| **qa-pro** | deterministic headless QA sweeps (console/network/render evidence per route), four login methods — form, mint-endpoint, real MetaMask (test wallet), or a hand-prepared browser profile for OAuth/2FA — findings auto-filed into the same beads queue `engineer-pro` drains. **Pro-only: there is no free `qa`.** |
| **monobank** | bank sync → subscription detection + spend ledger, read-only, local |
| **dashboard** | one local web app rendering every installed skill's panels |

## License

MIT — see [LICENSE](LICENSE).
