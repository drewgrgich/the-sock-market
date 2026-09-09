import { CLIENT_BONUS, type GameState, type Scores } from "./types.ts"

export function scoreGame(state: GameState): Scores {
  const bonus = state.clients.map((line, p) => CLIENT_BONUS * (state.receipts[p]?.[line] ?? 0))
  const coins = state.coins.slice()
  const total = coins.map((c, p) => c + (bonus[p] ?? 0))
  const best = Math.max(...total)
  const tied = total.map((t, p) => (t === best ? p : -1)).filter((p) => p >= 0)
  if (tied.length === 1) {
    return { coins, bonus, total, winners: tied, shared: false }
  }
  const handSizes = tied.map((p) => (state.hands[p] ?? []).reduce((a, b) => a + b, 0))
  const least = Math.min(...handSizes)
  const winners = tied.filter((_, i) => handSizes[i] === least)
  return { coins, bonus, total, winners, shared: winners.length > 1 }
}

export function handSize(state: GameState, seat: number): number {
  return (state.hands[seat] ?? []).reduce((a, b) => a + b, 0)
}
