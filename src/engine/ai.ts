import { applyPurchase } from "./rules.ts"
import { cloneState } from "./state.ts"
import type { Action, AiStyle, GameState, Purchase } from "./types.ts"
import { canBuyBin, canDump, canShop, dumpMax } from "./validators.ts"

function endgame(state: GameState): boolean {
  return state.inFinal || state.bin.length <= state.n
}

function bestDump(
  state: GameState,
  seat: number,
  bonusLine: number | null,
  bonus: number,
): { line: number; count: number; rev: number } | null {
  let best: { line: number; count: number; rev: number } | null = null
  for (let t = 0; t < 5; t++) {
    const c = dumpMax(state, seat, t)
    if (c < 1) continue
    const rev = c * (state.prices[t] ?? 0) + (t === bonusLine ? bonus * c : 0)
    if (!best || rev > best.rev) best = { line: t, count: c, rev }
  }
  return best
}

function shopPlan(
  state: GameState,
  seat: number,
  opts: { prefer?: number | null; useBin?: boolean; maxPrice?: number },
): Purchase[] | null {
  const plan: Purchase[] = []
  let s = cloneState(state)
  s.current = seat
  const maxPrice = opts.maxPrice ?? 9
  for (let n = 0; n < 2; n++) {
    const coins = s.coins[seat] ?? 0
    let choice: Purchase | null = null
    if (opts.useBin && canBuyBin(s, seat)) {
      choice = { source: "bin" }
    } else {
      const unique: number[] = []
      for (const line of s.row) {
        const price = s.prices[line] ?? 9
        if (coins >= price && price <= maxPrice && !unique.includes(line)) unique.push(line)
      }
      let pick: number | null = null
      if (opts.prefer != null && unique.includes(opts.prefer)) pick = opts.prefer
      else if (unique.length) {
        pick = unique[0]!
        for (const t of unique) {
          const cheaper = (s.prices[t] ?? 9) < (s.prices[pick] ?? 9)
          const tie = s.prices[t] === s.prices[pick] && t < pick
          if (cheaper || tie) pick = t
        }
      }
      if (pick != null) {
        const idx = s.row.indexOf(pick)
        if (idx >= 0) choice = { source: "row", index: idx }
      }
    }
    if (!choice) break
    plan.push(choice)
    s = applyPurchase(s, choice)
  }
  return plan.length ? plan : null
}

function fallback(state: GameState, seat: number): Action {
  if (canDump(state, seat)) {
    const bd = bestDump(state, seat, null, 0)
    if (bd) return { type: "dump", line: bd.line, count: bd.count }
  }
  const plan = shopPlan(state, seat, { useBin: true })
  if (plan) return { type: "shop", purchases: plan }
  return { type: "laundromat" }
}

function balanced(state: GameState, seat: number, bonusLine: number | null, bonus: number): Action | null {
  const bd = canDump(state, seat) ? bestDump(state, seat, bonusLine, bonus) : null
  const threshold = endgame(state) ? 1 : 8
  if (bd && bd.rev >= threshold) return { type: "dump", line: bd.line, count: bd.count }
  if (canShop(state, seat)) {
    const hand = state.hands[seat] ?? []
    const held = hand.reduce((best, c, t, arr) => (c > (arr[best] ?? 0) ? t : best), 0)
    const prefer = (hand[held] ?? 0) >= 2 && (state.prices[held] ?? 9) <= 5 ? held : null
    let plan = shopPlan(state, seat, { prefer, maxPrice: 4 })
    if (!plan) plan = shopPlan(state, seat, { useBin: true })
    if (plan) return { type: "shop", purchases: plan }
  }
  if (bd && endgame(state) && bd.rev > 0) return { type: "dump", line: bd.line, count: bd.count }
  return null
}

