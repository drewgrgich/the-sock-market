import { pickAIAction } from "./ai.ts"
import { playTurn } from "./rules.ts"
import { scoreGame } from "./scoring.ts"
import type { Action, GameState, Scores } from "./types.ts"
import { playWholesalerTurn } from "./wholesaler.ts"

export function advanceSeat(state: GameState): GameState {
  const seat = state.seats[state.current]
  if (seat?.kind === "wholesaler") return playWholesalerTurn(state)
  const style = seat?.style ?? "balanced"
  return playTurn(state, pickAIAction(state, state.current, style))
}

export function runGame(state: GameState, pick?: (state: GameState, seat: number) => Action): {
  state: GameState
  scores: Scores
} {
  let s = state
  let guard = 0
  while (!s.gameOver && guard < 400) {
    s = pick ? playTurn(s, pick(s, s.current)) : advanceSeat(s)
    guard += 1
  }
  if (!s.gameOver) throw new Error("game did not end within 400 turns")
  return { state: s, scores: scoreGame(s) }
}
