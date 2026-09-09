import { LINE_NAMES, type GameState } from "../engine/index.ts"

export function seatTitle(state: GameState, seat: number): string {
  const info = state.seats[seat]
  if (!info) return `Seat ${seat + 1}`
  if (info.kind === "human") return `Seat ${seat + 1} · You`
  if (info.kind === "wholesaler") return `Seat ${seat + 1} · Wholesaler`
  const style =
    info.style === "fast_flipper"
      ? "Fast Flipper"
      : info.style === "client_chaser"
        ? "Client Chaser"
        : info.style
          ? info.style[0]!.toUpperCase() + info.style.slice(1)
          : "AI"
  return `Seat ${seat + 1} · AI · ${style}`
}

export function countsByLine(counts: number[]): string {
  const parts: string[] = []
  for (let i = 0; i < counts.length; i++) {
    const n = counts[i] ?? 0
    if (n > 0) parts.push(`${LINE_NAMES[i]} ×${n}`)
  }
  return parts.length ? parts.join(", ") : "none"
}

export function humanSeat(state: GameState): number {
  const i = state.seats.findIndex((s) => s.kind === "human")
  return i >= 0 ? i : 0
}
