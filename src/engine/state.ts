import {
  DECK_PER_LINE,
  N_LINES,
  ORDER_DECK,
  ROW_SIZE,
  SEAT_COINS,
  START_HAND,
  START_PRICE,
  WHOLESALER_START,
  type GameState,
  type Seat,
  type SetupOptions,
} from "./types.ts"
import { rngFromSeed, shuffle } from "./rng.ts"

export function zeros(): number[] {
  return [0, 0, 0, 0, 0]
}

export function cloneState(state: GameState): GameState {
  return structuredClone(state)
}

function defaultSeats(botCount: 2 | 3 | 4): Seat[] {
  const seats: Seat[] = [{ kind: "human", style: null }]
  for (let i = 0; i < botCount; i++) {
    seats.push({ kind: "ai", style: "balanced" })
  }
  return seats
}

export function setupGame(options: SetupOptions): GameState {
  const seats = options.seats ?? defaultSeats(options.botCount ?? 2)
  const n = seats.length
  if (n < 3 || n > 5) {
    throw new Error(`seat count must be 3–5, got ${n}`)
  }
  const perLine = DECK_PER_LINE[n]
  if (perLine === undefined) {
    throw new Error(`no deck size for ${n} seats`)
  }
  const rng = rngFromSeed(options.seed)
  let deck: number[] = []
  for (let line = 0; line < N_LINES; line++) {
    for (let i = 0; i < perLine; i++) deck.push(line)
  }
  deck = shuffle(deck, rng)

  const hands = Array.from({ length: n }, () => zeros())
  for (let p = 0; p < n; p++) {
    for (let i = 0; i < START_HAND; i++) {
      const card = deck.pop()
      if (card === undefined) throw new Error("deck emptied while dealing hands")
      hands[p]![card] += 1
    }
  }

  const row: number[] = []
  for (let i = 0; i < ROW_SIZE; i++) {
    const card = deck.pop()
    if (card === undefined) throw new Error("deck emptied while dealing row")
    row.push(card)
  }

  const clientDeck = shuffle([0, 1, 2, 3, 4], rng)
  const clients = clientDeck.slice(0, n)
  const adjust = options.wholesalerCoinAdjust ?? 0
  const hasWholesaler = seats.some((s) => s.kind === "wholesaler")
  const orderPile = hasWholesaler ? shuffle([...ORDER_DECK], rng) : []
  const start = Math.floor(rng() * n)
  const table = SEAT_COINS[n] ?? []
  const coins = Array.from({ length: n }, (_, p) => {
    if (seats[p]?.kind === "wholesaler") return WHOLESALER_START + adjust
    const offset = (p - start + n) % n
    return table[offset] ?? 8
  })
  const deckSize = N_LINES * perLine

  return {
    seed: options.seed,
    n,
    prices: Array.from({ length: N_LINES }, () => START_PRICE),
    hands,
    receipts: Array.from({ length: n }, () => zeros()),
    coins,
    row,
    bin: deck,
    clients,
    current: start,
    turnsTaken: 0,
    endTriggered: false,
    inFinal: false,
    finalLeft: 0,
    gameOver: false,
    consecLaundromat: 0,
    seats,
    laundromatRule: options.laundromatRule ?? "tiered",
    deckSize,
    log: [`setup seed=${options.seed} seats=${n}`, `Seat ${start + 1} starts.`],
    orderPile,
    orderDiscard: [],
    rngDraws: 0,
    wholesalerCoinAdjust: adjust,
  }
}

export type TestOverrides = {
  n?: number
  prices?: number[]
  hands?: number[][]
  receipts?: number[][]
  coins?: number[]
  row?: number[]
  bin?: number[]
  clients?: number[]
  current?: number
  turnsTaken?: number
  endTriggered?: boolean
  inFinal?: boolean
  finalLeft?: number
  gameOver?: boolean
  consecLaundromat?: number
  laundromatRule?: GameState["laundromatRule"]
  seats?: Seat[]
  seed?: string
  orderPile?: GameState["orderPile"]
  orderDiscard?: GameState["orderDiscard"]
  rngDraws?: number
  wholesalerCoinAdjust?: number
}

export function createTestState(overrides: TestOverrides = {}): GameState {
  const n = overrides.n ?? 3
  const seats =
    overrides.seats ??
    Array.from({ length: n }, (_, i) =>
      i === 0 ? { kind: "human" as const, style: null } : { kind: "ai" as const, style: "balanced" as const },
    )
  const state: GameState = {
    seed: overrides.seed ?? "test",
    n,
    prices: overrides.prices ?? Array.from({ length: N_LINES }, () => START_PRICE),
    hands: overrides.hands ?? Array.from({ length: n }, () => zeros()),
    receipts: overrides.receipts ?? Array.from({ length: n }, () => zeros()),
    coins: overrides.coins ?? (SEAT_COINS[n] ?? Array.from({ length: n }, () => 8)).slice(),
    row: overrides.row ?? [0, 1, 2, 3, 4, 0],
    bin: overrides.bin ?? [1, 1, 1, 1, 1, 1, 2, 2, 2],
    clients: overrides.clients ?? Array.from({ length: n }, (_, i) => i),
    current: overrides.current ?? 0,
    turnsTaken: overrides.turnsTaken ?? 0,
    endTriggered: overrides.endTriggered ?? false,
    inFinal: overrides.inFinal ?? false,
    finalLeft: overrides.finalLeft ?? 0,
    gameOver: overrides.gameOver ?? false,
    consecLaundromat: overrides.consecLaundromat ?? 0,
    seats,
    laundromatRule: overrides.laundromatRule ?? "tiered",
    deckSize: 0,
    log: [],
    orderPile: overrides.orderPile ?? [],
    orderDiscard: overrides.orderDiscard ?? [],
    rngDraws: overrides.rngDraws ?? 0,
    wholesalerCoinAdjust: overrides.wholesalerCoinAdjust ?? 0,
  }
  state.deckSize = countCards(state)
  return state
}

export function countCards(state: GameState): number {
  let total = state.bin.length + state.row.length
  for (const hand of state.hands) for (const c of hand) total += c
  for (const rec of state.receipts) for (const c of rec) total += c
  return total
}

export function checkInvariants(state: GameState): void {
  const total = countCards(state)
  if (total !== state.deckSize) {
    throw new Error(`card conservation broken: ${total} != ${state.deckSize}`)
  }
  for (const p of state.prices) {
    if (p < 0 || p > 9) throw new Error(`price out of range: ${p}`)
  }
  for (const c of state.coins) {
    if (c < 0) throw new Error(`negative coins: ${c}`)
  }
}
