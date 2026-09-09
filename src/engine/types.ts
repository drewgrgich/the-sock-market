export const LINE_IDS = ["Argyle", "Mammoth", "NeonTube", "Cashmere", "HoleyGrail"] as const
export const LINE_NAMES = [
  "Argyle Executives",
  "Wooly Mammoths",
  "Neon Tubes",
  "Cursed Cashmere",
  "Holey Grails",
] as const

export const N_LINES = 5
export const PRICE_MAX = 9
export const START_PRICE = 3
export const START_HAND = 3
export const ROW_SIZE = 6
export const BIN_COST = 2
export const SHOP_CAP = 2
export const CLIENT_BONUS = 2

export const DECK_PER_LINE: Record<number, number> = { 3: 9, 4: 11, 5: 13 }
export const SEAT_COINS: Record<number, number[]> = {
  3: [8, 9, 10],
  4: [8, 8, 9, 9],
  5: [8, 8, 9, 9, 10],
}

export const AI_STYLES = [
  "balanced",
  "fast_flipper",
  "hoarder",
  "sniper",
  "client_chaser",
] as const

export type AiStyle = (typeof AI_STYLES)[number]
export type SeatKind = "human" | "ai" | "wholesaler"
export type LaundromatRule = "tiered" | "flat"
export type SockLine = 0 | 1 | 2 | 3 | 4

export type Seat = {
  kind: SeatKind
  style: AiStyle | null
}

export type Purchase =
  | { source: "row"; index: number }
  | { source: "bin" }

export type Action =
  | { type: "shop"; purchases: Purchase[] }
  | { type: "dump"; line: number; count: number }
  | { type: "laundromat" }

export type GameState = {
  seed: string
  n: number
  prices: number[]
  hands: number[][]
  receipts: number[][]
  coins: number[]
  row: number[]
  bin: number[]
  clients: number[]
  current: number
  turnsTaken: number
  endTriggered: boolean
  inFinal: boolean
  finalLeft: number
  gameOver: boolean
  consecLaundromat: number
  seats: Seat[]
  laundromatRule: LaundromatRule
  deckSize: number
  log: string[]
  orderPile: OrderCardId[]
  orderDiscard: OrderCardId[]
  rngDraws: number
  wholesalerCoinAdjust: number
}

export const ORDER_CARDS = [
  "BULK_ORDER",
  "BARGAIN_HUNT",
  "BACK_ROOM",
  "CASH_OUT",
  "FLOOD",
  "CLEARS_THE_FLOOR",
] as const

export type OrderCardId = (typeof ORDER_CARDS)[number]

export const ORDER_DECK: OrderCardId[] = [
  "BULK_ORDER",
  "BARGAIN_HUNT",
  "BARGAIN_HUNT",
  "BACK_ROOM",
  "BACK_ROOM",
  "CASH_OUT",
  "FLOOD",
  "CLEARS_THE_FLOOR",
]

export const ORDER_NAMES: Record<OrderCardId, string> = {
  BULK_ORDER: "BULK ORDER",
  BARGAIN_HUNT: "BARGAIN HUNT",
  BACK_ROOM: "BACK ROOM",
  CASH_OUT: "CASH OUT",
  FLOOD: "FLOOD",
  CLEARS_THE_FLOOR: "CLEARS THE FLOOR",
}

export const WHOLESALER_START = 9

export type SetupOptions = {
  seed: string
  botCount?: 2 | 3 | 4
  seats?: Seat[]
  laundromatRule?: LaundromatRule
  wholesalerCoinAdjust?: number
}

export type Scores = {
  coins: number[]
  bonus: number[]
  total: number[]
  winners: number[]
  shared: boolean
}

export class IllegalActionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "IllegalActionError"
  }
}
