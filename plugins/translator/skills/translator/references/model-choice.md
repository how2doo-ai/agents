# Model choice: the measurement behind `models.translate`

Re-run this whenever you change the default or a model gets retired. `node scripts/translate.mjs models` warns when a configured id is no longer on OpenRouter.

## 2026-10-03: EN→UK, starogram.com, n = 30 strings × 7 models

**Fixtures** (real production copy, with an existing human-edited uk version):
- `packages/content/en/readings/jupiter-aries.json`: 35 units of long-form mystical prose, formal «ви»
- `packages/content/en/landing.json`: 80 units of marketing copy, formal «ви»
- `packages/i18n/locales/en/bot.json`: 80 units of Telegram bot strings, informal «ти», heavy on `{placeholders}`

**Method.** I ran `compare` on all three files with each model, using the same prompt, the repo glossary and the style guide. I then took a deterministic random sample of 30 units longer than 60 characters (12 / 9 / 9) and shuffled the candidate letters per item. A native-editor judge (a Claude subagent) scored each candidate 1–5 blind, against the glossary and style guide. The judge never saw the key.

| model | mean | reading | landing | bot | scored 5 | cost, 3 files | time, reading file |
|---|---|---|---|---|---|---|---|
| `google/gemini-3.8-flash` | **4.60** | 4.33 | 4.56 | **5.00** | 63% | $0.098 | 48 s |
| `qwen/qwen3.7-max` | 4.47 | 4.33 | **4.67** | 4.44 | 50% | $0.163 | 125 s |
| `google/gemini-3.1-pro-preview` | 4.40 | 4.00 | 4.44 | 4.89 | 57% | $0.358 | 68 s |
| `openai/gpt-5.4` | 4.24¹ | 4.25 | 4.22 | n/a | 33% | $0.097¹ | 45 s |
| `anthropic/claude-sonnet-5` | 3.73 | 3.33 | 4.22 | 3.78 | 27% | $0.227 | 57 s |
| `deepseek/deepseek-v4-pro` | 3.63 | 3.42 | 4.00 | 3.56 | 20% | $0.076 | 58 s |
| `tencent/hy-mt2-30b-a3b` | 3.07 | 3.08 | 3.89 | 2.22 | 10% | $0.004 | 30 s |

¹ The bot file failed with HTTP 402 because the key was near its credit limit (fixed since: `max_tokens` is now explicit), so gpt-5.4 covers 2 of the 3 files (n = 21).

**What separated them.** On long-form prose, the lower scores came from English calques ("природно експансивних", "відмовляєтеся дозволяти", "виклики"), tautologies ("свідомого усвідомлення") and wrong word senses ("вдача" used for luck, "конкуренція", "актив"). The mechanical `check` found 0–3 issues per model on these files, so it cannot rank quality; only a reader can.

**Errors every model made**, now written into the prompt:
- `{daysRemaining} днів` was hard-coded, which is wrong for 1–4.
- `у {sign}` was built around a placeholder that arrives in the nominative.

**Decision.**
- `translate` = `google/gemini-3.8-flash`: best mean, best on the bot register, and the cheapest of the top three. The top three are within ~0.2 of each other on n = 30, so qwen3.7-max and gemini-3.1-pro are equally reasonable choices. Don't read the order among them as settled.
- `review` = `anthropic/claude-sonnet-5`: it scored low as a *drafter*, but it is a different family from the drafter. On the real starogram landing review ($0.07, 80 pairs) it found genuine misses in the shipped uk copy: the dropped "transit forecasts" list, "Insights" omitted, "12 шляхів" losing "life", and the "Unlock" glossary break.
- `cheap` = `tencent/hy-mt2-30b-a3b`: ~22× cheaper than flash. Use it only for bulk drafts you will edit heavily; it is weak on register (bot 2.22).

**Limits.** One language pair, one product, one judge, n = 30. A second pair or a human native spot-check would make this stronger. The whole run cost ≈ $1.30.
