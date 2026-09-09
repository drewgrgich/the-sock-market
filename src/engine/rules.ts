import { checkInvariants, cloneState } from "./state.ts"
import {
  BIN_COST,
  IllegalActionError,
  LINE_NAMES,
  PRICE_MAX,
  ROW_SIZE,
  SHOP_CAP,
  type Action,
  type GameState,
  type Purchase,
} from "./types.ts"
import {
  binAvailable,
  canBuyBin,
  dumpMax,
  isLegalAction,
  laundromatGain,
  refillAllowed,
  rowPrice,
} from "./validators.ts"

function actor(state: GameState): number {
  return state.current
}

export function applyPurchase(state: GameState, purchase: Purchase): GameState {
  const s = cloneState(state)
  const p = actor(s)
  if (s.gameOver) throw new IllegalActionError("game is over")
  if (purchase.source === "bin") {
    if (!canBuyBin(s, p)) throw new IllegalActionError("bin buy is illegal")
    s.coins[p]! -= BIN_COST
    const card = s.bin.pop()
    if (card === undefined) throw new IllegalActionError("bin is empty")
    s.hands[p]![card] += 1
    const faceUp = s.seats[p]?.kind === "wholesaler"
    s.log.push(
      faceUp
        ? `Seat ${p + 1} bought ${LINE_NAMES[card]} from the Bargain Bin into Stash for ${BIN_COST}.`
        : `Seat ${p + 1} bought from the Bargain Bin for ${BIN_COST}.`,
    )
    return s
  }
  return applyRowBuy(s, purchase.index, false)
}

export function tradeCost(marketPrice: number): number {
  return Math.max(0, marketPrice - 1)
}

export function applyRowBuy(state: GameState, index: number, trade: boolean): GameState {
  const s = cloneState(state)
  const p = actor(s)
  if (s.gameOver) throw new IllegalActionError("game is over")
  const line = s.row[index]
  if (line === undefined) throw new IllegalActionError("no row card at that index")
  const market = rowPrice(s, line)
  const price = trade ? tradeCost(market) : market
  if ((s.coins[p] ?? 0) < price) throw new IllegalActionError("cannot afford row card")
  s.coins[p]! -= price
  s.row.splice(index, 1)
  s.hands[p]![line] += 1
  if (s.prices[line]! < PRICE_MAX) s.prices[line]! += 1
  refillRow(s)
  s.log.push(
    trade
      ? `Seat ${p + 1} bought ${LINE_NAMES[line]} at trade price ${price}. Price → ${s.prices[line]}.`
      : `Seat ${p + 1} shopped ${LINE_NAMES[line]} from the Row for ${price}. Price → ${s.prices[line]}.`,
  )
  return s
}

export function takeTwoCoins(state: GameState): GameState {
  const s = cloneState(state)
  const p = actor(s)
  s.coins[p]! += 2
  s.consecLaundromat += 1
  s.log.push(`Seat ${p + 1} takes 2 coins (fallback).`)
  return s
}

export function markBusy(state: GameState): GameState {
  const s = cloneState(state)
  s.consecLaundromat = 0
  return s
}

function refillRow(state: GameState): void {
  while (refillAllowed(state) && state.row.length < ROW_SIZE) {
    const card = state.bin.pop()
    if (card === undefined) break
    state.row.push(card)
  }
}

export function applyAction(state: GameState, action: Action): GameState {
  if (state.gameOver) throw new IllegalActionError("game is over")
  if (!isLegalAction(state, action)) {
    throw new IllegalActionError(`illegal action: ${JSON.stringify(action)}`)
  }
  const p = actor(state)
  if (action.type === "shop") {
    if (action.purchases.length < 1 || action.purchases.length > SHOP_CAP) {
      throw new IllegalActionError("shop must be 1 or 2 purchases")
    }
    let s = cloneState(state)
    for (const purchase of action.purchases) {
      s = applyPurchase(s, purchase)
    }
    s.consecLaundromat = 0
    return s
  }
  if (action.type === "dump") {
    const s = cloneState(state)
    const have = dumpMax(s, p, action.line)
    if (action.count < 1 || action.count > have) {
      throw new IllegalActionError("illegal dump count")
    }
    const price = s.prices[action.line]!
    const revenue = action.count * price
    s.coins[p]! += revenue
    s.hands[p]![action.line] -= action.count
    s.receipts[p]![action.line] += action.count
    s.prices[action.line] = Math.max(0, price - action.count)
    s.consecLaundromat = 0
    s.log.push(
      `Seat ${p + 1} dumped ${action.count} ${LINE_NAMES[action.line]} at ${price} → +${revenue}. Price → ${s.prices[action.line]}.`,
    )
    return s
  }
  const s = cloneState(state)
  const gain = laundromatGain(s, p)
  s.coins[p]! += gain
  s.consecLaundromat += 1
  s.log.push(`Seat ${p + 1} used the Laundromat (+${gain}).`)
  return s
}

export function finishShop(state: GameState): GameState {
  const s = cloneState(state)
  s.consecLaundromat = 0
  return endTurn(s)
}

export function endTurn(state: GameState): GameState {
  const s = cloneState(state)
  s.turnsTaken += 1
  if (!s.endTriggered && s.consecLaundromat >= s.n) {
    s.endTriggered = true
    s.log.push("stall — ending the market")
  }
  if (!s.endTriggered && s.bin.length === 0) {
    s.endTriggered = true
    s.log.push("bin empty — ending the market")
  }
  if (s.inFinal) {
    s.finalLeft -= 1
    if (s.finalLeft <= 0) s.gameOver = true
  } else if (s.endTriggered && s.turnsTaken % s.n === 0) {
    s.inFinal = true
    s.finalLeft = s.n
    s.log.push("final round")
  }
  s.current = (s.current + 1) % s.n
  checkInvariants(s)
  return s
}

export function playTurn(state: GameState, action: Action): GameState {
  return endTurn(applyAction(state, action))
}

export function firstRowIndexOf(state: GameState, line: number): number {
  return state.row.indexOf(line)
}

export { binAvailable, canBuyBin }
