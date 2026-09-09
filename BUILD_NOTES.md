# Build notes

Pause 1 (2026-08-30): TypeScript rules engine only. No table UI. No Wholesaler. No Pyodide.

Pause 2 (2026-08-30): Playable 3-seat table. Human Shop is two-step via `applyPurchase` + `finishShop`. Bargain Bin log never names the card. Robots still use `pickSimpleAction`, not the named simulator styles.

Pause 3 (2026-08-30): Five named AI styles are a TypeScript port of `simulator/ai.py` (not Pyodide). Wholesaler Order deck and trade-price buys follow `rules_sock_market_wholesaler.md`. Locked long-term path is still “reuse simulator brains”; this port is so Pause 3 is playable now.

Pause 4 (2026-08-30): Production sock/client art from the BGG CC edition, How-to-Play overlay using v1.2 wording, coin exchange that does not change total value, copyable log, and reveal-all debug.

Robot path: locked as “reuse simulator brains.” Pause 1–2 stand-in is `pickSimpleAction` in `src/engine/play.ts` so games can finish. It is not one of the five named styles.

Rules source: `rules_sock_market_v1.2.md` only. Shop refill fills the Row back to 6 when the Bin still has cards (printed wording), not a single-card append.

Seeded RNG is mulberry32. It will not match Python’s shuffle on the same seed. That is fine until Pause 3 compares robots, not deals.
