import { pickAIAction } from "./ai.ts"
import { applyPurchase } from "./rules.ts"
import { cloneState } from "./state.ts"
import { LINE_NAMES, type Action, type GameState, type Purchase } from "./types.ts"
import { isLegalAction, laundromatGain } from "./validators.ts"

export type ShopStep = { source: "bin" } | { source: "row"; line: number }

export type CoachHint = {
  action: Action
  principle: string
  move: string
}

export type TakenPlay =
  | { type: "laundromat" }
  | { type: "dump"; line: number; count: number }
  | { type: "shop"; steps: ShopStep[] }

function closing(state: GameState): boolean {
  return state.inFinal || state.bin.length <= state.n
}

export function resolveShop(state: GameState, purchases: Purchase[]): ShopStep[] {
  let s = cloneState(state)
  const steps: ShopStep[] = []
  for (const purchase of purchases) {
    if (purchase.source === "bin") steps.push({ source: "bin" })
    else {
      const line = s.row[purchase.index]
      if (line === undefined) continue
      steps.push({ source: "row", line })
    }
    s = applyPurchase(s, purchase)
  }
  return steps
}

function shopPhrase(state: GameState, purchases: Purchase[]): string {
  const steps = resolveShop(state, purchases)
  const bits = steps.map((step) => {
    if (step.source === "bin") return "the Bargain Bin (2)"
    const price = state.prices[step.line] ?? 0
    return `${LINE_NAMES[step.line]} from the Row (${price})`
  })
  if (bits.length === 0) return "Shop"
  if (bits.length === 1) return `Shop ${bits[0]}`
  return `Shop ${bits.join(", then ")}`
}

function dumpPhrase(state: GameState, line: number, count: number): string {
  const price = state.prices[line] ?? 0
  return `Dump ${count} ${LINE_NAMES[line]} at ${price} → +${count * price}`
}

function principleFor(state: GameState, seat: number, action: Action): string {
  if (action.type === "dump") {
    const price = state.prices[action.line] ?? 0
    const rev = action.count * price
    if (closing(state)) {
      return "The market is closing. Leftover socks score 0 — cash out while a line still pays."
    }
    if (price >= 5) {
      return "Dump a hot line. A high price now beats hoping it climbs while someone else sells first."
    }
    if (rev >= 8) {
      return "A Dump that pays 8+ is usually worth taking. Don't wait for a perfect stack."
    }
    return "Dump when the payout is real. Selling at 0–2 just cheapens the line."
  }
  if (action.type === "shop") {
    const first = action.purchases[0]
    if (first?.source === "bin") {
      return "Bargain Bin costs 2 and doesn't raise a price. Use it when the Row is expensive."
    }
    const line = first && first.source === "row" ? state.row[first.index] : undefined
    const price = line != null ? (state.prices[line] ?? 9) : 9
    if (line === state.clients[seat]) {
      return "Shopping your Client line builds Receipts that pay +2 at the end."
    }
    if (price <= 3) {
      return "Buy low on the Row. Cheap socks now dump for more later, and you only bump the price by 1."
    }
    return "Shop to build a Dump. Prefer a line you already hold if it's still cheap."
  }
  if ((state.coins[seat] ?? 0) <= 5) {
    return "Laundromat is the cash drip. Take +2 at 5 coins or fewer so you can Shop next turn."
  }
  return "If nothing cheap is on the Row and no Dump pays, take the coin rather than force a bad Shop."
}

function moveFor(state: GameState, seat: number, action: Action): string {
  if (action.type === "dump") return dumpPhrase(state, action.line, action.count)
  if (action.type === "shop") return shopPhrase(state, action.purchases)
  return `Laundromat for +${laundromatGain(state, seat)}`
}

export function coachHint(state: GameState, seat: number): CoachHint {
  const s = cloneState(state)
  s.current = seat
  const action = pickAIAction(s, seat, "balanced")
  if (!isLegalAction(s, action)) {
    return {
      action: { type: "laundromat" },
      principle: "If nothing else is legal, take the coins.",
      move: `Laundromat for +${laundromatGain(s, seat)}`,
    }
  }
  return { action, principle: principleFor(s, seat, action), move: moveFor(s, seat, action) }
}

function shopKey(steps: ShopStep[]): string {
  return steps.map((s) => (s.source === "bin" ? "bin" : `row:${s.line}`)).join(",")
}

function shortTaken(taken: TakenPlay): string {
  if (taken.type === "laundromat") return "used the Laundromat"
  if (taken.type === "dump") return `dumped ${LINE_NAMES[taken.line]}`
  const steps = taken.steps
  if (steps[0]?.source === "bin") return "shopped the Bargain Bin"
  if (steps[0]?.source === "row") return `shopped ${LINE_NAMES[steps[0].line]}`
  return "shopped"
}

export function gradePlay(hint: CoachHint, taken: TakenPlay, at: GameState): string {
  const coach = hint.action
  if (taken.type === "laundromat" && coach.type === "laundromat") return "Coach agrees."
  if (taken.type === "dump" && coach.type === "dump") {
    if (taken.line === coach.line && taken.count === coach.count) return "Coach agrees."
    if (taken.line === coach.line) {
      return `Coach agrees on ${LINE_NAMES[coach.line]} — would sell ${coach.count}.`
    }
    return `Coach would have ${hint.move}. You dumped ${LINE_NAMES[taken.line]}.`
  }
  if (taken.type === "shop" && coach.type === "shop") {
    if (shopKey(taken.steps) === shopKey(resolveShop(at, coach.purchases))) return "Coach agrees."
    return `Coach would have ${hint.move}. You ${shortTaken(taken)}.`
  }
  return `Coach would have ${hint.move}. You ${shortTaken(taken)}.`
}