function fastFlipper(state: GameState, seat: number): Action | null {
  if (canDump(state, seat)) {
    let best: { line: number; count: number; rev: number } | null = null
    for (let t = 0; t < 5; t++) {
      const c = dumpMax(state, seat, t)
      if (c > 0 && (state.prices[t] ?? 0) >= 4) {
        const rev = c * (state.prices[t] ?? 0)
        if (!best || rev > best.rev) best = { line: t, count: c, rev }
      }
    }
    if (best) return { type: "dump", line: best.line, count: best.count }
    if (endgame(state)) {
      const bd = bestDump(state, seat, null, 0)
      if (bd && bd.rev > 0) return { type: "dump", line: bd.line, count: bd.count }
    }
  }
  if (canShop(state, seat)) {
    let plan = shopPlan(state, seat, { maxPrice: 3 })
    if (!plan) plan = shopPlan(state, seat, { useBin: true })
    if (plan) return { type: "shop", purchases: plan }
  }
  return null
}

function hoarder(state: GameState, seat: number): Action | null {
  const hand = state.hands[seat] ?? []
  const target = hand.reduce((best, c, t, arr) => (c > (arr[best] ?? 0) ? t : best), 0)
  const c = hand[target] ?? 0
  if (canDump(state, seat) && c > 0 && (state.prices[target] ?? 0) > 0) {
    if (state.bin.length <= 5 || c >= 5) return { type: "dump", line: target, count: c }
  }
  if (canShop(state, seat)) {
    const inRow = state.row.includes(target)
    const afford = (state.coins[seat] ?? 0) >= (state.prices[target] ?? 9)
    const plan =
      inRow && afford && (state.prices[target] ?? 9) <= 6
        ? shopPlan(state, seat, { prefer: target, maxPrice: 6 })
        : shopPlan(state, seat, { useBin: true })
    if (plan) return { type: "shop", purchases: plan }
  }
  return null
}

function sniper(state: GameState, seat: number): Action | null {
  if (canDump(state, seat)) {
    let best: { line: number; count: number; rev: number } | null = null
    for (let t = 0; t < 5; t++) {
      const c = dumpMax(state, seat, t)
      if (c > 0 && (state.prices[t] ?? 0) >= 5) {
        const rev = c * (state.prices[t] ?? 0)
        if (!best || rev > best.rev) best = { line: t, count: c, rev }
      }
    }
    if (best) return { type: "dump", line: best.line, count: best.count }
    if (endgame(state)) {
      const bd = bestDump(state, seat, null, 0)
      if (bd && bd.rev > 0) return { type: "dump", line: bd.line, count: bd.count }
    }
  }
  if (canShop(state, seat) && canBuyBin(state, seat)) {
    const plan = shopPlan(state, seat, { useBin: true })
    if (plan) return { type: "shop", purchases: plan }
  }
  if (canShop(state, seat)) {
    const plan = shopPlan(state, seat, { maxPrice: 2 })
    if (plan) return { type: "shop", purchases: plan }
  }
  return null
}

function clientChaser(state: GameState, seat: number, bonusLine: number, bonus: number): Action | null {
  const bd = canDump(state, seat) ? bestDump(state, seat, bonusLine, bonus) : null
  const threshold = endgame(state) ? 1 : 8
  if (bd && bd.rev >= threshold) return { type: "dump", line: bd.line, count: bd.count }
  if (canShop(state, seat)) {
    let plan = shopPlan(state, seat, { prefer: bonusLine, maxPrice: 5 })
    if (!plan) plan = shopPlan(state, seat, { useBin: true })
    if (plan) return { type: "shop", purchases: plan }
  }
  if (bd && endgame(state) && bd.rev > 0) return { type: "dump", line: bd.line, count: bd.count }
  return null
}

export function pickAIAction(state: GameState, seat: number, style: AiStyle = "balanced"): Action {
  const client = state.clients[seat] ?? 0
  const bonusLine = style === "client_chaser" ? client : null
  const bonus = bonusLine === null ? 0 : 2
  if (state.inFinal && canDump(state, seat)) {
    const bd = bestDump(state, seat, bonusLine, bonus)
    if (bd && bd.rev > 0) return { type: "dump", line: bd.line, count: bd.count }
  }
  let act: Action | null
  if (style === "fast_flipper") act = fastFlipper(state, seat)
  else if (style === "hoarder") act = hoarder(state, seat)
  else if (style === "sniper") act = sniper(state, seat)
  else if (style === "client_chaser") act = clientChaser(state, seat, client, 2)
  else act = balanced(state, seat, bonusLine, bonus)
  return act ?? fallback(state, seat)
}
