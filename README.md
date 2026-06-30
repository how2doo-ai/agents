# how2doo-agents

A marketplace of **portable agent skills for Claude Code** — the reusable craft behind [how2doo](https://github.com/alohamonius), packaged so any repo can install once and update everywhere.

Each plugin is a *shared skill* (the portable craft) that reads *per-repo config* (your brand, your site, your credentials). Shared = plugin, local = repo. Improve the skill once → `/plugin update` propagates it to every project.

## Install

```bash
/plugin marketplace add alohamonius/how2doo-agents
/plugin install design
```

## Plugins

| Plugin | What it does |
|--------|--------------|
| **design** | Distinctive, production-grade UI craft. Grounds every choice in semantic tokens + a known component substrate (shadcn/Tailwind/lucide), names and rejects the looks AI defaults to, and spends motion deliberately. Reads a per-repo `BRAND.md`. |
| **seo** | Autonomous SEO agent — GA4 + Search Console analytics and DataForSEO keyword/SERP/competitor research. Published separately at [`alohamonius/seo-agent`](https://github.com/alohamonius/seo-agent). |

## Pro

A private **how2doo-agents-pro** tier holds premium agents and configurations. _Available on request._

## License

MIT — see [LICENSE](LICENSE).
