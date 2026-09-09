import { hashSeed, mulberry32, shuffle } from "./rng.ts"
import { applyAction, applyPurchase, applyRowBuy, endTurn, markBusy, takeTwoCoins, tradeCost } from "./rules.ts"
import { cloneState } from "./state.ts"
import { N_LINES, ORDER_NAMES, type GameState, type OrderCardId } from "./types.ts"
import { binAvailable, canBuyBin } from "./validators.ts"

function leftmostHot(prices: number[], lines: number[]): number {
  let best = lines[0]!
  for (const t of lines) {
    if (prices[t]! > prices[best]!) best = t
    else if (prices[t] === prices[best] && t < best) best = t
  }
  return best
}

function leftmostCold(prices: number[], lines: number[]): number {
  let best = lines[0]!
  for (const t of lines) {
    if (prices[t]! < prices[best]!) best = t
    else if (prices[t] === prices[best] && t < best) best = t
  }
  return best
}

function biggestHeld(state: GameState, seat: number): number | null {
  const hand = state.hands[seat] ?? []
  let best = -1
  let bestCount = 0
  for (let t = 0; t < N_LINES; t++) {
    const c = hand[t] ?? 0
    if (c > bestCount || (c === bestCount && c > 0 && (best < 0 || t < best))) {
      bestCount = c
      best = t
    }
  }
  return bestCount > 0 ? best : null
}

function heldLines(state: GameState, seat: number): number[] {
  const out: number[] = []
  for (let t = 0; t < N_LINES; t++) {
    if ((state.hands[seat]?.[t] ?? 0) > 0) out.push(t)
  }
  return out
}

function firstIndexOf(row: number[], line: number): number {
  return row.indexOf(line)
}

function affordableTradeIndices(state: GameState, seat: number): number[] {
  const coins = state.coins[seat] ?? 0
  const out: number[] = []
  for (let i = 0; i < state.row.length; i++) {
    const line = state.row[i]!
    if (coins >= tradeCost(state.prices[line] ?? 0)) out.push(i)
  }
  return out
}

function pickAffordableByPrice(
  state: GameState,
  seat: number,
  wantHigh: boolean,
): number | null {
  const idxs = affordableTradeIndices(state, seat)
  if (idxs.length === 0) return null
  let best = idxs[0]!
  for (const i of idxs) {
    const line = state.row[i]!
    const bl = state.row[best]!
    const p = state.prices[line]!
    const bp = state.prices[bl]!
    if (wantHigh ? p > bp : p < bp) best = i
    else if (p === bp && line < bl) best = i
  }
  return best
}

function buyNamed(
  state: GameState,
  line: number,
  wantHighFallback: boolean,
): { state: GameState; did: "buy" | "bin" | "none" } {
  const seat = state.current
  const idx = firstIndexOf(state.row, line)
  if (idx >= 0 && (state.coins[seat] ?? 0) >= tradeCost(state.prices[line] ?? 0)) {
    return { state: markBusy(applyRowBuy(state, idx, true)), did: "buy" }
  }
  const fb = pickAffordableByPrice(state, seat, wantHighFallback)
  if (fb !== null) {
    return { state: markBusy(applyRowBuy(state, fb, true)), did: "buy" }
  }
  if (canBuyBin(state, seat)) {
    return { state: markBusy(applyPurchase(state, { source: "bin" })), did: "bin" }
  }
  return { state, did: "none" }
}

function bulkOrder(state: GameState): GameState {
  const hot = leftmostHot(state.prices, [0, 1, 2, 3, 4])
  const result = buyNamed(state, hot, true)
  return result.did === "none" ? takeTwoCoins(state) : result.state
}

function bargainHunt(state: GameState): GameState {
  let s = state
  let did = false
  for (let n = 0; n < 2; n++) {
    const cold = leftmostCold(s.prices, [0, 1, 2, 3, 4])
    const result = buyNamed(s, cold, false)
    if (result.did === "none") break
    s = result.state
    did = true
  }
  return did ? s : takeTwoCoins(state)
}

function backRoom(state: GameState): GameState {
  let s = state
  let bought = 0
  while (bought < 2 && canBuyBin(s, s.current) && !s.inFinal) {
    s = markBusy(applyPurchase(s, { source: "bin" }))
    bought += 1
  }
  if (bought > 0) return s
  const cheap = pickAffordableByPrice(s, s.current, false)
  if (cheap !== null) return markBusy(applyRowBuy(s, cheap, true))
  if (binAvailable(s) && canBuyBin(s, s.current)) {
    return markBusy(applyPurchase(s, { source: "bin" }))
  }
  return takeTwoCoins(s)
}

function cashOut(state: GameState): GameState {
  const seat = state.current
  const held = heldLines(state, seat)
  if (held.length === 0) return bargainHunt(state)
  const target = leftmostHot(state.prices, held)
  if ((state.prices[target] ?? 0) <= 0) return bargainHunt(state)
  const count = state.hands[seat]![target]!
  return markBusy(applyAction(state, { type: "dump", line: target, count }))
}

function flood(state: GameState): GameState {
  const seat = state.current
  const target = biggestHeld(state, seat)
  if (target === null) return bargainHunt(state)
  if ((state.prices[target] ?? 0) <= 0) return bargainHunt(state)
  const count = state.hands[seat]![target]!
  return markBusy(applyAction(state, { type: "dump", line: target, count }))
}

function clearsTheFloor(state: GameState): GameState {
  const seat = state.current
  const held = heldLines(state, seat)
  if (held.length === 0) return bargainHunt(state)
  const order = held.slice().sort((a, b) => {
    const dp = (state.prices[b] ?? 0) - (state.prices[a] ?? 0)
    return dp !== 0 ? dp : a - b
  })
  let s = state
  let sold = false
  for (const line of order) {
    const price = s.prices[line] ?? 0
    const count = s.hands[seat]?.[line] ?? 0
    if (price <= 0 || count < 1) continue
    s = markBusy(applyAction(s, { type: "dump", line, count }))
    sold = true
  }
  if (!sold) return bargainHunt(state)
  return s
}

function drawOrderCard(state: GameState): { state: GameState; card: OrderCardId } {
  let s = cloneState(state)
  if (s.orderPile.length === 0) {
    s.rngDraws += 1
    const rng = mulberry32(hashSeed(`${s.seed}:order:${s.rngDraws}`))
    s.orderPile = shuffle(s.orderDiscard, rng)
    s.orderDiscard = []
    s.log.push("Order deck reshuffled.")
  }
  const card = s.orderPile.pop()
  if (!card) {
    s = takeTwoCoins(s)
    return { state: s, card: "BARGAIN_HUNT" }
  }
  s.orderDiscard.push(card)
  s.log.push(`Seat ${s.current + 1} flipped ${ORDER_NAMES[card]}.`)
  return { state: s, card }
}

export function resolveOrderCard(state: GameState, card: OrderCardId): GameState {
  if (card === "BULK_ORDER") return bulkOrder(state)
  if (card === "BARGAIN_HUNT") return bargainHunt(state)
  if (card === "BACK_ROOM") return backRoom(state)
  if (card === "CASH_OUT") return cashOut(state)
  if (card === "FLOOD") return flood(state)
  return clearsTheFloor(state)
}

export function playWholesalerTurn(state: GameState): GameState {
  const drawn = drawOrderCard(state)
  const resolved = resolveOrderCard(drawn.state, drawn.card)
  return endTurn(resolved)
}

export { leftmostHot, leftmostCold, biggestHeld }
