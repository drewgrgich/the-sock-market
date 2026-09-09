import { BIN_COST, PRICE_MAX, type Action, type GameState, type Purchase } from "./types.ts"

export function binAvailable(state: GameState): boolean {
  return state.bin.length > 0 && !state.inFinal
}

export function refillAllowed(state: GameState): boolean {
  return state.bin.length > 0 && !state.inFinal
}

export function rowPrice(state: GameState, line: number): number {
  return state.prices[line] ?? PRICE_MAX
}

export function canBuyBin(state: GameState, seat: number): boolean {
  return binAvailable(state) && (state.coins[seat] ?? 0) >= BIN_COST
}

export function affordableRowIndices(state: GameState, seat: number): number[] {
  const coins = state.coins[seat] ?? 0
  const out: number[] = []
  for (let i = 0; i < state.row.length; i++) {
    const line = state.row[i]!
    if (coins >= rowPrice(state, line)) out.push(i)
  }
  return out
}

export function canShop(state: GameState, seat: number): boolean {
  return affordableRowIndices(state, seat).length > 0 || canBuyBin(state, seat)
}

export function canDump(state: GameState, seat: number): boolean {
  const hand = state.hands[seat]
  if (!hand) return false
  return hand.some((c) => c > 0)
}

export function dumpMax(state: GameState, seat: number, line: number): number {
  return state.hands[seat]?.[line] ?? 0
}

export function laundromatGain(state: GameState, seat: number): number {
  if (state.laundromatRule === "flat") return 2
  return (state.coins[seat] ?? 0) <= 5 ? 2 : 1
}

export function legalActionKinds(state: GameState, seat: number): Action["type"][] {
  const kinds: Action["type"][] = []
  if (canShop(state, seat)) kinds.push("shop")
  if (canDump(state, seat)) kinds.push("dump")
  kinds.push("laundromat")
  return kinds
}

export function isLegalPurchase(state: GameState, seat: number, purchase: Purchase): boolean {
  if (purchase.source === "bin") return canBuyBin(state, seat)
  const line = state.row[purchase.index]
  if (line === undefined) return false
  return (state.coins[seat] ?? 0) >= rowPrice(state, line)
}

export function isLegalAction(state: GameState, action: Action): boolean {
  const seat = state.current
  if (action.type === "laundromat") return true
  if (action.type === "dump") {
    return action.count >= 1 && dumpMax(state, seat, action.line) >= action.count
  }
  if (action.purchases.length < 1 || action.purchases.length > 2) return false
  let s = {
    ...state,
    coins: state.coins.slice(),
    hands: state.hands.map((h) => h.slice()),
    row: state.row.slice(),
    bin: state.bin.slice(),
    prices: state.prices.slice(),
  }
  for (const purchase of action.purchases) {
    if (!isLegalPurchase(s, seat, purchase)) return false
    if (purchase.source === "bin") {
      s.coins[seat] = (s.coins[seat] ?? 0) - BIN_COST
      s.bin.pop()
    } else {
      const line = s.row[purchase.index]
      if (line === undefined) return false
      s.coins[seat] = (s.coins[seat] ?? 0) - rowPrice(s, line)
      s.row.splice(purchase.index, 1)
      if (s.prices[line]! < PRICE_MAX) s.prices[line]! += 1
      if (s.bin.length > 0 && !s.inFinal && s.row.length < 6) {
        s.row.push(s.bin.pop()!)
      }
    }
  }
  return true
}
